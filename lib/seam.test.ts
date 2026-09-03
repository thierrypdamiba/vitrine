import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { VaultState } from './arcade-types.ts';
import { seamCounts } from './seam.ts';
import { DAD_SCOTLAND_FIXTURE, publicBriefFromFixture } from './vitrine.ts';

const SEALED: VaultState = { status: 'sealed', context: null, via: null };
const LOADED: VaultState = { status: 'loaded', context: DAD_SCOTLAND_FIXTURE, via: 'fixture' };

describe('seamCounts', () => {
  it('reads 0 / 0 / 0 while the vault is sealed', () => {
    assert.deepEqual(seamCounts(SEALED, null, []), { agentKnows: 0, shopReceived: 0, leaked: 0 });
  });

  it('reads 9 / 4 / 0 after the fixture loads and the adapter accepts a brief', () => {
    assert.deepEqual(seamCounts(LOADED, publicBriefFromFixture(), []), {
      agentKnows: 9,
      shopReceived: 4,
      leaked: 0,
    });
  });

  it('counts a calendar row as a tenth fact', () => {
    const withCalendar: VaultState = {
      ...LOADED,
      context: { ...DAD_SCOTLAND_FIXTURE, calendarSummary: 'Scotland trip with Dad' },
    };
    assert.equal(seamCounts(withCalendar, null, []).agentKnows, 10);
  });

  it('counts leak rows separately from the strict receipt', () => {
    const rows = Array.from({ length: 9 }, (_, index) => ({ key: `k${index}`, value: 'v' }));
    assert.deepEqual(seamCounts(LOADED, publicBriefFromFixture(), rows), {
      agentKnows: 9,
      shopReceived: 4,
      leaked: 9,
    });
  });
});
