import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CATALOG,
  DAD_SCOTLAND_FIXTURE,
  GLEN_PACKABLE_SHELL_ID,
  JUDGE_PROMPT,
  JUDGE_PROMPT_LEAKY,
  PRIVATE_FIELD_NAMES,
  PUBLIC_BRIEF_FIELDS,
  WALMART_ACCEPTS,
  browseCatalog,
  completeSearch,
  handleMerchantSearch,
  merchantQueryFromBrief,
  merchantViewCopy,
  parsePublicBrief,
  privateMarkersInMerchantCopy,
  publicBriefFromFixture,
  rankForTrip,
  runVitrineSearch,
  searchInventory,
  viewFromSearch,
  withheldFacts,
  rankItemsByBrief,
  type ArcadeRequest,
  type CatalogItem,
} from './vitrine.ts';

const fixtureBrief = publicBriefFromFixture();

describe('parsePublicBrief', () => {
  it('accepts the fixture public brief and echoes it as the receipt', () => {
    const parsed = parsePublicBrief(fixtureBrief);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.deepEqual(Object.keys(parsed.brief).sort(), [...PUBLIC_BRIEF_FIELDS].sort());
    assert.deepEqual(parsed.brief, fixtureBrief);
  });

  it('rejects a destination field at the merchant boundary', () => {
    const parsed = parsePublicBrief({ ...fixtureBrief, destination: 'Scotland' });
    assert.equal(parsed.ok, false);
    if (parsed.ok) return;
    assert.match(parsed.error, /destination/i);
  });

  it('rejects every private-context field name', () => {
    for (const field of PRIVATE_FIELD_NAMES) {
      const parsed = parsePublicBrief({ ...fixtureBrief, [field]: 'leaked' });
      assert.equal(parsed.ok, false, `${field} must be rejected`);
    }
  });

  it('rejects an enum list longer than the allowed set, however valid its entries', () => {
    const flood = Array.from({ length: 5000 }, () => 'waterproof');
    const features = parsePublicBrief({ ...fixtureBrief, features: flood });
    assert.equal(features.ok, false);
    if (features.ok) return;
    assert.match(features.error, /features/);
    const colors = parsePublicBrief({ ...fixtureBrief, colors: ['navy', 'olive', 'navy'] });
    assert.equal(colors.ok, false);
  });

  it('collapses a repeated enum value so the receipt lists it once', () => {
    const parsed = parsePublicBrief({
      ...fixtureBrief,
      features: ['waterproof', 'waterproof'],
      colors: ['olive', 'olive'],
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.deepEqual(parsed.brief.features, ['waterproof']);
    assert.deepEqual(parsed.brief.colors, ['olive']);
  });
});

describe('merchantQueryFromBrief', () => {
  it('builds a shopping request from public fields only', () => {
    const query = merchantQueryFromBrief(fixtureBrief);
    assert.equal(query, 'XL waterproof packable navy olive jacket');
    assert.equal(query.includes('Dad'), false);
    assert.equal(query.includes('Scotland'), false);
    assert.equal(query.includes('250'), false);
  });
});

describe('searchInventory and rankForTrip', () => {
  it('returns jackets matching the public brief, including over-budget items', () => {
    const items = searchInventory(fixtureBrief);
    assert.ok(items.some(item => item.id === GLEN_PACKABLE_SHELL_ID));
    assert.ok(items.some(item => item.priceUsd > DAD_SCOTLAND_FIXTURE.budgetUsd));
    assert.ok(items.every(item => !item.size || item.size === fixtureBrief.size));
    assert.ok(
      items.every(item => fixtureBrief.features.every(feature => item.features.includes(feature))),
    );
  });

  it('ranks an under-budget waterproof packable jacket first', () => {
    const items = searchInventory(fixtureBrief);
    const shortlist = rankForTrip(items, DAD_SCOTLAND_FIXTURE);
    const lead = shortlist[0];
    assert.ok(lead);
    assert.equal(lead.id, GLEN_PACKABLE_SHELL_ID);
    assert.ok(lead.priceUsd <= DAD_SCOTLAND_FIXTURE.budgetUsd);
    assert.ok(lead.features.includes('waterproof'));
    assert.ok(lead.features.includes('packable'));
  });
});

describe('vault and merchant views', () => {
  it('keeps withheld facts in the vault and out of the merchant copy', () => {
    const items = searchInventory(fixtureBrief);
    const result = completeSearch(fixtureBrief, items, DAD_SCOTLAND_FIXTURE);
    assert.deepEqual(result.receipt, fixtureBrief);
    assert.equal('withheld' in result, false);
    const withheld = withheldFacts(DAD_SCOTLAND_FIXTURE);
    assert.equal(withheld.length, 10);
    assert.deepEqual(
      withheld.map(fact => fact.label),
      [
        'Recipient',
        'Relationship',
        'Destination',
        'Dates',
        'Weather',
        'Size',
        'Features',
        'Colors',
        'Budget',
        'Source',
      ],
    );
    const named = withheld.map(fact => `${fact.label} ${fact.value}`).join(' ');
    assert.match(named, /Dad/);
    assert.match(named, /Scotland/);
    assert.match(named, /October/);
    assert.match(named, /\$250/);
    const view = viewFromSearch(result, 'unavailable');
    assert.deepEqual(view.vault.withheld, withheld);
    assert.deepEqual(view.merchant.receipt, fixtureBrief);
    assert.deepEqual(privateMarkersInMerchantCopy(merchantViewCopy(view.merchant)), []);
  });

  it('keeps the guided demo usable without WebMCP or Arcade', () => {
    const result = completeSearch(
      fixtureBrief,
      searchInventory(fixtureBrief),
      DAD_SCOTLAND_FIXTURE,
    );
    const view = viewFromSearch(result, 'unavailable');
    assert.equal(view.arcadeConnected, false);
    assert.equal(view.webmcp, 'unavailable');
    assert.equal(view.merchant.shortlist[0]?.id, GLEN_PACKABLE_SHELL_ID);
    assert.deepEqual(
      Object.keys(view.merchant.receipt ?? {}).sort(),
      [...PUBLIC_BRIEF_FIELDS].sort(),
    );
  });
});

describe('rankItemsByBrief', () => {
  it('puts listings that honor size, features, and colors first without dropping the rest', () => {
    const base = { priceUsd: 50, imageUrl: '', merchantName: 'x', rating: null, url: 'u' };
    const items: CatalogItem[] = [
      { ...base, id: 'a', name: 'Black Puffer 1X Womens', features: [], colors: [] },
      {
        ...base,
        id: 'b',
        name: 'Navy Packable Rain Jacket XL',
        features: ['waterproof', 'packable'],
        colors: ['navy'],
      },
      { ...base, id: 'c', name: 'Olive Shell', features: ['waterproof'], colors: ['olive'] },
    ];
    const ranked = rankItemsByBrief(items, {
      category: 'jacket',
      size: 'XL',
      features: ['waterproof', 'packable'],
      colors: ['navy', 'olive'],
    });
    assert.deepEqual(
      ranked.map(item => item.id),
      ['b', 'c', 'a'],
    );
  });
});

describe('judge prompts', () => {
  it('keep every private fact and enum value out of the agent prompt', () => {
    for (const marker of ['Dad', 'Scotland', 'October', '250', 'XL', 'navy', 'olive']) {
      assert.equal(JUDGE_PROMPT.includes(marker), false, `${marker} must not be in the prompt`);
      assert.equal(
        JUDGE_PROMPT_LEAKY.includes(marker),
        false,
        `${marker} must not be in the prompt`,
      );
    }
    assert.match(JUDGE_PROMPT, /load_context/);
    assert.match(JUDGE_PROMPT, /search_products/);
    assert.match(JUDGE_PROMPT_LEAKY, /personalize_for_shopper/);
  });
});

describe('catalog and merchant contracts', () => {
  it('browses the full sample catalog without a brief', () => {
    assert.deepEqual(browseCatalog(), CATALOG);
    assert.equal(browseCatalog().length, 12);
  });

  it('returns at least two house-brand jackets for every size on the full brief', () => {
    for (const size of ['XS', 'S', 'M', 'L', 'XL'] as const) {
      const matches = searchInventory({
        category: 'jacket',
        size,
        features: ['waterproof', 'packable'],
        colors: ['navy', 'olive'],
      });
      assert.ok(matches.length >= 2, `${size} must return at least two jackets`);
    }
  });

  it('keeps the sample storefront brand-free and image-free', () => {
    for (const item of CATALOG) {
      for (const brand of ['REI', "Arc'teryx", 'Patagonia', 'Uniqlo']) {
        assert.equal(item.name.includes(brand), false, `${item.name} must not mention ${brand}`);
      }
      assert.equal(item.imageUrl, '');
      assert.equal(item.merchantName, 'Vitrine');
      assert.equal(item.url, '#pick');
      assert.ok(item.rating !== null && item.rating >= 4.2 && item.rating <= 4.8);
    }
  });

  it('records that Walmart accepts a price ceiling Vitrine never sends', () => {
    assert.ok(WALMART_ACCEPTS.includes('max_price'));
    assert.equal(WALMART_ACCEPTS[0], 'keywords');
  });

  it('carries the literal Arcade request through the search result', async () => {
    const brief = publicBriefFromFixture();
    const arcadeRequest: ArcadeRequest = {
      tool: 'Walmart.SearchProducts',
      input: { keywords: merchantQueryFromBrief(brief) },
    };
    const live = await handleMerchantSearch(brief, {
      searchLive: async () => ({
        items: searchInventory(brief),
        merchant: 'walmart',
        arcadeRequest,
        cached: true,
      }),
    });
    assert.equal(live.ok, true);
    if (!live.ok) return;
    assert.deepEqual(live.arcadeRequest, arcadeRequest);
    assert.equal(live.cached, true);

    const result = await runVitrineSearch(brief, {
      fetch: async () =>
        new Response(
          JSON.stringify({
            receipt: live.receipt,
            merchantQuery: live.merchantQuery,
            merchant: live.merchant,
            items: live.items,
            arcadeRequest: live.arcadeRequest,
            cached: live.cached,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    });
    assert.deepEqual(result.arcadeRequest, arcadeRequest);
    assert.equal(result.cached, true);
    assert.deepEqual(Object.keys(result.arcadeRequest?.input ?? {}), ['keywords']);

    const sample = await runVitrineSearch(brief, {
      fetch: async () =>
        new Response(
          JSON.stringify({
            receipt: brief,
            merchant: 'recorded_sample',
            items: searchInventory(brief),
            arcadeRequest: { tool: 'Gmail.SearchEmailsByQuery', input: { query: 'x' } },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    });
    assert.equal(sample.arcadeRequest, undefined);
    assert.equal('cached' in sample, false);
  });
});
