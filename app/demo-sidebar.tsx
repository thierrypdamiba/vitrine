'use client';

import { ArcadePanel } from '@/app/arcade-panel';
import type { ArcadeStatus, VaultState } from '@/lib/arcade-types';
import { seamCounts, type LeakRow } from '@/lib/seam';
import { type TraceEvent } from '@/lib/session';
import type { MerchantProbe } from '@/lib/vault';
import {
  JUDGE_PROMPT,
  JUDGE_PROMPT_LEAKY,
  withheldFacts,
  type VitrineSearchResult,
} from '@/lib/vitrine';

export type CopiedPrompt = 'agent' | 'leaky' | null;

const MAY_BE_SENT = new Set(['Size', 'Features', 'Colors']);

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">{children}</h2>
  );
}

function VaultPill({ via }: { via: 'arcade' | 'fixture' | null }) {
  return (
    <span className="rounded-full border border-stone-300 bg-white px-2 py-0.5 text-xs text-stone-700">
      {via === 'arcade' ? 'from Arcade Gmail' : 'demo fixture'}
    </span>
  );
}

function VaultSection({
  vault,
  arcadeStatus,
  onLoadVault,
}: {
  vault: VaultState;
  arcadeStatus: ArcadeStatus | null;
  onLoadVault: () => void;
}) {
  if (vault.status === 'sealed') {
    return (
      <p className="mt-2 text-sm text-stone-700">
        Sealed. Ask the agent to call load_context, or{' '}
        <button
          type="button"
          onClick={onLoadVault}
          className="rounded-full border border-stone-400 bg-white px-3 py-1 text-xs font-medium"
        >
          Load gift notes
        </button>
      </p>
    );
  }
  if (vault.status === 'loading' || !vault.context) {
    return (
      <p className="mt-2 text-sm text-stone-600">
        {arcadeStatus?.gmailRead ? 'Reading Gmail through Arcade…' : 'Loading the demo fixture…'}
      </p>
    );
  }
  const facts = withheldFacts(vault.context).filter(fact => fact.label !== 'Source');
  return (
    <div className="mt-2 space-y-2">
      <VaultPill via={vault.via} />
      {vault.via === 'fixture' && vault.reason ? (
        <p className="text-xs text-stone-500">{vault.reason}</p>
      ) : null}
      <dl className="space-y-1 text-sm">
        {facts.map(fact => (
          <div key={fact.label} className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-stone-500">{fact.label}</dt>
            <dd className="text-right">
              <span className="font-medium">{fact.value}</span>
              <span
                className={`ml-2 text-[10px] tracking-wide uppercase ${
                  MAY_BE_SENT.has(fact.label) ? 'text-amber-800' : 'text-stone-400'
                }`}
              >
                {MAY_BE_SENT.has(fact.label) ? 'may be sent' : 'never sent'}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function maxPriceLine(result: VitrineSearchResult, budget: number | null): string {
  const tool = result.arcadeRequest?.tool;
  if (tool === 'Walmart.SearchProducts') {
    const ceiling = budget === null ? 'Your budget' : `The $${budget}`;
    return `Walmart.SearchProducts also accepts max_price. Vitrine leaves it empty. ${ceiling} ceiling is applied on this page after results return.`;
  }
  if (tool === 'GoogleShopping.SearchProducts') {
    return 'GoogleShopping.SearchProducts has no price parameter, and Walmart.SearchProducts, our fallback adapter, accepts max_price; Vitrine never sends it.';
  }
  return 'Walmart.SearchProducts (live adapter) accepts max_price; Vitrine never sends it.';
}

function ShopReceived({
  result,
  budget,
  leakLedger,
}: {
  result: VitrineSearchResult | null;
  budget: number | null;
  leakLedger: LeakRow[];
}) {
  return (
    <div className="mt-2 space-y-3">
      <p className="text-xs text-stone-500">
        The body the adapter accepted, echoed back by the server. Extra keys are rejected before any
        search runs.
      </p>
      {result ? (
        <pre className="overflow-x-auto rounded-xl bg-stone-900 p-3 font-mono text-xs leading-5 text-stone-100">
          {`POST /api/catalog/search\n${JSON.stringify(result.receipt, null, 2)}\n200 · accepted by the merchant adapter`}
        </pre>
      ) : (
        <div>
          <p className="text-sm text-stone-600">No request yet.</p>
          <pre className="mt-2 rounded-xl border border-dashed border-stone-300 p-3 font-mono text-xs leading-5 text-stone-400">
            {'{\n  "category": …\n  "size": …\n  "features": …\n  "colors": …\n}'}
          </pre>
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-stone-600">Exact Arcade call</p>
        <pre className="mt-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-3 font-mono text-xs leading-5 break-all whitespace-pre-wrap text-stone-800">
          {result?.arcadeRequest
            ? `${JSON.stringify(result.arcadeRequest)}${result.cached ? ' · cached' : ''}`
            : 'Recorded sample. No Arcade call.'}
        </pre>
        {result ? (
          <p className="mt-2 text-xs text-stone-600">{maxPriceLine(result, budget)}</p>
        ) : null}
      </div>
      {leakLedger.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-red-800">Leak demo received</p>
          <dl className="mt-1 space-y-0.5 font-mono text-xs text-red-800">
            {leakLedger.map((row, index) => (
              <div key={`${row.key}-${index}`} className="flex justify-between gap-3">
                <dt>{row.key}</dt>
                <dd className="truncate text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

export function DemoSidebar({
  vault,
  arcadeStatus,
  result,
  events,
  toolNames,
  hostToolNames,
  rejected,
  leakLedger,
  leaky,
  webmcpAvailable,
  copied,
  probing,
  onCopyPrompt,
  onLoadVault,
  onTryLeak,
  onToggleLeaky,
}: {
  vault: VaultState;
  arcadeStatus: ArcadeStatus | null;
  result: VitrineSearchResult | null;
  events: TraceEvent[];
  toolNames: string[];
  hostToolNames: string[] | null;
  rejected: MerchantProbe[];
  leakLedger: LeakRow[];
  leaky: boolean;
  webmcpAvailable: boolean;
  copied: CopiedPrompt;
  probing: boolean;
  onCopyPrompt: (prompt: 'agent' | 'leaky') => void;
  onLoadVault: () => void;
  onTryLeak: () => void;
  onToggleLeaky: (next: boolean) => void;
}) {
  const counts = seamCounts(vault, result?.receipt ?? null, leakLedger);
  const budget = vault.context?.budgetUsd ?? null;
  const lastProbe = rejected[rejected.length - 1] ?? null;
  const hostDiffers =
    hostToolNames !== null &&
    hostToolNames
      .filter(name => name !== 'filter_jackets')
      .sort()
      .join(',') !== [...toolNames].sort().join(',');

  return (
    <aside
      aria-label="Demo notes"
      className="space-y-6 rounded-2xl border border-stone-300 bg-[#fffaf2] p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto"
    >
      <section>
        <Heading>The seam</Heading>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-3xl font-semibold tracking-tight">{counts.agentKnows}</p>
            <p className="text-xs text-stone-600">Agent knows {counts.agentKnows} facts</p>
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-tight">{counts.shopReceived}</p>
            <p className="text-xs text-stone-600">Shop received {counts.shopReceived} fields</p>
          </div>
          {counts.leaked > 0 ? (
            <div className="col-span-2">
              <p className="text-3xl font-semibold tracking-tight text-red-700">{counts.leaked}</p>
              <p className="text-xs text-red-800">Leak demo received {counts.leaked}</p>
            </div>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Counted from the request the adapter accepted, not from what the agent says it sent.
        </p>
      </section>

      <section className="space-y-2">
        <button
          type="button"
          onClick={() => onCopyPrompt('agent')}
          className="w-full rounded-full border border-stone-400 bg-white px-4 py-2 text-sm font-medium"
        >
          {copied === 'agent' ? 'Copied' : 'Copy agent prompt'}
        </button>
        <p className="text-xs leading-5 text-stone-500">{JUDGE_PROMPT}</p>
        {leaky ? (
          <>
            <button
              type="button"
              onClick={() => onCopyPrompt('leaky')}
              className="w-full rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800"
            >
              {copied === 'leaky' ? 'Copied' : 'Copy leak-demo prompt'}
            </button>
            <p className="text-xs leading-5 text-stone-500">{JUDGE_PROMPT_LEAKY}</p>
          </>
        ) : null}
      </section>

      <section>
        <Heading>Vault</Heading>
        <VaultSection vault={vault} arcadeStatus={arcadeStatus} onLoadVault={onLoadVault} />
      </section>

      <section>
        <Heading>Shop received</Heading>
        <ShopReceived result={result} budget={budget} leakLedger={leakLedger} />
      </section>

      <section className="space-y-2">
        <button
          type="button"
          disabled={!result || probing}
          onClick={onTryLeak}
          className="w-full rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 disabled:opacity-40"
        >
          {probing ? 'Sending…' : 'Try to leak'}
        </button>
        {lastProbe ? (
          <div className="space-y-1">
            <pre className="overflow-x-auto rounded-xl border border-red-200 bg-red-50 p-3 font-mono text-xs leading-5 break-all whitespace-pre-wrap text-red-800">
              {lastProbe.sent}
            </pre>
            <p className="font-mono text-xs break-all text-red-800">
              → {lastProbe.status} {lastProbe.body}
            </p>
            <p className="text-xs text-stone-500">
              Sent the private fields on purpose. The adapter refused before any search ran.
            </p>
          </div>
        ) : null}
      </section>

      <section>
        <Heading>Agent can call now</Heading>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {toolNames.map(name => (
            <span
              key={name}
              className="rounded-full border border-stone-300 bg-white px-2 py-0.5 font-mono text-xs"
            >
              {name}
            </span>
          ))}
          <span className="rounded-full border border-dashed border-stone-300 px-2 py-0.5 font-mono text-xs text-stone-400">
            filter_jackets · declarative form · Chrome only; ChatGPT does not expose form tools
          </span>
        </div>
        {hostDiffers && hostToolNames ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hostToolNames.map(name => (
              <span
                key={name}
                className="rounded-full border border-amber-300 bg-white px-2 py-0.5 font-mono text-xs"
              >
                {name}
              </span>
            ))}
          </div>
        ) : null}
        <p className="mt-2 text-xs text-stone-500">
          {hostToolNames !== null
            ? 'Reported by document.modelContext.getTools() after toolchange'
            : 'Page registry (this host does not expose getTools)'}
        </p>
      </section>

      <ArcadePanel status={arcadeStatus} />

      <section>
        <Heading>Activity</Heading>
        {events.length > 0 ? (
          <ol className="mt-3 space-y-2">
            {events.slice(-8).map(event => (
              <li key={event.id} className="text-sm">
                <span className="font-medium">
                  {event.actor} · {event.title}
                </span>
                <span className="block font-mono text-xs break-all text-stone-500">
                  {event.detail}
                </span>
                {event.arcadeTool ? (
                  <span className="block font-mono text-xs text-stone-400">
                    → {event.arcadeTool}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-stone-600">Nothing yet.</p>
        )}
      </section>

      <p className="text-xs text-stone-500">
        {webmcpAvailable
          ? 'Site tools registered on document.modelContext. The filter form is a Chrome-only extra.'
          : 'This browser has no WebMCP. The filters still search the shop.'}
      </p>

      <section className="border-t border-stone-200 pt-4">
        <Heading>Leak demo (demonstration only)</Heading>
        <label className="mt-2 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={leaky}
            onChange={event => onToggleLeaky(event.currentTarget.checked)}
            className="mt-1"
          />
          <span>Register personalize_for_shopper, an over-parameterized tool</span>
        </label>
        <blockquote className="mt-2 border-l-2 border-stone-300 pl-3 text-xs leading-5 text-stone-600">
          Sites can design highly parameterized WebMCP tools to extract sensitive user data that
          agents provide from personalization context. — WebMCP draft, 6.3.3
        </blockquote>
        <p className="mt-2 text-xs text-stone-500">
          Nothing leaves this page. The strict search_products request above is unchanged.
        </p>
      </section>
    </aside>
  );
}
