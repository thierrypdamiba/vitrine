'use client';

import type { ArcadeStatus } from '@/lib/arcade-types';

/**
 * Names the exact Arcade tools the server calls and whether each is connected.
 * Booleans only: the status route never returns token text or URLs. A null
 * status means the route has not answered yet (or was throttled); that is not
 * the same as "not configured", so the panel says it is still checking.
 */
export function ArcadePanel({ status }: { status: ArcadeStatus | null }) {
  const rows = status?.configured
    ? [
        {
          label: 'Gmail read',
          tools: 'Gmail.SearchEmailsByQuery',
          note: null,
          state: status.gmailRead ? 'connected' : 'not authorized',
        },
        {
          label: 'Calendar',
          tools: 'GoogleCalendar.ListEvents',
          note: null,
          state: status.calendar ? 'connected' : 'not authorized',
        },
        {
          label: 'Shopping',
          tools: 'Walmart.SearchProducts, GoogleShopping.SearchProducts',
          note: 'SerpAPI, no shopper OAuth',
          state: status.shopping ? 'ready' : 'off',
        },
      ]
    : null;

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">
        Arcade · server-side, key never in the browser
      </h2>
      {rows ? (
        <ul className="mt-3 space-y-2 text-sm">
          {rows.map(row => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{row.label}</span>
                <span
                  className={
                    row.state === 'connected' || row.state === 'ready'
                      ? 'text-emerald-800'
                      : 'text-stone-500'
                  }
                >
                  {row.state}
                </span>
              </div>
              <p className="font-mono text-xs break-words text-stone-600">{row.tools}</p>
              {row.note ? <p className="text-xs text-stone-500">{row.note}</p> : null}
            </li>
          ))}
        </ul>
      ) : status === null ? (
        <p className="mt-2 text-sm text-stone-600">Checking the server&apos;s Arcade status…</p>
      ) : (
        <p className="mt-2 text-sm text-stone-600">
          Arcade is not configured on this deployment. The demo fixture and recorded sample run
          instead.
        </p>
      )}
    </section>
  );
}
