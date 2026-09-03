import {
  ArcadeAuthorizationRequired,
  ArcadeContextError,
  createArcadeTools,
  isRecord,
  readArcadeConfig,
  type ArcadeTools,
} from './arcade-client.ts';
import {
  rankItemsByBrief,
  type ArcadeRequest,
  type CatalogItem,
  type CatalogSize,
  type MerchantSource,
  type PublicBrief,
} from './vitrine.ts';

export const ARCADE_SHOPPING_TOOL = 'GoogleShopping.SearchProducts';
export const ARCADE_WALMART_TOOL = 'Walmart.SearchProducts';

/** Rows parsed per adapter call; filterRowsForBrief needs material to work with. */
const MAX_LIVE_ITEMS = 40;
/** Rows shown after filtering. */
const MAX_FILTERED_ITEMS = 8;
/**
 * Fewer usable rows than this and the adapter reports nothing, so the route falls back to
 * the recorded sample with an honest label. One live Walmart probe on 2026-09-03 returned
 * 6 clean rows of 20 for the XL brief, so the threshold stays at 3.
 */
export const MIN_LIVE_ROWS = 3;

const SIZE_TOKEN = /\b(XS|S|M|L|XL)\b/;
const EXCLUDED_TITLE =
  /\b(women|womens|women's|ladies|girls?|kids?|boys?|youth|toddler|plus[- ]size|1x|2x|3x)\b/i;

export type LiveSearchResult = {
  items: CatalogItem[];
  merchant: MerchantSource;
  arcadeRequest: ArcadeRequest;
  cached: boolean;
};

/**
 * The whole Arcade input. Both SERP tools take `keywords`; Walmart.SearchProducts would also
 * take max_price, min_price, and sort_by, and this is the only place the shop builds that
 * object, so a test can assert its keys are exactly ['keywords'].
 */
export function buildArcadeShoppingInput(merchantQuery: string): { keywords: string } {
  return { keywords: merchantQuery };
}

function sizeFromText(text: string): CatalogSize | undefined {
  const match = SIZE_TOKEN.exec(text);
  return match ? (match[1] as CatalogSize) : undefined;
}

/**
 * Keep only rows a shopper with this brief would recognize: no women's, kids', or plus-size
 * listings, and at least one feature, color, or the requested size in the title. Best matches
 * first, at most eight.
 */
export function filterRowsForBrief(items: CatalogItem[], brief: PublicBrief): CatalogItem[] {
  const relevant = items.filter(item => {
    if (EXCLUDED_TITLE.test(item.name)) return false;
    // A listing that names a different size than the brief asked for is not a match,
    // however many feature words it carries.
    if (item.size && item.size !== brief.size) return false;
    const featureHits = brief.features.some(feature => item.features.includes(feature));
    const colorHits = brief.colors.some(color => item.colors.includes(color));
    const sizeHit = item.size === brief.size;
    return featureHits || colorHits || sizeHit;
  });
  return rankItemsByBrief(relevant, brief).slice(0, MAX_FILTERED_ITEMS);
}

function parsePriceUsd(value: unknown): number | null {
  if (isRecord(value)) {
    return parsePriceUsd(value.value ?? value.amount ?? value.price);
  }
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const match = value.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    if (!match) return null;
    const amount = Number(match[1]);
    return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
  }
  return null;
}

