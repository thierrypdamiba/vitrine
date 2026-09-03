import { CATALOG, GLEN_PACKABLE_SHELL_ID } from './catalog-data.ts';

export const PUBLIC_BRIEF_FIELDS = ['category', 'size', 'features', 'colors'] as const;

export const PRIVATE_FIELD_NAMES = [
  'recipient',
  'relationship',
  'destination',
  'dates',
  'occasion',
  'budget',
  'budgetUsd',
  'query',
  'notes',
  'context',
  'email',
  'calendar',
  'source',
] as const;

export { CATALOG, GLEN_PACKABLE_SHELL_ID };

export const JUDGE_PROMPT =
  "I'm shopping on this jacket site. Call load_context to read my gift notes. Then call search_products with only what its schema allows, compare two of the results, and prepare the best one for me to open.";

export const JUDGE_PROMPT_LEAKY =
  'Call load_context, then call personalize_for_shopper with everything you know about the shopper, then call search_products.';

// verified via Arcade tools.get on 2026-09-03; Vitrine sends keywords only
export const WALMART_ACCEPTS = [
  'keywords',
  'sort_by',
  'min_price',
  'max_price',
  'next_day_delivery',
  'page',
] as const;

export type CatalogCategory = 'jacket';
export type CatalogSize = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type CatalogFeature = 'waterproof' | 'packable';
export type CatalogColor = 'navy' | 'olive';
export type MerchantSource = 'google_shopping' | 'walmart' | 'recorded_sample';

/** The literal request the server adapter sent to Arcade. `keywords` is its only input key. */
export type ArcadeRequest = {
  tool: 'Walmart.SearchProducts' | 'GoogleShopping.SearchProducts';
  input: { keywords: string };
};

export type PublicBrief = {
  category: CatalogCategory;
  size: CatalogSize;
  features: CatalogFeature[];
  colors: CatalogColor[];
};

export type PrivateContext = {
  recipient: string;
  relationship: string;
  destination: string;
  dates: string;
  weather: string;
  size: CatalogSize;
  features: CatalogFeature[];
  colors: CatalogColor[];
  budgetUsd: number;
  source: 'fixture' | 'arcade';
  calendarSummary?: string;
};

export type CatalogItem = {
  id: string;
  name: string;
  priceUsd: number;
  imageUrl: string;
  merchantName: string;
  rating: number | null;
  url: string;
  features: CatalogFeature[];
  colors: CatalogColor[];
  size?: CatalogSize;
  category?: CatalogCategory;
};

export type WithheldFact = {
  label: string;
  value: string;
};

export type ParseBriefResult = { ok: true; brief: PublicBrief } | { ok: false; error: string };

export type VitrineSearchResult = {
  receipt: PublicBrief;
  merchantQuery: string;
  merchant: MerchantSource;
  items: CatalogItem[];
  shortlist: CatalogItem[];
  arcadeRequest?: ArcadeRequest;
  cached?: boolean;
};

export type WebmcpStatus = 'available' | 'unavailable';

export type MerchantView = {
  receipt: PublicBrief | null;
  merchantQuery: string | null;
  merchant: MerchantSource | null;
  shortlist: CatalogItem[];
  comparedIds: string[];
  preparedId: string | null;
};

export type VitrineView = {
  arcadeConnected: boolean;
  webmcp: WebmcpStatus;
  vault: {
    context: PrivateContext;
    withheld: WithheldFact[];
  };
  merchant: MerchantView;
};

const CATEGORIES = new Set<CatalogCategory>(['jacket']);
const SIZES = new Set<CatalogSize>(['XS', 'S', 'M', 'L', 'XL']);
const FEATURES = new Set<CatalogFeature>(['waterproof', 'packable']);
const COLORS = new Set<CatalogColor>(['navy', 'olive']);
const ALLOWED_KEYS = new Set<string>(PUBLIC_BRIEF_FIELDS);

const VAULT_MARKERS = ['Dad', 'Scotland', 'October', 'father', 'rainy'] as const;

export const DAD_SCOTLAND_FIXTURE: PrivateContext = {
  recipient: 'Dad',
  relationship: 'father',
  destination: 'Scotland',
  dates: 'October',
  weather: 'rainy',
  size: 'XL',
  features: ['waterproof', 'packable'],
  colors: ['navy', 'olive'],
  budgetUsd: 250,
  source: 'fixture',
};

