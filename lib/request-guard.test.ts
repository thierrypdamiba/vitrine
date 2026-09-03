import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isRateLimited, isSameOriginRequest } from './request-guard.ts';

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

  it('throttles a caller after twenty requests in a minute', () => {
    const start = 1_000_000;
    for (let i = 0; i < 20; i += 1) assert.equal(isRateLimited('judge', start + i), false);
    assert.equal(isRateLimited('judge', start + 21), true);
    assert.equal(isRateLimited('judge', start + 61_000), false);
  });
});
