'use client';

import type { CatalogItem } from '@/lib/vitrine';

function formatPrice(priceUsd: number): string {
  return `$${priceUsd}`;
}

function formatRating(rating: number | null): string | null {
  if (rating === null) return null;
  return `${rating.toFixed(1)}`;
}

export function CatalogGrid({
  items,
  comparedIds,
  preparedId,
  onToggleCompare,
  onPrepare,
}: {
  items: CatalogItem[];
  comparedIds: string[];
  preparedId: string | null;
  onToggleCompare: (id: string) => void;
  onPrepare: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-stone-600">No jackets match those filters.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(item => {
        const selected = comparedIds.includes(item.id);
        const isPrepared = preparedId === item.id;
        return (
          <article
            key={item.id}
            className={`overflow-hidden rounded-2xl border bg-white ${
              isPrepared ? 'border-stone-900' : selected ? 'border-stone-600' : 'border-stone-200'
            }`}
          >
            {item.imageUrl ? (
              // Product photos are untrusted remote content.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="h-56 w-full object-cover" />
            ) : (
              <div className="h-56 w-full bg-stone-200" />
            )}
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold tracking-tight">{item.name}</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    {item.merchantName}
                    {formatRating(item.rating) ? ` · ${formatRating(item.rating)}` : ''}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(item.priceUsd)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
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
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
