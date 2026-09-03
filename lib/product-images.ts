/**
 * Real product photos for live Walmart rows.
 *
 * Walmart.SearchProducts returns no image field, but every row links to a walmart.com
 * product page whose <head> carries `<meta property="og:image">` pointing at
 * i5.walmartimages.com. This module reads that one tag per product, server-side, with a
 * short timeout and a byte cap, and memoizes the answer per product URL so the six-hour
 * catalog cache and the six-hour photo memo line up: a photo is fetched once per product.
 *
 * Only walmart.com product pages are fetched. Google Shopping rows link to google.com search
 * pages, which carry no product image and are never requested. Only an image host under
 * walmartimages.com is accepted; anything else resolves to null and the card keeps its swatch.
 *
 * On a hosted worker Walmart may block datacenter IPs (bot challenge, 4xx, or an HTML page
 * without the tag). Every failure path resolves to null, `attachProductImages` never throws,
 * and the catalog grid renders its swatch fallback for that card. Nothing here touches the
 * shopper's brief: the only input is the merchant's own product link.
 */
import type { CatalogItem } from './vitrine.ts';

const PRODUCT_HOST = /(^|\.)walmart\.com$/;
const IMAGE_HOST = /(^|\.)walmartimages\.com$/;
const OG_IMAGE_TAG =
  /<meta\s+(?=[^>]*property=["']og:image["'])[^>]*content=["']([^"']+)["'][^>]*>/i;

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const TIMEOUT_MS = 4_000;
/** The tag sits in the first few KB; the cap only bounds a page that never ends. */
const MAX_BYTES = 600_000;
const HIT_TTL_MS = 6 * 60 * 60 * 1000;
/** A miss (blocked, timed out, no tag) is retried after ten minutes, not six hours. */
const MISS_TTL_MS = 10 * 60 * 1000;

const memo = new Map<string, { expires: number; promise: Promise<string | null> }>();

export function clearProductImageMemo(): void {
  memo.clear();
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isWalmartProductUrl(url: string): boolean {
  const host = hostOf(url);
  return host !== null && PRODUCT_HOST.test(host);
}

/** The og:image URL from a product page, or null when the tag is missing or off-host. */
export function parseWalmartImage(html: string): string | null {
  const match = OG_IMAGE_TAG.exec(html);
  if (!match) return null;
  const candidate = match[1].replace(/&amp;/g, '&').trim();
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || !IMAGE_HOST.test(parsed.hostname.toLowerCase())) {
    return null;
  }
  return parsed.toString();
}

async function readPrefix(response: Response, maxBytes: number): Promise<string> {
  const body = response.body;
  if (!body) return (await response.text()).slice(0, maxBytes);
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  try {
    while (bytes < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.cancel().catch(() => undefined);
  }
  return text;
}

/**
 * GET the walmart.com product link (redirects followed) with a desktop Chrome user agent and
 * read at most ~600 KB, looking for og:image. Resolves null on timeout, non-2xx, a missing
 * tag, an image host outside walmartimages.com, or any thrown error. Never rejects.
 */
export async function fetchWalmartImage(
  url: string,
  fetchImpl: typeof fetch = fetch,
  options: { timeoutMs?: number } = {},
): Promise<string | null> {
  if (!isWalmartProductUrl(url)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const html = await readPrefix(response, MAX_BYTES);
    return parseWalmartImage(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function memoizedImage(
  url: string,
  fetchImpl: typeof fetch,
  timeoutMs: number | undefined,
): Promise<string | null> {
  const now = Date.now();
  const held = memo.get(url);
  if (held && held.expires > now) return held.promise;
  const promise = fetchWalmartImage(url, fetchImpl, { timeoutMs }).then(image => {
    memo.set(url, { expires: Date.now() + (image ? HIT_TTL_MS : MISS_TTL_MS), promise });
    return image;
  });
  memo.set(url, { expires: now + MISS_TTL_MS, promise });
  return promise;
}

/**
 * Fill `imageUrl` in place for every item that links to walmart.com and has no image yet.
 * Runs at most `concurrency` page reads at a time, settles every one, and never throws:
 * an item whose photo cannot be read keeps `imageUrl: ''`.
 */
export async function attachProductImages(
  items: CatalogItem[],
  options: { concurrency?: number; fetch?: typeof fetch; timeoutMs?: number } = {},
): Promise<void> {
  const pending = items.filter(item => !item.imageUrl && isWalmartProductUrl(item.url));
  if (pending.length === 0) return;
  const fetchImpl = options.fetch ?? fetch;
  const concurrency = Math.max(1, options.concurrency ?? 6);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < pending.length) {
      const item = pending[next];
      next += 1;
      const image = await memoizedImage(item.url, fetchImpl, options.timeoutMs).catch(() => null);
      if (image) item.imageUrl = image;
    }
  };
  await Promise.allSettled(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
}
