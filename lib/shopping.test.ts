import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { parseShoppingProducts } from './shopping.ts';

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

describe('shopping module boundary', () => {
  it('does not import Gmail or Calendar loaders', () => {
    const source = readFileSync(new URL('./shopping.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('Gmail'), false);
    assert.equal(source.includes('GoogleCalendar'), false);
    assert.equal(source.includes('loadPrivateContextFromArcade'), false);
  });
});
