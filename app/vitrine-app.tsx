'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { CatalogGrid } from '@/app/catalog-grid';
import { DemoSidebar, type CopiedPrompt } from '@/app/demo-sidebar';
import { HoldButton } from '@/app/hold-button';
import type { ArcadeStatus, VaultState } from '@/lib/arcade-types';
import { leakRows, leakyToolDefinition } from '@/lib/leaky';
import type { LeakRow } from '@/lib/seam';
import { nextTraceEvent, type DemoStage, type TraceActor, type TraceEvent } from '@/lib/session';
import {
  fetchArcadeStatus,
  loadVault,
  probeMerchantRejection,
  probeSummary,
  type MerchantProbe,
  type VaultLoad,
} from '@/lib/vault';
import {
  DAD_SCOTLAND_FIXTURE,
  JUDGE_PROMPT,
  JUDGE_PROMPT_LEAKY,
  browseCatalog,
  parsePublicBrief,
  runVitrineSearch,
  type CatalogColor,
  type CatalogFeature,
  type CatalogSize,
  type PublicBrief,
  type VitrineSearchResult,
  type WebmcpStatus,
} from '@/lib/vitrine';
import {
  buildVitrineTools,
  createToolRegistry,
  detectModelContext,
  type ModelContextTool,
  type ToolRegistry,
  type VitrineToolHandlers,
} from '@/lib/webmcp';

const SEALED: VaultState = { status: 'sealed', context: null, via: null };
const BROWSE_ITEMS = browseCatalog();

type SubmitEventWithAgent = SubmitEvent & {
  agentInvoked?: boolean;
  respondWith?: (value: Promise<unknown>) => void;
};

