import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, it } from 'node:test';

import {
  buildArcadeShoppingInput,
  clearLiveCache,
  filterRowsForBrief,
  parseShoppingProducts,
  searchLiveProducts,
} from './shopping.ts';
import { clearProductImageMemo } from './product-images.ts';
import { publicBriefFromFixture, type CatalogItem } from './vitrine.ts';

const XL_QUERY = 'XL waterproof packable navy olive jacket';
const OG_IMAGE = 'https://i5.walmartimages.com/seo/Storm-Rain-Jacket_be500fdd.png';

/** Stands in for walmart.com so tests never read product pages over the network. */
const imageFetch: typeof fetch = async () =>
  new Response(`<html><head><meta property="og:image" content="${OG_IMAGE}"/></head></html>`);

function walmartRow(item_id: string, title: string, value = 49.99) {
  return {
    item_id,
    title,
    link: `https://www.walmart.com/ip/${item_id}`,
    price: { currency: null, value },
    rating: 4.3,
    seller: { name: 'Walmart' },
  };
}

const LIVE_WALMART_ROWS = [
  walmartRow('1', 'Packable Rain Jacket for Women Waterproof Raincoats with Hood Navy Blue XL'),
  walmartRow('2', 'Origin Packable Waterproof Jacket - Purple - XL'),
  walmartRow('3', 'Plus Size Womens Rain Jacket with Hood Packable Lightweight'),
  walmartRow('4', "Men's Storm Rain Jacket, Olive, X-Large"),
  walmartRow('5', "Men's Waterproof Rain Jacket - Lightweight Hooded Navy, XL"),
  walmartRow('6', 'Kids Puffer Jacket Navy Size M'),
  walmartRow('7', 'Ceramic Coffee Mug 12 oz'),
  walmartRow('8', "Men's Stadium Packable Windbreaker Jacket"),
];

function spyTools(rows: unknown[] = LIVE_WALMART_ROWS) {
  const calls: Array<{ tool_name: string; input: Record<string, unknown> }> = [];
  return {
    calls,
    tools: {
      async get() {
        return {};
      },
      async execute(request: { tool_name: string; input: Record<string, unknown> }) {
        calls.push({ tool_name: request.tool_name, input: request.input });
        return { success: true, output: { value: { products: rows } } };
      },
    },
  };
}

describe('parseShoppingProducts', () => {
  it('maps Google Shopping rows into catalog cards', () => {
    const items = parseShoppingProducts(
      {
        shopping_results: [
          {
            product_id: 'shell-1',
            title: 'Navy waterproof packable jacket',
            extracted_price: 179,
            source: 'REI',
            rating: 4.6,
            thumbnail: 'https://example.com/shell.jpg',
            product_link: 'https://example.com/products/shell',
          },
          {
            title: 'Missing price jacket',
            source: 'Unknown',
          },
        ],
      },
      'google_shopping',
    );
    assert.equal(items.length, 1);
    assert.equal(items[0]?.id, 'shell-1');
    assert.equal(items[0]?.priceUsd, 179);
    assert.equal(items[0]?.merchantName, 'REI');
    assert.ok(items[0]?.features.includes('waterproof'));
    assert.ok(items[0]?.colors.includes('navy'));
  });

  it('maps Walmart offer rows', () => {
    const items = parseShoppingProducts(
      {
        organic_results: [
          {
            title: 'Olive rain jacket',
            primary_offer: { offer_price: 92, seller: 'Walmart' },
            rating: '4.2',
            product_page_url: 'https://example.com/walmart/jacket',
          },
        ],
      },
      'walmart',
    );
    assert.equal(items[0]?.priceUsd, 92);
    assert.equal(items[0]?.merchantName, 'Walmart');
  });
});

