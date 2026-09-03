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

describe('shopping module boundary', () => {
  it('does not import Gmail or Calendar loaders', () => {
    const source = readFileSync(new URL('./shopping.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('Gmail'), false);
    assert.equal(source.includes('GoogleCalendar'), false);
    assert.equal(source.includes('loadPrivateContextFromArcade'), false);
  });
});
