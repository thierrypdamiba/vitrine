import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  fetchArcadeStatus,
  loadVault,
  parsePrivateContext,
  probeMerchantRejection,
} from './vault.ts';
import { DAD_SCOTLAND_FIXTURE, publicBriefFromFixture } from './vitrine.ts';

const ARCADE_CONTEXT = {
  recipient: 'Dad',
  relationship: 'father',
  destination: 'Scotland',
  dates: 'October',
  weather: 'rainy',
  size: 'XL',
  features: ['waterproof', 'packable'],
  colors: ['navy', 'olive'],
  budgetUsd: 250,
  source: 'arcade',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('loadVault', () => {
  it('returns the Arcade context on 200', async () => {
    const calls: Array<{ url: string; method?: string }> = [];
    const loaded = await loadVault(async (url, init) => {
      calls.push({ url: String(url), method: init?.method });
      return json({ context: ARCADE_CONTEXT });
    });
    assert.equal(loaded.via, 'arcade');
    assert.equal(loaded.reason, undefined);
    assert.equal(loaded.context.recipient, 'Dad');
    assert.equal(loaded.context.source, 'arcade');
    assert.deepEqual(calls, [{ url: '/api/arcade/context', method: 'POST' }]);
  });

  it('falls back to the fixture with the server reason on 401', async () => {
    const loaded = await loadVault(async () =>
      json({ error: 'Gmail is not authorized on this server.' }, 401),
    );
    assert.equal(loaded.via, 'fixture');
    assert.equal(loaded.reason, 'Gmail is not authorized on this server.');
    assert.deepEqual(loaded.context, DAD_SCOTLAND_FIXTURE);
  });

  it('falls back to the fixture on a malformed 200', async () => {
    const loaded = await loadVault(async () =>
      json({ context: { ...ARCADE_CONTEXT, budgetUsd: 'lots' } }),
    );
    assert.equal(loaded.via, 'fixture');
    assert.ok(loaded.reason);
  });

  it('falls back to the fixture when the network throws', async () => {
    const loaded = await loadVault(async () => {
      throw new TypeError('Failed to fetch');
    });
    assert.equal(loaded.via, 'fixture');
    assert.equal(loaded.reason, 'Arcade not configured');
  });
});

describe('parsePrivateContext', () => {
  it('keeps an optional calendar summary and rejects oversized text', () => {
    const withCalendar = parsePrivateContext({
      ...ARCADE_CONTEXT,
      calendarSummary: 'Scotland trip with Dad · Edinburgh',
    });
    assert.equal(withCalendar?.calendarSummary, 'Scotland trip with Dad · Edinburgh');
    assert.equal(parsePrivateContext({ ...ARCADE_CONTEXT, destination: 'x'.repeat(81) }), null);
    assert.equal(parsePrivateContext({ ...ARCADE_CONTEXT, size: 'XXL' }), null);
    assert.equal(parsePrivateContext({ ...ARCADE_CONTEXT, budgetUsd: 0 }), null);
    assert.equal(parsePrivateContext(null), null);
  });
});

describe('fetchArcadeStatus', () => {
  it('returns the four booleans and never anything else', async () => {
    const status = await fetchArcadeStatus(async () =>
      json({ configured: true, gmailRead: true, calendar: false, shopping: true, extra: 'x' }),
    );
    assert.deepEqual(status, {
      configured: true,
      gmailRead: true,
      calendar: false,
      shopping: true,
    });
  });

  it('returns all false when the route fails', async () => {
    const status = await fetchArcadeStatus(async () => {
      throw new Error('offline');
    });
    assert.deepEqual(status, {
      configured: false,
      gmailRead: false,
      calendar: false,
      shopping: false,
    });
  });
});

describe('probeMerchantRejection', () => {
  it('sends the private fields on purpose and reports the 400', async () => {
    let received: unknown;
    const probe = await probeMerchantRejection(
      publicBriefFromFixture(),
      DAD_SCOTLAND_FIXTURE,
      async (_url, init) => {
        received = JSON.parse(String(init?.body));
        return json({ error: 'Merchant rejected unexpected fields: destination, budgetUsd' }, 400);
      },
    );
    assert.equal(probe.status, 400);
    assert.deepEqual(Object.keys(received as object), [
      'category',
      'size',
      'features',
      'colors',
      'destination',
      'budgetUsd',
    ]);
    assert.match(probe.sent, /"destination":"Scotland"/);
    assert.match(probe.sent, /"budgetUsd":250/);
    assert.match(probe.body, /destination, budgetUsd/);
    assert.ok(probe.body.length <= 300);
  });

  it('uses the fixture values while the vault is sealed', async () => {
    const probe = await probeMerchantRejection(publicBriefFromFixture(), null, async () =>
      json({ error: 'x' }, 400),
    );
    assert.match(probe.sent, /"destination":"Scotland"/);
  });
});