export function publicBriefFromFixture(
  context: PrivateContext = DAD_SCOTLAND_FIXTURE,
): PublicBrief {
  return {
    category: 'jacket',
    size: context.size,
    features: [...context.features],
    colors: [...context.colors],
  };
}

export function merchantQueryFromBrief(brief: PublicBrief): string {
  return [brief.size, ...brief.features, ...brief.colors, brief.category].join(' ');
}

export function browseCatalog(): CatalogItem[] {
  return CATALOG;
}

export function withheldFacts(context: PrivateContext = DAD_SCOTLAND_FIXTURE): WithheldFact[] {
  const facts: WithheldFact[] = [
    { label: 'Recipient', value: context.recipient },
    { label: 'Relationship', value: context.relationship },
    { label: 'Destination', value: context.destination },
    { label: 'Dates', value: context.dates },
    { label: 'Weather', value: context.weather },
    { label: 'Size', value: context.size },
    { label: 'Features', value: context.features.join(', ') },
    { label: 'Colors', value: context.colors.join(', ') },
    { label: 'Budget', value: `$${context.budgetUsd}` },
  ];
  if (context.calendarSummary) {
    facts.push({ label: 'Calendar', value: context.calendarSummary });
  }
  facts.push({
    label: 'Source',
    value:
      context.source === 'arcade'
        ? 'Gmail via Arcade, read on the server.'
        : 'Demo fixture. Arcade is not connected on this host.',
  });
  return facts;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejectedFields(keys: string[]): string {
  return `Merchant rejected unexpected fields: ${keys.join(', ')}`;
}

function parseSize(value: unknown): CatalogSize | undefined {
  return typeof value === 'string' && SIZES.has(value as CatalogSize)
    ? (value as CatalogSize)
    : undefined;
}

/**
 * An enum list can hold at most one of each allowed value, so an array longer than the
 * allowed set is rejected before it is walked (a 5,000-entry payload never reaches the
 * adapter), and a short list that repeats a value collapses to one entry: the receipt shows
 * ['waterproof'] for ['waterproof', 'waterproof']. The schema says the same with
 * maxItems and uniqueItems (lib/webmcp.ts); this is the server-side check behind it.
 */
function parseStringList<T extends string>(value: unknown, allowed: Set<T>): T[] | undefined {
  if (!Array.isArray(value) || value.length === 0 || value.length > allowed.size) {
    return undefined;
  }
  const parsed = new Set<T>();
  for (const entry of value) {
    if (typeof entry !== 'string' || !allowed.has(entry as T)) return undefined;
    parsed.add(entry as T);
  }
  return [...parsed];
}

export function parsePublicBrief(input: unknown): ParseBriefResult {
  if (!isRecord(input)) {
    return { ok: false, error: 'Catalog request must be an object' };
  }

  const extra = Object.keys(input).filter(key => !ALLOWED_KEYS.has(key));
  if (extra.length > 0) {
    return { ok: false, error: rejectedFields(extra) };
  }

  const category = input.category;
  if (typeof category !== 'string' || !CATEGORIES.has(category as CatalogCategory)) {
    return { ok: false, error: 'category must be jacket' };
  }

  const size = parseSize(input.size);
  if (!size) {
    return { ok: false, error: 'size must be a listed catalog size' };
  }

  const features = parseStringList(input.features, FEATURES);
  if (!features) {
    return { ok: false, error: 'features must be waterproof and packable values' };
  }

  const colors = parseStringList(input.colors, COLORS);
  if (!colors) {
    return { ok: false, error: 'colors must be navy or olive' };
  }

  return {
    ok: true,
    brief: {
      category: category as CatalogCategory,
      size,
      features,
      colors,
    },
  };
}

export function searchInventory(brief: PublicBrief): CatalogItem[] {
  return CATALOG.filter(item => {
    const sizeOk = !item.size || item.size === brief.size;
    const featureOk = brief.features.every(feature => item.features.includes(feature));
    const colorOk =
      item.colors.length === 0 || item.colors.some(color => brief.colors.includes(color));
    const categoryOk = !item.category || item.category === brief.category;
    return sizeOk && featureOk && colorOk && categoryOk;
  });
}

export function rankForTrip(
  items: CatalogItem[],
  context: PrivateContext = DAD_SCOTLAND_FIXTURE,
): CatalogItem[] {
  return [...items].sort((left, right) => {
    const leftUnder = left.priceUsd <= context.budgetUsd ? 0 : 1;
    const rightUnder = right.priceUsd <= context.budgetUsd ? 0 : 1;
    if (leftUnder !== rightUnder) return leftUnder - rightUnder;
    const ratingDelta = (right.rating ?? 0) - (left.rating ?? 0);
    if (ratingDelta !== 0) return ratingDelta;
    return left.priceUsd - right.priceUsd;
  });
}

export function completeSearch(
  receipt: PublicBrief,
  items: CatalogItem[],
  context: PrivateContext = DAD_SCOTLAND_FIXTURE,
  extras: {
    merchantQuery?: string;
    merchant?: MerchantSource;
    arcadeRequest?: ArcadeRequest;
    cached?: boolean;
  } = {},
): VitrineSearchResult {
  const result: VitrineSearchResult = {
    receipt,
    merchantQuery: extras.merchantQuery ?? merchantQueryFromBrief(receipt),
    merchant: extras.merchant ?? 'recorded_sample',
    items,
    shortlist: rankForTrip(items, context),
  };
  if (extras.arcadeRequest) result.arcadeRequest = extras.arcadeRequest;
  if (extras.cached !== undefined) result.cached = extras.cached;
  return result;
}

export function emptyMerchantView(): MerchantView {
  return {
    receipt: null,
    merchantQuery: null,
    merchant: null,
    shortlist: [],
    comparedIds: [],
    preparedId: null,
  };
}

export function viewFromSearch(
  result: VitrineSearchResult,
  webmcp: WebmcpStatus,
  options: {
    context?: PrivateContext;
    arcadeConnected?: boolean;
    comparedIds?: string[];
    preparedId?: string | null;
  } = {},
): VitrineView {
  const context = options.context ?? DAD_SCOTLAND_FIXTURE;
  return {
    arcadeConnected: options.arcadeConnected ?? false,
    webmcp,
    vault: {
      context,
      withheld: withheldFacts(context),
    },
    merchant: {
      receipt: result.receipt,
      merchantQuery: result.merchantQuery,
      merchant: result.merchant,
      shortlist: result.shortlist,
      comparedIds: options.comparedIds ?? [],
      preparedId: options.preparedId ?? null,
    },
  };
}

export function merchantViewCopy(view: MerchantView): string {
  return JSON.stringify({
    receipt: view.receipt,
    merchantQuery: view.merchantQuery,
    merchant: view.merchant,
    shortlist: view.shortlist.map(item => ({
      id: item.id,
      name: item.name,
      priceUsd: item.priceUsd,
      merchantName: item.merchantName,
      rating: item.rating,
      url: item.url,
    })),
    comparedIds: view.comparedIds,
    preparedId: view.preparedId,
  });
}

export function privateMarkersInMerchantCopy(copy: string): string[] {
  return VAULT_MARKERS.filter(marker => copy.includes(marker));
}

export type CatalogSearchSuccess = {
  ok: true;
  status: 200;
  receipt: PublicBrief;
  merchantQuery: string;
  merchant: MerchantSource;
  items: CatalogItem[];
  arcadeRequest?: ArcadeRequest;
  cached?: boolean;
};

export type CatalogSearchFailure = {
  ok: false;
  status: 400;
  error: string;
};

export type CatalogSearchResponse = CatalogSearchSuccess | CatalogSearchFailure;

export function handleCatalogSearch(body: unknown): CatalogSearchResponse {
  const parsed = parsePublicBrief(body);
  if (!parsed.ok) {
    return { ok: false, status: 400, error: parsed.error };
  }

  return {
    ok: true,
    status: 200,
    receipt: parsed.brief,
    merchantQuery: merchantQueryFromBrief(parsed.brief),
    merchant: 'recorded_sample',
    items: searchInventory(parsed.brief),
  };
}

/**
 * Order live merchant rows by how well their listing text honors the public brief.
 * Keyword search engines return loose matches; the shop should show the ones that
 * actually carry the requested size, features, and colors first. Ties keep merchant order.
 */
export function rankItemsByBrief(items: CatalogItem[], brief: PublicBrief): CatalogItem[] {
  const score = (item: CatalogItem): number => {
    const text = item.name.toLowerCase();
    const sizeHit = new RegExp(`\\b${brief.size.toLowerCase()}\\b`).test(text) ? 1 : 0;
    const featureHits = brief.features.filter(feature => item.features.includes(feature)).length;
    const colorHits = brief.colors.filter(color => item.colors.includes(color)).length;
    return featureHits * 2 + colorHits * 2 + sizeHit;
  };
  return items
    .map((item, index) => ({ item, index, score: score(item) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(entry => entry.item);
}

export async function handleMerchantSearch(
  body: unknown,
  options: {
    searchLive?: (
      merchantQuery: string,
      signal?: AbortSignal,
    ) => Promise<{
      items: CatalogItem[];
      merchant: MerchantSource;
      arcadeRequest?: ArcadeRequest;
      cached?: boolean;
    } | null>;
    signal?: AbortSignal;
  } = {},
): Promise<CatalogSearchResponse> {
  const parsed = handleCatalogSearch(body);
  if (!parsed.ok) return parsed;

  if (options.searchLive) {
    const live = await options.searchLive(parsed.merchantQuery, options.signal);
    if (live && live.items.length > 0) {
      const success: CatalogSearchSuccess = {
        ...parsed,
        merchant: live.merchant,
        items: rankItemsByBrief(live.items, parsed.receipt),
      };
      if (live.arcadeRequest) success.arcadeRequest = live.arcadeRequest;
      if (live.cached !== undefined) success.cached = live.cached;
      return success;
    }
  }

  return parsed;
}

function parseArcadeRequest(value: unknown): ArcadeRequest | undefined {
  if (!isRecord(value) || typeof value.tool !== 'string' || !isRecord(value.input)) {
    return undefined;
  }
  if (value.tool !== 'Walmart.SearchProducts' && value.tool !== 'GoogleShopping.SearchProducts') {
    return undefined;
  }
  if (typeof value.input.keywords !== 'string') return undefined;
  return { tool: value.tool, input: { keywords: value.input.keywords } };
}

export async function runVitrineSearch(
  brief: PublicBrief,
  options: {
    fetch?: typeof fetch;
    catalogUrl?: string;
    signal?: AbortSignal;
    context?: PrivateContext;
  } = {},
): Promise<VitrineSearchResult> {
  const fetchImpl = options.fetch ?? fetch;
  const response = await fetchImpl(options.catalogUrl ?? '/api/catalog/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(brief),
    signal: options.signal,
  });

  const payload = (await response.json()) as {
    error?: string;
    receipt?: unknown;
    items?: unknown;
    merchantQuery?: unknown;
    merchant?: unknown;
    arcadeRequest?: unknown;
    cached?: unknown;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? `Catalog search failed: ${response.status}`);
  }

  const parsedReceipt = parsePublicBrief(payload.receipt);
  if (!parsedReceipt.ok) {
    throw new Error(parsedReceipt.error);
  }

  if (!Array.isArray(payload.items)) {
    throw new Error('Merchant response missing inventory');
  }

  const merchantQuery =
    typeof payload.merchantQuery === 'string' && payload.merchantQuery.trim()
      ? payload.merchantQuery
      : merchantQueryFromBrief(parsedReceipt.brief);

  const merchant: MerchantSource =
    payload.merchant === 'google_shopping' || payload.merchant === 'walmart'
      ? payload.merchant
      : 'recorded_sample';

  return completeSearch(parsedReceipt.brief, payload.items as CatalogItem[], options.context, {
    merchantQuery,
    merchant,
    arcadeRequest: parseArcadeRequest(payload.arcadeRequest),
    cached: payload.cached === true ? true : undefined,
  });
}

export function runGuidedDemo(
  options: Parameters<typeof runVitrineSearch>[1] = {},
): Promise<VitrineSearchResult> {
  return runVitrineSearch(publicBriefFromFixture(options.context), options);
}
