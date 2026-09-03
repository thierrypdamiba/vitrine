import {
  ArcadeAuthorizationRequired,
  ArcadeContextError,
  createArcadeTools,
  isRecord,
  readArcadeConfig,
  type ArcadeTools,
} from './arcade-client.ts';
import type { CatalogItem, MerchantSource } from './vitrine.ts';

export const ARCADE_SHOPPING_TOOL = 'GoogleShopping.SearchProducts';
export const ARCADE_WALMART_TOOL = 'Walmart.SearchProducts';

const MAX_LIVE_ITEMS = 8;

function parsePriceUsd(value: unknown): number | null {
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
      row.product_link,
      row.product_page_url,
      row.link,
      row.url,
      row.serpapi_product_api,
    );
    const imageUrl = firstString(
      row.thumbnail,
      row.image,
      Array.isArray(row.thumbnails) ? row.thumbnails[0] : undefined,
      Array.isArray(row.product_photos) ? row.product_photos[0] : undefined,
    );
    const merchantName =
      firstString(row.source, row.merchant, row.seller, row.seller_name, offer.seller) ??
      (merchant === 'walmart' ? 'Walmart' : 'Google Shopping');
    items.push({
      id: firstString(row.product_id, row.id) ?? slugId(name, index),
      name,
      priceUsd,
      imageUrl: imageUrl ?? '',
      merchantName,
      rating: parseRating(row.rating ?? row.stars),
      url: url ?? `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(name)}`,
      features: featuresFromText(name),
      colors: colorsFromText(name),
    });
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
  const attempts: Record<string, string>[] = [{ query: merchantQuery }, { q: merchantQuery }];
  let lastError: unknown;
  for (const input of attempts) {
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
  }
  throw lastError instanceof Error
    ? lastError
    : new ArcadeContextError('Arcade product search failed');
}

export async function searchLiveProducts(
  merchantQuery: string,
  options: {
    tools?: ArcadeTools;
    userId?: string;
    signal?: AbortSignal;
  } = {},
): Promise<{ items: CatalogItem[]; merchant: MerchantSource } | null> {
  if (options.signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }

  const config = options.tools && options.userId ? null : readArcadeConfig();
  const tools = options.tools ?? (config ? createArcadeTools(config) : null);
  const userId = options.userId ?? config?.userId;
  if (!tools || !userId) return null;

  const attempts: Array<{ tool: string; merchant: MerchantSource }> = [
    { tool: ARCADE_SHOPPING_TOOL, merchant: 'google_shopping' },
    { tool: ARCADE_WALMART_TOOL, merchant: 'walmart' },
  ];

  for (const attempt of attempts) {
    if (options.signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }
    try {
      const value = await executeProductSearch(tools, userId, attempt.tool, merchantQuery);
      const items = parseShoppingProducts(value, attempt.merchant);
      if (items.length > 0) {
        return { items, merchant: attempt.merchant };
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
    }
  }

  return null;
}