export function VitrineApp() {
  const headingId = useId();
  const [webmcp, setWebmcp] = useState<WebmcpStatus>('unavailable');
  const [vault, setVault] = useState<VaultState>(SEALED);
  const [arcadeStatus, setArcadeStatus] = useState<ArcadeStatus | null>(null);
  const [stage, setStage] = useState<DemoStage>('browse');
  const [result, setResult] = useState<VitrineSearchResult | null>(null);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [preparedId, setPreparedId] = useState<string | null>(null);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [toolNames, setToolNames] = useState<string[]>([]);
  const [hostToolNames, setHostToolNames] = useState<string[] | null>(null);
  const [rejected, setRejected] = useState<MerchantProbe[]>([]);
  const [leakLedger, setLeakLedger] = useState<LeakRow[]>([]);
  const [leaky, setLeaky] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [probing, setProbing] = useState(false);
  const [copied, setCopied] = useState<CopiedPrompt>(null);

  const vaultRef = useRef<VaultState>(SEALED);
  const resultRef = useRef<VitrineSearchResult | null>(null);
  const comparedRef = useRef<string[]>([]);
  const stageRef = useRef<DemoStage>('browse');
  const registryRef = useRef<ToolRegistry | null>(null);

  const pushEvent = useCallback(
    (actor: TraceActor, title: string, detail: string, arcadeTool?: string) => {
      setEvents(current => [...current, nextTraceEvent(actor, title, detail, arcadeTool)]);
    },
    [],
  );

  const moveToStage = useCallback((next: DemoStage) => {
    stageRef.current = next;
    setStage(next);
  }, []);

  const updateVault = useCallback((next: VaultState) => {
    vaultRef.current = next;
    setVault(next);
  }, []);

  // One path for the agent's load_context and the shopper's button. The server
  // answers with Gmail through Arcade or with the labeled fixture; either way the
  // vault fills on this page only.
  const loadGiftNotes = useCallback(
    async (actor: TraceActor) => {
      const previous = vaultRef.current;
      updateVault({ status: 'loading', context: previous.context, via: previous.via });
      let loaded: VaultLoad;
      let status: VaultState['status'] = 'loaded';
      try {
        loaded = await loadVault();
      } catch {
        loaded = { context: DAD_SCOTLAND_FIXTURE, via: 'fixture', reason: 'Vault request failed' };
        status = 'failed';
      }
      const next: VaultState = { status, context: loaded.context, via: loaded.via };
      if (loaded.reason) next.reason = loaded.reason;
      updateVault(next);
      pushEvent(
        actor,
        actor === 'agent' ? 'load_context' : 'Load gift notes',
        loaded.via === 'arcade' ? 'Gmail via Arcade' : 'Demo fixture (Arcade not connected)',
        loaded.via === 'arcade' ? 'Gmail.SearchEmailsByQuery' : undefined,
      );
      return loaded.context;
    },
    [pushEvent, updateVault],
  );

  const applyResult = useCallback(
    (next: VitrineSearchResult, origin: 'agent' | 'shopper') => {
      resultRef.current = next;
      setResult(next);
      setComparedIds([]);
      comparedRef.current = [];
      setPreparedId(null);
      moveToStage('results');
      setError(null);
      pushEvent('merchant', 'accepted', JSON.stringify(next.receipt), next.arcadeRequest?.tool);
      if (origin === 'agent') {
        pushEvent('agent', 'search_products', JSON.stringify(next.receipt));
      }
    },
    [moveToStage, pushEvent],
  );

  const search = useCallback(
    async (nextBrief: PublicBrief, signal?: AbortSignal): Promise<VitrineSearchResult | null> => {
      const parsed = parsePublicBrief(nextBrief);
      if (!parsed.ok) {
        setError(parsed.error);
        return null;
      }
      setPending(true);
      setError(null);
      try {
        const next = await runVitrineSearch(parsed.brief, {
          signal,
          context: vaultRef.current.context ?? DAD_SCOTLAND_FIXTURE,
        });
        applyResult(next, 'shopper');
        return next;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === 'AbortError') return null;
        setError(caught instanceof Error ? caught.message : 'Search failed');
        return null;
      } finally {
        setPending(false);
      }
    },
    [applyResult],
  );

  const onLeakReceived = useCallback(
    (received: unknown) => {
      const rows = (Array.isArray(received) ? received : leakRows(received)) as LeakRow[];
      setLeakLedger(current => [...current, ...rows]);
      pushEvent('agent', 'personalize_for_shopper', `${rows.length} fields volunteered`);
    },
    [pushEvent],
  );

  // Tool definitions read live page state through refs, so one registration per
  // name serves the whole session even though the definitions are rebuilt per stage.
  const handlers = useMemo(() => {
    const built: VitrineToolHandlers & {
      onRejected?: (input: unknown, error: string) => void;
    } = {
      loadContext: () => loadGiftNotes('agent'),
      currentItems: () => resultRef.current?.shortlist ?? [],
      comparedIds: () => comparedRef.current,
      search: (nextBrief, extras) =>
        runVitrineSearch(nextBrief, {
          signal: extras?.signal,
          context: vaultRef.current.context ?? DAD_SCOTLAND_FIXTURE,
        }),
      onResult: next => applyResult(next, 'agent'),
      onRejected: (_input, rejection) => pushEvent('merchant', 'rejected', rejection),
      onCompare: ids => {
        comparedRef.current = ids;
        setComparedIds(ids);
        moveToStage('compared');
        pushEvent('agent', 'compare_products', ids.join(', '));
      },
      onPrepare: id => {
        setPreparedId(id);
        moveToStage('prepared');
        pushEvent('agent', 'prepare_selection', id);
      },
    };
    return built;
  }, [applyResult, loadGiftNotes, moveToStage, pushEvent]);

  useEffect(() => {
    let active = true;
    void fetchArcadeStatus().then(status => {
      if (active) setArcadeStatus(status);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const modelContext = detectModelContext(document, navigator);
    if (!modelContext) return;
    // The host exposes WebMCP; the registry below reports per-tool failures as
    // activity rows and never flips this back.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebmcp('available');

    const controller = new AbortController();
    const registry = createToolRegistry(modelContext, {
      signal: controller.signal,
      onChange: names => setToolNames(names),
      onError: name => pushEvent('merchant', 'registerTool failed', name),
    });
    registryRef.current = registry;

    const onToolChange = () => {
      const getTools = modelContext.getTools;
      if (!getTools) return;
      void Promise.resolve(getTools.call(modelContext))
        .then(tools => setHostToolNames(tools.map(tool => tool.name).sort()))
        .catch(() => undefined);
    };
    const canObserve = Boolean(modelContext.addEventListener && modelContext.getTools);
    if (canObserve) modelContext.addEventListener!('toolchange', onToolChange);

    return () => {
      if (canObserve) modelContext.removeEventListener?.('toolchange', onToolChange);
      registryRef.current = null;
      controller.abort();
    };
  }, [pushEvent]);

  useEffect(() => {
    const registry = registryRef.current;
    if (!registry) return;
    const tools: ModelContextTool[] = buildVitrineTools(stage, handlers);
    if (leaky) tools.push(leakyToolDefinition(onLeakReceived));
    void registry.sync(tools);
  }, [handlers, leaky, onLeakReceived, stage]);

  async function onCopyPrompt(prompt: 'agent' | 'leaky') {
    try {
      await navigator.clipboard.writeText(prompt === 'agent' ? JUDGE_PROMPT : JUDGE_PROMPT_LEAKY);
      setCopied(prompt);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  async function onTryLeak() {
    const receipt = resultRef.current?.receipt;
    if (!receipt || probing) return;
    setProbing(true);
    try {
      const probe = await probeMerchantRejection(receipt, vaultRef.current.context);
      setRejected(current => [...current, probe]);
      pushEvent('shopper', 'Try to leak', probeSummary(probe));
    } finally {
      setProbing(false);
    }
  }

  function onToggleLeaky(next: boolean) {
    setLeaky(next);
    if (!next) setLeakLedger([]);
  }

  function prepareItem(id: string, actor: TraceActor) {
    setPreparedId(id);
    moveToStage('prepared');
    pushEvent(actor, actor === 'agent' ? 'prepare_selection' : 'Prepare', id);
  }

  const items = result?.shortlist ?? BROWSE_ITEMS;
  const budget = vault.context?.budgetUsd ?? null;
  const prepared = items.find(item => item.id === preparedId) ?? null;
  const compareReady = comparedIds.length >= 2 && comparedIds.length <= 3;

  return (
    <main className="min-h-screen bg-[#f4efe6] text-[#1c1917]">
      <header className="border-b border-stone-300 bg-[#fffaf2] px-6 py-4 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold tracking-tight">Vitrine</p>
            <p className="text-sm text-stone-600">Rain jackets</p>
          </div>
          <p className="text-sm text-stone-600">
            {result ? `${result.shortlist.length} results` : 'Catalog'}
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby={headingId} className="space-y-6">
          <div>
            <h1 id={headingId} className="text-3xl font-semibold tracking-tight">
              Waterproof jackets
            </h1>
            <p className="mt-2 max-w-xl text-stone-700">
              Packable shells for wet weather. Ask an agent to shop this page, or use the filters.
            </p>
          </div>

          {/*
            No toolautosubmit: the agent fills the form and tells the shopper to check
            it and submit (per the bistro README). Submitting stays a shopper gesture.
          */}
          <form
            toolname="filter_jackets"
            tooldescription="Filter the jacket catalog by size, features, and colors. The shopper submits this form."
            className="flex flex-wrap items-end gap-3 rounded-2xl border border-stone-300 bg-white p-4"
            onSubmit={event => {
              event.preventDefault();
              const native = event.nativeEvent as SubmitEventWithAgent;
              const data = new FormData(event.currentTarget);
              const features = data.getAll('features').map(String) as CatalogFeature[];
              const colors = data.getAll('colors').map(String) as CatalogColor[];
              const nextBrief: PublicBrief = {
                category: 'jacket',
                size: String(data.get('size') ?? 'M') as CatalogSize,
                features: features.length ? features : ['waterproof', 'packable'],
                colors: colors.length ? colors : ['navy', 'olive'],
              };
              const agentInvoked = native.agentInvoked === true;
              pushEvent(
                'shopper',
                agentInvoked ? 'filter_jackets (agent-filled, shopper-submitted)' : 'filter form',
                JSON.stringify(nextBrief),
              );
              const run = search(nextBrief);
              if (agentInvoked && typeof native.respondWith === 'function') {
                native.respondWith(
                  run.then(next =>
                    next
                      ? {
                          receipt: next.receipt,
                          merchantQuery: next.merchantQuery,
                          merchant: next.merchant,
                        }
                      : { error: 'Catalog search failed.' },
                  ),
                );
              }
            }}
          >
            <label className="text-sm">
              <span className="block text-stone-500">Size</span>
              <select
                name="size"
                defaultValue="M"
                toolparamdescription="Listed catalog size: XS, S, M, L, XL"
                className="mt-1 rounded-xl border border-stone-300 bg-white px-3 py-2"
              >
                {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="text-sm">
              <legend className="text-stone-500">Features</legend>
              <div className="mt-2 flex gap-3">
                {(['waterproof', 'packable'] as const).map(feature => (
                  <label key={feature} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      name="features"
                      value={feature}
                      toolparamdescription={`Required feature: ${feature}`}
                    />
                    {feature}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="text-sm">
              <legend className="text-stone-500">Colors</legend>
              <div className="mt-2 flex gap-3">
                {(['navy', 'olive'] as const).map(color => (
                  <label key={color} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      name="colors"
                      value={color}
                      toolparamdescription={`Allowed color: ${color}`}
                    />
                    {color}
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending ? 'Searching…' : 'Search'}
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!compareReady}
              onClick={() => {
                moveToStage('compared');
                pushEvent('shopper', 'Compare selected', comparedIds.join(', '));
              }}
              className="rounded-full border border-stone-400 bg-white px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Compare selected
            </button>
          </div>

          {error ? (
            <p className="text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          {prepared ? (
            <section
              aria-label="Your pick"
              className="space-y-3 rounded-2xl border border-stone-900 bg-white p-4"
            >
              <p className="text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">
                Your pick
              </p>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight">{prepared.name}</h2>
                <p className="font-semibold">${prepared.priceUsd}</p>
              </div>
              <p className="text-sm text-stone-600">
                {[
                  budget !== null
                    ? `${prepared.priceUsd <= budget ? 'Under' : 'Over'} $${budget}`
                    : null,
                  ...prepared.features,
                  'ranked here, not at the shop',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {prepared.url !== '#pick' ? (
                <HoldButton
                  label={`Open ${prepared.name}`}
                  holdMs={700}
                  onConfirm={() => {
                    window.open(prepared.url, '_blank', 'noopener');
                    pushEvent('shopper', 'opened', prepared.name);
                  }}
                />
              ) : null}
              <p className="text-xs text-stone-500">
                prepare_selection never navigates. Opening is a separate shopper gesture (WebMCP
                issue #288 observed an in-app browser clicking a page&apos;s own Approve button).
              </p>
            </section>
          ) : null}

          <CatalogGrid
            items={items}
            result={result}
            comparedIds={comparedIds}
            preparedId={preparedId}
            budgetUsd={budget}
            onToggleCompare={id => {
              setComparedIds(current => {
                const next = current.includes(id)
                  ? current.filter(entry => entry !== id)
                  : [...current, id].slice(0, 3);
                comparedRef.current = next;
                return next;
              });
            }}
            onPrepare={id => prepareItem(id, 'shopper')}
          />
        </section>

        <DemoSidebar
          vault={vault}
          arcadeStatus={arcadeStatus}
          result={result}
          events={events}
          toolNames={toolNames}
          hostToolNames={hostToolNames}
          rejected={rejected}
          leakLedger={leakLedger}
          leaky={leaky}
          webmcpAvailable={webmcp === 'available'}
          copied={copied}
          probing={probing}
          onCopyPrompt={prompt => void onCopyPrompt(prompt)}
          onLoadVault={() => void loadGiftNotes('shopper')}
          onTryLeak={() => void onTryLeak()}
          onToggleLeaky={onToggleLeaky}
        />
      </div>
    </main>
  );
}