describe('parseShoppingProducts with live Arcade shapes', () => {
  it('maps GoogleShopping.SearchProducts rows (price string, google_link, product_rating)', () => {
    const items = parseShoppingProducts(
      {
        products: [
          {
            delivery: null,
            direct_link: null,
            google_link: 'https://www.google.com/search?ibp=oshop&q=jacket&prds=productid:1',
            price: '$109.95',
            product_rating: 4.5,
            product_reviews: 2,
            source: 'Coldwater Creek',
            title: 'Navy Pack-It Jacket - XL',
          },
        ],
      },
      'google_shopping',
    );
    assert.equal(items.length, 1);
    assert.equal(items[0]?.priceUsd, 110);
    assert.equal(items[0]?.rating, 4.5);
    assert.equal(items[0]?.merchantName, 'Coldwater Creek');
    assert.equal(
      items[0]?.url,
      'https://www.google.com/search?ibp=oshop&q=jacket&prds=productid:1',
    );
    assert.ok(items[0]?.colors.includes('navy'));
  });

  it('maps Walmart.SearchProducts rows (price object, seller object, link)', () => {
    const items = parseShoppingProducts(
      {
        current_page: 1,
        last_available_page: 14,
        products: [
          {
            description: null,
            item_id: '20841112033',
            link: 'https://www.walmart.com/ip/Packable-Rain-Jacket-Navy-Blue-XL/20841112033',
            price: { currency: null, value: 42.99 },
            rating: 4.4,
            reviews_count: 818,
            seller: { id: 'abc', name: 'Pdbokew' },
            title: 'Packable Rain Jacket for Women Waterproof Raincoats with Hood Navy Blue XL',
          },
        ],
      },
      'walmart',
    );
    assert.equal(items.length, 1);
    assert.equal(items[0]?.priceUsd, 43);
    assert.equal(items[0]?.merchantName, 'Pdbokew');
    assert.equal(
      items[0]?.url,
      'https://www.walmart.com/ip/Packable-Rain-Jacket-Navy-Blue-XL/20841112033',
    );
    assert.deepEqual(items[0]?.features, ['waterproof', 'packable']);
  });
});

describe('searchLiveProducts', () => {
  beforeEach(() => {
    clearLiveCache();
    clearProductImageMemo();
  });

  it('sends only keywords to Arcade', async () => {
    assert.deepEqual(Object.keys(buildArcadeShoppingInput(XL_QUERY)), ['keywords']);

    const spy = spyTools();
    const result = await searchLiveProducts(XL_QUERY, {
      tools: spy.tools as never,
      userId: 'shopper-1',
      brief: publicBriefFromFixture(),
      imageFetch,
    });
    assert.equal(spy.calls.length, 1);
    assert.equal(spy.calls[0]?.tool_name, 'Walmart.SearchProducts');
    assert.deepEqual(spy.calls[0]?.input, { keywords: XL_QUERY });
    for (const key of ['max_price', 'min_price', 'sort_by']) {
      assert.equal(key in (spy.calls[0]?.input ?? {}), false);
    }
    assert.deepEqual(result?.arcadeRequest, {
      tool: 'Walmart.SearchProducts',
      input: { keywords: XL_QUERY },
    });
    assert.equal(result?.cached, false);
    assert.equal(result?.merchant, 'walmart');
    assert.equal(result?.items[0]?.id.startsWith('walmart-'), true);
    assert.equal(result?.items[0]?.url.startsWith('https://www.walmart.com/ip/'), true);
    assert.ok(result?.items.every(item => item.imageUrl === OG_IMAGE));
  });

  it('caches results with their photos and keeps a card without one at imageUrl empty', async () => {
    let pageReads = 0;
    const flaky: typeof fetch = async input => {
      pageReads += 1;
      if (String(input).endsWith('/ip/4')) return new Response('', { status: 403 });
      return imageFetch(input);
    };
    const spy = spyTools();
    const options = {
      tools: spy.tools as never,
      userId: 'shopper-1',
      brief: publicBriefFromFixture(),
      imageFetch: flaky,
    };
    const first = await searchLiveProducts(XL_QUERY, options);
    const second = await searchLiveProducts(XL_QUERY, options);
    assert.equal(pageReads, first?.items.length);
    const olive = first?.items.find(item => item.url.endsWith('/ip/4'));
    assert.equal(olive?.imageUrl, '');
    assert.ok(
      first?.items.filter(item => item !== olive).every(item => item.imageUrl === OG_IMAGE),
    );
    assert.deepEqual(second?.items, first?.items);
  });

  it("filters women's, kids, and unrelated rows", () => {
    const rows = parseShoppingProducts({ products: LIVE_WALMART_ROWS }, 'walmart');
    const kept = filterRowsForBrief(rows, publicBriefFromFixture());
    const titles = kept.map(item => item.name);
    assert.deepEqual(
      titles.sort(),
      [
        "Men's Stadium Packable Windbreaker Jacket",
        "Men's Storm Rain Jacket, Olive, X-Large",
        "Men's Waterproof Rain Jacket - Lightweight Hooded Navy, XL",
        'Origin Packable Waterproof Jacket - Purple - XL',
      ].sort(),
    );
    assert.equal(kept[0]?.name, "Men's Waterproof Rain Jacket - Lightweight Hooded Navy, XL");
    assert.equal(kept[0]?.size, 'XL');
    assert.equal(kept.length <= 8, true);
  });

  it('keeps at most eight rows in brief order', () => {
    const items: CatalogItem[] = Array.from({ length: 12 }, (_, index) => ({
      id: `row-${index}`,
      name: index % 2 ? `Navy shell ${index}` : `Waterproof packable navy olive XL shell ${index}`,
      priceUsd: 100 + index,
      imageUrl: '',
      merchantName: 'Walmart',
      rating: null,
      url: 'https://example.com',
      features: index % 2 ? [] : ['waterproof', 'packable'],
      colors: index % 2 ? ['navy'] : ['navy', 'olive'],
      size: index % 2 ? undefined : 'XL',
    }));
    const kept = filterRowsForBrief(items, publicBriefFromFixture());
    assert.equal(kept.length, 8);
    assert.deepEqual(
      kept.map(item => item.id),
      ['row-0', 'row-2', 'row-4', 'row-6', 'row-8', 'row-10', 'row-1', 'row-3'],
    );
  });

  it('returns null below the threshold instead of mixing live and sample rows', async () => {
    const spy = spyTools([
      walmartRow('1', "Men's Storm Rain Jacket, Olive, X-Large"),
      walmartRow('2', 'Ceramic Coffee Mug 12 oz'),
    ]);
    const result = await searchLiveProducts(XL_QUERY, {
      tools: spy.tools as never,
      userId: 'shopper-1',
      brief: publicBriefFromFixture(),
      imageFetch,
    });
    assert.equal(result, null);
    assert.deepEqual(
      spy.calls.map(call => call.tool_name),
      ['Walmart.SearchProducts', 'GoogleShopping.SearchProducts'],
    );
  });

  it('second call with the same keywords does not call execute again', async () => {
    const spy = spyTools();
    const options = {
      tools: spy.tools as never,
      userId: 'shopper-1',
      brief: publicBriefFromFixture(),
      imageFetch,
    };
    const first = await searchLiveProducts(XL_QUERY, options);
    const second = await searchLiveProducts(XL_QUERY, options);
    assert.equal(spy.calls.length, 1);
    assert.equal(first?.cached, false);
    assert.equal(second?.cached, true);
    assert.deepEqual(second?.items, first?.items);
    assert.deepEqual(second?.arcadeRequest, first?.arcadeRequest);
  });
});

