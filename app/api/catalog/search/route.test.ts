import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import {
  PUBLIC_BRIEF_FIELDS,
  merchantQueryFromBrief,
  publicBriefFromFixture,
} from '../../../../lib/vitrine.ts';
import { POST } from './route.ts';

before(() => {
  process.env.ARCADE_API_KEY = '';
  process.env.ARCADE_USER_ID = '';
});

async function postCatalog(body: unknown) {
  return POST(
    new Request('http://vitrine.test/api/catalog/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/catalog/search', () => {
  it('returns the accepted public brief as the merchant receipt', async () => {
    const brief = publicBriefFromFixture();
    const response = await postCatalog(brief);
    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      receipt: Record<string, unknown>;
      items: unknown[];
      merchantQuery?: string;
      merchant?: string;
    };
    assert.deepEqual(Object.keys(payload.receipt).sort(), [...PUBLIC_BRIEF_FIELDS].sort());
    assert.deepEqual(payload.receipt, brief);
    assert.equal(payload.merchantQuery, merchantQueryFromBrief(brief));
    assert.equal(payload.merchantQuery?.includes('Scotland'), false);
    assert.ok(Array.isArray(payload.items));
    assert.ok(payload.items.length > 0);
    assert.equal('destination' in payload.receipt, false);
    assert.equal('budgetUsd' in payload.receipt, false);
    assert.equal(payload.merchant, 'recorded_sample');
    assert.equal('arcadeRequest' in payload, false);
    assert.equal('cached' in payload, false);
    assert.equal(JSON.stringify(payload).includes('budget'), false);
  });

  it('rejects destination and budget together, naming both fields in order', async () => {
    const response = await postCatalog({
      ...publicBriefFromFixture(),
      destination: 'Scotland',
      budgetUsd: 250,
    });
    assert.equal(response.status, 400);
    const payload = (await response.json()) as { error: string };
    assert.equal(payload.error, 'Merchant rejected unexpected fields: destination, budgetUsd');
  });

  it('rejects a private destination without searching inventory', async () => {
    const response = await postCatalog({
      ...publicBriefFromFixture(),
      destination: 'Scotland',
    });
    assert.equal(response.status, 400);
    const payload = (await response.json()) as { error: string; items?: unknown };
    assert.match(payload.error, /destination/i);
    assert.equal(payload.items, undefined);
  });
});
