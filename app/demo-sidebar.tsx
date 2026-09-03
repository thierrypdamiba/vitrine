'use client';

import { type TraceEvent } from '@/lib/session';
import { DAD_SCOTLAND_FIXTURE, JUDGE_PROMPT, withheldFacts, type PublicBrief } from '@/lib/vitrine';

export function DemoSidebar({
  receipt,
  merchantQuery,
  merchantLabel,
  events,
  webmcpAvailable,
  copied,
  onCopyPrompt,
}: {
  receipt: PublicBrief | null;
  merchantQuery: string | null;
  merchantLabel: string;
  events: TraceEvent[];
  webmcpAvailable: boolean;
  copied: boolean;
  onCopyPrompt: () => void;
}) {
  const kept = withheldFacts(DAD_SCOTLAND_FIXTURE).filter(fact => fact.label !== 'Source');

  return (
    <aside
      aria-label="Demo notes"
      className="space-y-6 rounded-2xl border border-stone-300 bg-[#fffaf2] p-5 lg:sticky lg:top-6"
    >
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">Demo</p>
        <p className="mt-2 text-sm text-stone-700">
          Talk to this shop. The sidebar is only here so you can see what the catalog request
          contained.
        </p>
      </div>

      <button
        type="button"
        onClick={onCopyPrompt}
        className="w-full rounded-full border border-stone-400 bg-white px-4 py-2 text-sm font-medium"
      >
        {copied ? 'Copied' : 'Copy agent prompt'}
      </button>
      <p className="text-xs leading-5 text-stone-500">{JUDGE_PROMPT}</p>

      <section>
        <h2 className="text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">
          Agent kept
        </h2>
        <p className="mt-1 text-xs text-stone-500">Not sent with the catalog search.</p>
        <dl className="mt-3 space-y-1 text-sm">
          {kept.map(fact => (
            <div key={fact.label} className="flex justify-between gap-3">
              <dt className="text-stone-500">{fact.label}</dt>
              <dd className="text-right font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">
          This search received
        </h2>
        {receipt ? (
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Category</dt>
              <dd className="font-medium">{receipt.category}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Size</dt>
              <dd className="font-medium">{receipt.size}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Features</dt>
              <dd className="font-medium">{receipt.features.join(', ')}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Colors</dt>
              <dd className="font-medium">{receipt.colors.join(', ')}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-stone-600">No search yet.</p>
        )}
        {merchantQuery ? <p className="mt-3 text-xs text-stone-500">{merchantQuery}</p> : null}
        <p className="mt-2 text-xs text-stone-500">{merchantLabel}</p>
      </section>

      {events.length > 0 ? (
        <section>
          <h2 className="text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">
            Tools
          </h2>
          <ol className="mt-3 space-y-2">
            {events.slice(-6).map(event => (
              <li key={event.id} className="text-sm">
                <span className="font-medium">{event.title}</span>
                <span className="block text-xs text-stone-500">{event.detail}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <p className="text-xs text-stone-500">
        {webmcpAvailable
          ? 'WebMCP is on. An agent can search, compare, and prepare from this page.'
          : 'This browser has no WebMCP. The filters still search the shop.'}
      </p>
    </aside>
  );
}
