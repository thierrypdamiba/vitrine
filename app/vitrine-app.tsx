'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { CatalogGrid } from '@/app/catalog-grid';
import { DemoSidebar } from '@/app/demo-sidebar';
import { nextTraceEvent, type DemoStage, type TraceEvent } from '@/lib/session';
import {
  DAD_SCOTLAND_FIXTURE,
  JUDGE_PROMPT,
  parsePublicBrief,
  publicBriefFromFixture,
  runVitrineSearch,
  type CatalogColor,
  type CatalogFeature,
  type CatalogSize,
  type PublicBrief,
  type VitrineSearchResult,
  type WebmcpStatus,
} from '@/lib/vitrine';
import { detectModelContext, registerVitrineTools } from '@/lib/webmcp';

const DEFAULT_BRIEF = publicBriefFromFixture();

function merchantLabel(result: VitrineSearchResult | null): string {
  if (!result) return '';
  if (result.merchant === 'google_shopping') return 'Live Google Shopping.';
  if (result.merchant === 'walmart') return 'Live Walmart.';
  return 'Recorded sample. Live shopping is not configured.';
}

export function VitrineApp() {
  const headingId = useId();
  const [webmcp, setWebmcp] = useState<WebmcpStatus>('unavailable');
  const [brief, setBrief] = useState<PublicBrief>(DEFAULT_BRIEF);
  const [stage, setStage] = useState<DemoStage>('browse');
  const [result, setResult] = useState<VitrineSearchResult | null>(null);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [preparedId, setPreparedId] = useState<string | null>(null);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  const resultRef = useRef<VitrineSearchResult | null>(null);
  const comparedRef = useRef<string[]>([]);
  const stageRef = useRef<DemoStage>('browse');

  const applyResult = useCallback((next: VitrineSearchResult) => {
    resultRef.current = next;
    setResult(next);
    setBrief(next.receipt);
    setComparedIds([]);
    comparedRef.current = [];
    setPreparedId(null);
    setStage('results');
    stageRef.current = 'results';
    setError(null);
    setEvents(current => [
      ...current,
      nextTraceEvent('webmcp', 'search_products', JSON.stringify(next.receipt)),
    ]);
  }, []);

  const search = useCallback(
    async (nextBrief: PublicBrief, signal?: AbortSignal) => {
      const parsed = parsePublicBrief(nextBrief);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setPending(true);
      setError(null);
      try {
        applyResult(
          await runVitrineSearch(parsed.brief, {
            signal,
            context: DAD_SCOTLAND_FIXTURE,
          }),
        );
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setError(caught instanceof Error ? caught.message : 'Search failed');
      } finally {
        setPending(false);
      }
    },
    [applyResult],
  );

  useEffect(() => {
    const controller = new AbortController();
    // Load the shop catalog once on mount. State updates happen in the async
    // continuation of search(), not synchronously inside the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void search(DEFAULT_BRIEF, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const modelContext = detectModelContext(document, navigator);
    if (!modelContext) return;

    const controller = new AbortController();
    let cancelled = false;

    void registerVitrineTools(modelContext, {
      signal: controller.signal,
      stage: stageRef.current,
      currentItems: () => resultRef.current?.shortlist ?? [],
      comparedIds: () => comparedRef.current,
      onResult: applyResult,
      onCompare: ids => {
        comparedRef.current = ids;
        setComparedIds(ids);
        setStage('compared');
        stageRef.current = 'compared';
        setEvents(current => [
          ...current,
          nextTraceEvent('webmcp', 'compare_products', ids.join(', ')),
        ]);
      },
      onPrepare: id => {
        setPreparedId(id);
        setStage('prepared');
        stageRef.current = 'prepared';
        setEvents(current => [...current, nextTraceEvent('webmcp', 'prepare_selection', id)]);
      },
      search: (nextBrief, extras) =>
        runVitrineSearch(nextBrief, {
          signal: extras?.signal,
          context: DAD_SCOTLAND_FIXTURE,
        }),
    })
      .then(() => {
        if (!cancelled) setWebmcp('available');
      })
      .catch(() => {
        if (!cancelled) setWebmcp('unavailable');
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [applyResult, stage]);

  async function onCopyPrompt() {
    try {
      await navigator.clipboard.writeText(JUDGE_PROMPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const prepared = result?.shortlist.find(item => item.id === preparedId) ?? null;
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
            {result?.shortlist.length ? `${result.shortlist.length} in stock` : 'Catalog'}
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby={headingId} className="space-y-6">
          <div>
            <h1 id={headingId} className="text-3xl font-semibold tracking-tight">
              Waterproof jackets
            </h1>
            <p className="mt-2 max-w-xl text-stone-700">
              Packable shells for wet weather. Ask an agent to shop this page, or use the filters.
            </p>
          </div>

          <form
            toolname="filter_jackets"
            tooldescription="Filter the jacket catalog. Send only size, features, and colors. Do not send recipient, trip, dates, or budget. The shopper submits this form."
            className="flex flex-wrap items-end gap-3 rounded-2xl border border-stone-300 bg-white p-4"
            onSubmit={event => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const features = data.getAll('features').map(String) as CatalogFeature[];
              const colors = data.getAll('colors').map(String) as CatalogColor[];
              void search({
                category: 'jacket',
                size: String(data.get('size') ?? brief.size) as CatalogSize,
                features: features.length ? features : brief.features,
                colors: colors.length ? colors : brief.colors,
              });
            }}
          >
            <label className="text-sm">
              <span className="block text-stone-500">Size</span>
              <select
                name="size"
                defaultValue={brief.size}
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
                      defaultChecked={brief.features.includes(feature)}
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
                      defaultChecked={brief.colors.includes(color)}
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
                setStage('compared');
                stageRef.current = 'compared';
                setEvents(current => [
                  ...current,
                  nextTraceEvent('webmcp', 'compare_products', comparedIds.join(', ')),
                ]);
              }}
              className="rounded-full border border-stone-400 bg-white px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Compare selected
            </button>
            {prepared ? (
              <a
                href={prepared.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
              >
                Open {prepared.name}
              </a>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          <CatalogGrid
            items={result?.shortlist ?? []}
            comparedIds={comparedIds}
            preparedId={preparedId}
            onToggleCompare={id => {
              setComparedIds(current => {
                const next = current.includes(id)
                  ? current.filter(entry => entry !== id)
                  : [...current, id].slice(0, 3);
                comparedRef.current = next;
                return next;
              });
            }}
            onPrepare={id => {
              setPreparedId(id);
              setStage('prepared');
              stageRef.current = 'prepared';
              setEvents(current => [...current, nextTraceEvent('webmcp', 'prepare_selection', id)]);
            }}
          />
        </section>

        <DemoSidebar
          receipt={result?.receipt ?? null}
          merchantQuery={result?.merchantQuery ?? null}
          merchantLabel={merchantLabel(result)}
          events={events}
          webmcpAvailable={webmcp === 'available'}
          copied={copied}
          onCopyPrompt={() => void onCopyPrompt()}
        />
      </div>
    </main>
  );
}
