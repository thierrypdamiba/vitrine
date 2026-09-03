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

export const GLEN_PACKABLE_SHELL_ID = 'glen-packable-shell';

export const JUDGE_PROMPT = `I'm shopping on this jacket site. Find Dad a jacket for a rainy October trip to Scotland. Keep it under $250. Call search_products with only category, size, features, and colors. Do not send Dad, Scotland, October, or the budget. Then compare two options and prepare a selection for me to open.`;

export type CatalogCategory = 'jacket';
export type CatalogSize = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type CatalogFeature = 'waterproof' | 'packable';
export type CatalogColor = 'navy' | 'olive';
export type MerchantSource = 'google_shopping' | 'walmart' | 'recorded_sample';

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

function sampleUrl(name: string): string {
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(name)}`;
}

export const CATALOG: CatalogItem[] = [
  {
    id: GLEN_PACKABLE_SHELL_ID,
    name: 'REI Co-op Rainier Packable Shell',
    priceUsd: 180,
    imageUrl:
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=640&q=80',
    merchantName: 'REI',
    rating: 4.6,
    url: sampleUrl('REI Co-op Rainier Packable Shell'),
    category: 'jacket',
    size: 'XL',
    features: ['waterproof', 'packable'],
    colors: ['navy'],
  },
  {
    id: 'cuillin-expedition-parka',
    name: "Arc'teryx Beta AR Jacket",
    priceUsd: 429,
    imageUrl:
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=640&q=80',
    merchantName: 'Backcountry',
    rating: 4.8,
    url: sampleUrl("Arc'teryx Beta AR Jacket"),
    category: 'jacket',
    size: 'XL',
    features: ['waterproof', 'packable'],
    colors: ['olive'],
  },
  {
    id: 'forth-city-coat',
    name: 'Uniqlo Blocktech Coat',
    priceUsd: 195,
    imageUrl:
      'https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?auto=format&fit=crop&w=640&q=80',
    merchantName: 'Uniqlo',
    rating: 4.3,
    url: sampleUrl('Uniqlo Blocktech Coat'),
    category: 'jacket',
    size: 'XL',
    features: [],
    colors: ['navy'],
  },
  {
    id: 'skye-trail-rain',
    name: 'Patagonia Torrentshell 3L',
    priceUsd: 88,
    imageUrl:
      'https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=640&q=80',
    merchantName: 'Patagonia',
    rating: 4.5,
    url: sampleUrl('Patagonia Torrentshell 3L'),
    category: 'jacket',
    size: 'M',
    features: ['waterproof', 'packable'],
    colors: ['olive'],
  },
];

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

export function withheldFacts(context: PrivateContext = DAD_SCOTLAND_FIXTURE): WithheldFact[] {
  const facts: WithheldFact[] = [
    { label: 'Recipient', value: context.recipient },
    { label: 'Relationship', value: context.relationship },
    { label: 'Destination', value: context.destination },
    { label: 'Dates', value: context.dates },
    { label: 'Weather', value: context.weather },
    { label: 'Budget', value: `$${context.budgetUsd}` },
  ];
  if (context.calendarSummary) {
    facts.push({ label: 'Calendar', value: context.calendarSummary });
  }
  facts.push({
    label: 'Source',
    value:
      context.source === 'arcade'
        ? 'Arcade Gmail and Calendar. These stay in the vault.'
        : 'Demo vault. Arcade is not connected.',
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

function parseStringList<T extends string>(value: unknown, allowed: Set<T>): T[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const parsed: T[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string' || !allowed.has(entry as T)) return undefined;
    parsed.push(entry as T);
  }
  return parsed;
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
  extras: { merchantQuery?: string; merchant?: MerchantSource } = {},
): VitrineSearchResult {
  return {
    receipt,
    merchantQuery: extras.merchantQuery ?? merchantQueryFromBrief(receipt),
    merchant: extras.merchant ?? 'recorded_sample',
    items,
    shortlist: rankForTrip(items, context),
  };
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

export async function handleMerchantSearch(
  body: unknown,
  options: {
    searchLive?: (
      merchantQuery: string,
      signal?: AbortSignal,
    ) => Promise<{ items: CatalogItem[]; merchant: MerchantSource } | null>;
    signal?: AbortSignal;
  } = {},
): Promise<CatalogSearchResponse> {
  const parsed = handleCatalogSearch(body);
  if (!parsed.ok) return parsed;

  if (options.searchLive) {
    const live = await options.searchLive(parsed.merchantQuery, options.signal);
    if (live && live.items.length > 0) {
      return {
        ...parsed,
        merchant: live.merchant,
        items: live.items,
      };
    }
  }

  return parsed;
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
  });
}

export function runGuidedDemo(
  options: Parameters<typeof runVitrineSearch>[1] = {},
): Promise<VitrineSearchResult> {
  return runVitrineSearch(publicBriefFromFixture(options.context), options);
}