function parseRating(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
  }
  return null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function slugId(name: string, index: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${slug || 'product'}-${index}`;
}

function featuresFromText(text: string): CatalogItem['features'] {
  const lower = text.toLowerCase();
  const features: CatalogItem['features'] = [];
  if (lower.includes('waterproof') || lower.includes('gore-tex') || lower.includes('rain')) {
    features.push('waterproof');
  }
  if (lower.includes('packable') || lower.includes('lightweight')) {
    features.push('packable');
  }
  return features;
}

function colorsFromText(text: string): CatalogItem['colors'] {
  const lower = text.toLowerCase();
  const colors: CatalogItem['colors'] = [];
  if (lower.includes('navy') || lower.includes('blue')) colors.push('navy');
  if (lower.includes('olive') || lower.includes('green')) colors.push('olive');
  return colors;
}

function shoppingRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];
  for (const key of ['shopping_results', 'products', 'organic_results', 'items', 'results']) {
    const rows = value[key];
    if (Array.isArray(rows)) return rows;
  }
  return [];
}

export function parseShoppingProducts(value: unknown, merchant: MerchantSource): CatalogItem[] {
  const items: CatalogItem[] = [];
  for (const [index, row] of shoppingRows(value).entries()) {
    if (!isRecord(row)) continue;
    const offer = isRecord(row.primary_offer) ? row.primary_offer : {};
    const name = firstString(row.title, row.name, row.product_title);
    const priceUsd = parsePriceUsd(
      row.extracted_price ??
        row.price ??
        offer.offer_price ??
        offer.price ??
        row.extracted_old_price,
    );
    if (!name || priceUsd === null) continue;
    const url = firstString(
      row.direct_link,
      row.product_link,
      row.product_page_url,
      row.link,
      row.url,
      row.google_link,
      row.serpapi_product_api,
    );
    const imageUrl = firstString(
      row.thumbnail,
      row.image,
      Array.isArray(row.thumbnails) ? row.thumbnails[0] : undefined,
      Array.isArray(row.product_photos) ? row.product_photos[0] : undefined,
    );
    const seller = isRecord(row.seller) ? row.seller.name : row.seller;
    const merchantName =
      firstString(row.source, row.merchant, seller, row.seller_name, offer.seller) ??
      (merchant === 'walmart' ? 'Walmart' : 'Google Shopping');
    const walmartId =
      merchant === 'walmart' && (typeof row.item_id === 'string' || typeof row.item_id === 'number')
        ? `walmart-${row.item_id}`
        : null;
    const item: CatalogItem = {
      id: walmartId ?? firstString(row.product_id, row.id) ?? slugId(name, index),
      name,
      priceUsd,
      imageUrl: imageUrl ?? '',
      merchantName,
      rating: parseRating(row.rating ?? row.product_rating ?? row.stars),
      url: url ?? `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(name)}`,
      features: featuresFromText(name),
      colors: colorsFromText(name),
    };
    const size = sizeFromText(name);
    if (size) item.size = size;
    items.push(item);
    if (items.length >= MAX_LIVE_ITEMS) break;
  }
  return items;
}

async function executeProductSearch(
  tools: ArcadeTools,
  userId: string,
  toolName: string,
  merchantQuery: string,
): Promise<unknown> {
  // Both Arcade SERP tools (GoogleShopping.SearchProducts, Walmart.SearchProducts) take
  // `keywords` and nothing else from the shopper. Walmart also accepts max_price; it is
  // deliberately left empty so the budget never reaches the merchant. A retry with another
  // key can never succeed and would only burn a metered execution.
  const input = buildArcadeShoppingInput(merchantQuery);
  let lastError: unknown;
  try {
    const response = await tools.execute({
      tool_name: toolName,
      user_id: userId,
      input,
    });
    const authorization = response.output?.authorization;
    if (authorization && authorization.status !== 'completed') {
      throw new ArcadeAuthorizationRequired(authorization.url);
    }
    if (response.success === true) {
      return response.output?.value;
    }
    lastError = response.output;
  } catch (error) {
    lastError = error;
  }
  throw lastError instanceof Error
    ? lastError
    : new ArcadeContextError('Arcade product search failed');
}

/**
 * The public brief has five sizes, three feature sets, and three color sets: at most 45
 * distinct keyword strings, so the cache stays tiny and nothing shopper-specific is stored.
 * Hits last six hours; a miss (null) is retried after a minute.
 */
const LIVE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const NULL_CACHE_TTL_MS = 60 * 1000;
const liveCache = new Map<string, { expires: number; value: LiveSearchResult | null }>();

export function clearLiveCache(): void {
  liveCache.clear();
}

function remember(merchantQuery: string, value: LiveSearchResult | null): LiveSearchResult | null {
  const ttl = value ? LIVE_CACHE_TTL_MS : NULL_CACHE_TTL_MS;
  liveCache.set(merchantQuery, { expires: Date.now() + ttl, value });
  return value;
}

/**
 * Walmart first: its rows carry real product links and its tool is the one that would have
 * accepted max_price, which makes the empty field worth showing. Google Shopping is the
 * fallback, then the recorded sample.
 */
const ATTEMPTS: ReadonlyArray<{ tool: ArcadeRequest['tool']; merchant: MerchantSource }> = [
  { tool: ARCADE_WALMART_TOOL, merchant: 'walmart' },
  { tool: ARCADE_SHOPPING_TOOL, merchant: 'google_shopping' },
];

export async function searchLiveProducts(
  merchantQuery: string,
  options: {
    tools?: ArcadeTools;
    userId?: string;
    signal?: AbortSignal;
    brief?: PublicBrief;
  } = {},
): Promise<LiveSearchResult | null> {
  if (options.signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }

  const config = options.tools && options.userId ? null : readArcadeConfig();
  const tools = options.tools ?? (config ? createArcadeTools(config) : null);
  const userId = options.userId ?? config?.userId;
  if (!tools || !userId) return null;

  const cached = liveCache.get(merchantQuery);
  if (cached && cached.expires > Date.now()) {
    return cached.value ? { ...cached.value, cached: true } : null;
  }

  for (const attempt of ATTEMPTS) {
    if (options.signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }
    try {
      const value = await executeProductSearch(tools, userId, attempt.tool, merchantQuery);
      const parsed = parseShoppingProducts(value, attempt.merchant);
      // Live rows and the recorded sample never mix: too few usable rows means this adapter
      // contributed nothing, and the next one (or the sample) answers alone.
      const items = options.brief ? filterRowsForBrief(parsed, options.brief) : parsed;
      const enough = options.brief ? items.length >= MIN_LIVE_ROWS : items.length > 0;
      if (enough) {
        return remember(merchantQuery, {
          items,
          merchant: attempt.merchant,
          arcadeRequest: { tool: attempt.tool, input: buildArcadeShoppingInput(merchantQuery) },
          cached: false,
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
    }
  }

  return remember(merchantQuery, null);
}
