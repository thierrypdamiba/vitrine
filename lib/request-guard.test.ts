import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  clearMemo,
  isRateLimited,
  isSameOriginRequest,
  MAX_PER_WINDOW,
  memo,
  trackedClientKeys,
} from './request-guard.ts';

describe('vault request guard', () => {
  it('accepts same-origin fetches and rejects cross-site or headerless callers', () => {
    const url = 'https://vitrine.example/api/arcade/context';
    const withHeaders = (headers: Record<string, string>) => new Request(url, { headers });
    assert.equal(isSameOriginRequest(withHeaders({ 'sec-fetch-site': 'same-origin' })), true);
    assert.equal(isSameOriginRequest(withHeaders({ 'sec-fetch-site': 'cross-site' })), false);
    assert.equal(isSameOriginRequest(withHeaders({ origin: 'https://vitrine.example' })), true);
    assert.equal(isSameOriginRequest(withHeaders({ origin: 'https://evil.example' })), false);
    assert.equal(isSameOriginRequest(new Request(url)), false);
  });

  it('throttles a caller after sixty requests in a minute', () => {
    assert.equal(MAX_PER_WINDOW, 60);
    const start = 1_000_000;
    for (let i = 0; i < 60; i += 1) assert.equal(isRateLimited('judge', start + i), false);
    assert.equal(isRateLimited('judge', start + 61), true);
    assert.equal(isRateLimited('judge', start + 61_000), false);
  });

  it('forgets a caller whose window has emptied', () => {
    const start = 2_000_000;
    isRateLimited('one-off', start);
    assert.ok(trackedClientKeys().includes('one-off'));
    isRateLimited('other', start + 61_000);
    assert.equal(trackedClientKeys().includes('one-off'), false);
    assert.ok(trackedClientKeys().includes('other'));
  });
});

describe('memo', () => {
  beforeEach(() => clearMemo());

  it('does not invoke fn again within the ttl', async () => {
    let calls = 0;
    const load = () => {
      calls += 1;
      return Promise.resolve({ calls });
    };
    assert.deepEqual(await memo('key', 60_000, load), { calls: 1 });
    assert.deepEqual(await memo('key', 60_000, load), { calls: 1 });
    assert.equal(calls, 1);
  });

  it('evicts a rejected promise so the next call retries', async () => {
    let calls = 0;
    const load = () => {
      calls += 1;
      return calls === 1 ? Promise.reject(new Error('down')) : Promise.resolve('up');
    };
    await assert.rejects(() => memo('flaky', 60_000, load), /down/);
    assert.equal(await memo('flaky', 60_000, load), 'up');
    assert.equal(calls, 2);
  });
});
