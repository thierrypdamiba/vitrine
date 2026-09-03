'use client';

import type { StorefrontDefault } from '@/lib/session';
import type { CatalogItem, MerchantSource, VitrineSearchResult } from '@/lib/vitrine';

const SWATCH: Record<string, string> = { navy: '#1f2a44', olive: '#5b6b3a' };

function formatPrice(priceUsd: number): string {
  return `$${priceUsd}`;
}

function bandStyle(item: CatalogItem): { backgroundImage: string } {
  const stops = item.colors.map(color => SWATCH[color]).filter(Boolean);
  if (stops.length === 0) {
    return { backgroundImage: 'linear-gradient(135deg, #e7e5e4, #d6d3d1)' };
  }
  if (stops.length === 1) {
    return { backgroundImage: `linear-gradient(135deg, ${stops[0]}, ${stops[0]})` };
  }
  return {
    backgroundImage: `linear-gradient(135deg, ${stops[0]} 0%, ${stops[0]} 50%, ${stops[1]} 50%, ${stops[1]} 100%)`,
  };
}

function sourceLabel(merchant: MerchantSource): string {
  return merchant === 'walmart'
    ? 'Live Walmart via Arcade'
    : merchant === 'google_shopping'
      ? 'Live Google Shopping via Arcade'
      : 'Recorded sample';
}

function merchantLine(result: VitrineSearchResult): string {
  return `${result.shortlist.length} results · ${sourceLabel(result.merchant)}${result.cached ? ' · cached' : ''}`;
}

/** Only remote https photos render as images; everything else keeps the swatch band. */
export function hasPhoto(item: Pick<CatalogItem, 'imageUrl'>): boolean {
  return typeof item.imageUrl === 'string' && item.imageUrl.startsWith('https://');
}

export function CatalogGrid({
  items,
  result,
  storefront,
  comparedIds,
  preparedId,
  budgetUsd,
  onToggleCompare,
  onPrepare,
}: {
  items: CatalogItem[];
  result: VitrineSearchResult | null;
  storefront?: StorefrontDefault | null;
  comparedIds: string[];
  preparedId: string | null;
  budgetUsd?: number | null;
  onToggleCompare: (id: string) => void;
  onPrepare: (id: string) => void;
}) {
  const header = result
    ? merchantLine(result)
    : storefront
      ? `${items.length} jackets · ${sourceLabel(storefront.merchant)} · storefront default, no shopper request yet`
      : `${items.length} jackets · Recorded sample · storefront default, no shopper request yet`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">{header}</p>
      {items.length === 0 ? (
        <p className="text-sm text-stone-600">No jackets match those filters.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(item => {
            const selected = comparedIds.includes(item.id);
            const isPrepared = preparedId === item.id;
            const fits = typeof budgetUsd === 'number' ? item.priceUsd <= budgetUsd : null;
            return (
              <article
                key={item.id}
                className={`overflow-hidden rounded-2xl border bg-white ${
                  isPrepared
                    ? 'border-stone-900 ring-2 ring-stone-900'
                    : selected
                      ? 'border-stone-600'
                      : 'border-stone-200'
                }`}
              >
                {hasPhoto(item) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-56 w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="relative h-[88px] w-full" style={bandStyle(item)}>
                    <span
                      aria-hidden="true"
                      className="absolute bottom-3 left-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-sm font-semibold text-stone-900"
                    >
                      {item.merchantName.slice(0, 1).toUpperCase() || 'V'}
                    </span>
                  </div>
                )}
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 font-semibold tracking-tight">{item.name}</h2>
                      <p className="mt-1 text-sm text-stone-600">
                        {item.merchantName}
                        {item.rating !== null ? ` · ★ ${item.rating.toFixed(1)}` : ''}
                      </p>
                    </div>
                    <p className="font-semibold">{formatPrice(item.priceUsd)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {item.features.map(feature => (
                      <span
                        key={feature}
                        className="rounded-full border border-stone-200 px-2 py-0.5 text-stone-700"
                      >
                        {feature}
                      </span>
                    ))}
                    {item.size ? (
                      <span className="rounded-full border border-stone-200 px-2 py-0.5 text-stone-700">
                        {item.size}
                      </span>
                    ) : null}
                    {fits !== null ? (
                      <span
                        title="Ranked here with your budget. The shop never received it."
                        className={`rounded-full px-2 py-0.5 ${
                          fits ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {fits ? `fits $${budgetUsd}` : `over $${budgetUsd}`}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleCompare(item.id)}
                      className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium"
                    >
                      {selected ? 'Selected' : 'Compare'}
                    </button>
                    {selected ? (
                      <button
                        type="button"
                        onClick={() => onPrepare(item.id)}
                        className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium"
                      >
                        Prepare
                      </button>
                    ) : null}
                    {isPrepared ? (
                      <span className="text-xs font-medium text-stone-700">
                        Prepared · open when ready
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
