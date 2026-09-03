import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  attachProductImages,
  clearProductImageMemo,
  fetchWalmartImage,
  parseWalmartImage,
} from './product-images.ts';
import type { CatalogItem } from './vitrine.ts';

const IMAGE = 'https://i5.walmartimages.com/seo/Arctix-Men-s-Storm-Rain-Jacket_be500fdd.png';
const PRODUCT = 'https://www.walmart.com/ip/5202108267';

function page(image: string): string {
  return `<!DOCTYPE html><html><head><meta charSet="utf-8"/><meta property="fb:app_id" content="1"/><meta property="og:image" content="${image}"/><title>Arctix</title></head><body></body></html>`;
}

function htmlFetch(html: string, status = 200): typeof fetch {
  return async () => new Response(html, { status, headers: { 'content-type': 'text/html' } });
}

function item(url: string, imageUrl = ''): CatalogItem {
  return {
    id: url,
    name: 'Jacket',
    priceUsd: 40,
    imageUrl,
    merchantName: 'Walmart',
    rating: null,
    url,
    features: [],
    colors: [],
  };
}

describe('fetchWalmartImage', () => {
  it('reads og:image from the product page with a desktop browser request', async () => {
    let seen: { url: string; init: RequestInit | undefined } | null = null;
    const fetchImpl: typeof fetch = async (input, init) => {
      seen = { url: String(input), init };
      return new Response(page(IMAGE));
    };
    assert.equal(await fetchWalmartImage(PRODUCT, fetchImpl), IMAGE);
    assert.ok(seen);
    const { url, init } = seen as { url: string; init: RequestInit };
    assert.equal(url, PRODUCT);
    assert.equal(init.redirect, 'follow');
    const headers = init.headers as Record<string, string>;
    assert.match(headers['User-Agent'], /Chrome/);
    assert.match(headers.Accept, /text\/html/);
    assert.ok(init.signal instanceof AbortSignal);
  });

  it('rejects an image host outside walmartimages.com', async () => {
    const off = 'https://cdn.evil.example/walmartimages.com/x.png';
    assert.equal(parseWalmartImage(page(off)), null);
    assert.equal(parseWalmartImage(page('https://notwalmartimages.com/x.png')), null);
    assert.equal(parseWalmartImage(page('http://i5.walmartimages.com/x.png')), null);
    assert.equal(await fetchWalmartImage(PRODUCT, htmlFetch(page(off))), null);
    assert.equal(
      parseWalmartImage(page('https://i5.walmartimages.com/a.png?w=1&amp;h=2')),
      IMAGE.replace(/seo.*/, 'a.png?w=1&h=2'),
    );
  });

  it('resolves null on timeout', async () => {
    const hangs: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('The operation was aborted.', 'AbortError')),
        );
      });
    const started = Date.now();
    assert.equal(await fetchWalmartImage(PRODUCT, hangs, { timeoutMs: 20 }), null);
    assert.ok(Date.now() - started < 2_000);
  });

  it('resolves null for non-walmart links, non-2xx pages, and pages without the tag', async () => {
    let calls = 0;
    const counting: typeof fetch = async () => {
      calls += 1;
      return new Response(page(IMAGE));
    };
    assert.equal(await fetchWalmartImage('https://www.google.com/search?q=jacket', counting), null);
    assert.equal(calls, 0);
    assert.equal(await fetchWalmartImage(PRODUCT, htmlFetch(page(IMAGE), 403)), null);
    assert.equal(await fetchWalmartImage(PRODUCT, htmlFetch('<html><head></head></html>')), null);
  });
});

describe('attachProductImages', () => {
  beforeEach(() => clearProductImageMemo());

  it('fills imageUrl for walmart rows only and leaves failures empty', async () => {
    const items = [
      item('https://www.walmart.com/ip/1'),
      item('https://www.walmart.com/ip/2'),
      item('https://www.google.com/search?tbm=shop&q=jacket'),
      item('https://www.walmart.com/ip/3', 'https://i5.walmartimages.com/already.png'),
    ];
    const requested: string[] = [];
    const fetchImpl: typeof fetch = async input => {
      const url = String(input);
      requested.push(url);
      if (url.endsWith('/2')) throw new Error('connection reset');
      return new Response(page(IMAGE));
    };
    await attachProductImages(items, { concurrency: 6, fetch: fetchImpl });
    assert.deepEqual(requested.sort(), [
      'https://www.walmart.com/ip/1',
      'https://www.walmart.com/ip/2',
    ]);
    assert.equal(items[0].imageUrl, IMAGE);
    assert.equal(items[1].imageUrl, '');
    assert.equal(items[2].imageUrl, '');
    assert.equal(items[3].imageUrl, 'https://i5.walmartimages.com/already.png');
  });

  it('never exceeds the concurrency limit and memoizes per product url', async () => {
    let inFlight = 0;
    let peak = 0;
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise(resolve => setTimeout(resolve, 5));
      inFlight -= 1;
      return new Response(page(IMAGE));
    };
    const items = Array.from({ length: 10 }, (_, i) => item(`https://www.walmart.com/ip/${i}`));
    await attachProductImages(items, { concurrency: 3, fetch: fetchImpl });
    assert.equal(peak <= 3, true);
    assert.equal(calls, 10);
    assert.ok(items.every(entry => entry.imageUrl === IMAGE));

    const again = Array.from({ length: 10 }, (_, i) => item(`https://www.walmart.com/ip/${i}`));
    await attachProductImages(again, { fetch: fetchImpl });
    assert.equal(calls, 10);
    assert.ok(again.every(entry => entry.imageUrl === IMAGE));
  });
});
