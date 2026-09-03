import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DAD_SCOTLAND_FIXTURE,
  GLEN_PACKABLE_SHELL_ID,
  PRIVATE_FIELD_NAMES,
  PUBLIC_BRIEF_FIELDS,
  completeSearch,
  merchantQueryFromBrief,
  merchantViewCopy,
  parsePublicBrief,
  privateMarkersInMerchantCopy,
  publicBriefFromFixture,
  rankForTrip,
  searchInventory,
  viewFromSearch,
  withheldFacts,
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