describe('shopping module boundary', () => {
  it('does not import Gmail or Calendar loaders', () => {
    const source = readFileSync(new URL('./shopping.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('Gmail'), false);
    assert.equal(source.includes('GoogleCalendar'), false);
    assert.equal(source.includes('loadPrivateContextFromArcade'), false);
  });
});

describe('filterRowsForBrief size contradiction', () => {
  it('drops rows that name a different size than the brief', () => {
    const base = { priceUsd: 40, imageUrl: '', merchantName: 'x', rating: null, url: 'u' };
    const items: CatalogItem[] = [
      {
        ...base,
        id: 'a',
        name: 'Packable Puffer S',
        features: ['waterproof', 'packable'],
        colors: [],
        size: 'S',
      },
      {
        ...base,
        id: 'b',
        name: 'Storm Rain Jacket XL',
        features: ['waterproof'],
        colors: ['olive'],
        size: 'XL',
      },
      {
        ...base,
        id: 'c',
        name: 'Origin Packable Shell',
        features: ['waterproof', 'packable'],
        colors: [],
      },
    ];
    const kept = filterRowsForBrief(items, {
      category: 'jacket',
      size: 'XL',
      features: ['waterproof', 'packable'],
      colors: ['navy', 'olive'],
    }).map(item => item.id);
    assert.deepEqual(kept.sort(), ['b', 'c']);
  });
});

describe('sizeFromText via parseShoppingProducts', () => {
  it('reads XL, X-Large, and Extra Large as XL and Large as L', () => {
    const rows = [
      'Shell XL',
      'Storm Jacket, Olive, X-Large',
      'Extra Large Anorak',
      'Large Rain Coat',
      'Small Parka',
    ].map((title, index) => ({ title, price: '$10', link: `u${index}`, item_id: String(index) }));
    const sizes = parseShoppingProducts({ products: rows }, 'walmart').map(item => item.size);
    assert.deepEqual(sizes, ['XL', 'XL', 'XL', 'L', 'S']);
  });
});
