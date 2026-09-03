import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { handleArcadeStatus, type ArcadeRouteDeps } from '../../../../lib/arcade-routes.ts';
import { clearMemo } from '../../../../lib/request-guard.ts';
import { GET } from './route.ts';

const STATUS_KEYS = ['configured', 'gmailRead', 'calendar', 'shopping'];
const CONFIG = { apiKey: 'secret', userId: 'demo-mailbox', contextQuery: 'subject:vitrine' };

function sameOriginGet(): Request {
  return new Request('http://vitrine.test/api/arcade/status', {
    headers: { 'sec-fetch-site': 'same-origin' },
  });
}

function withTools(get: (name: string) => Promise<unknown>): ArcadeRouteDeps {
  return {
    readConfig: () => CONFIG,
    createTools: () => ({ get, execute: async () => ({}) }) as never,
  };
}

describe('GET /api/arcade/status', () => {
  beforeEach(() => clearMemo());

  it('refuses callers that are not the page', async () => {
    const response = await GET(new Request('http://vitrine.test/api/arcade/status'));
    assert.equal(response.status, 403);
  });

  it('returns exactly four booleans when Arcade is not configured', async () => {
    const response = await handleArcadeStatus(sameOriginGet(), {
      readConfig: () => null,
      createTools: () => assert.fail('createTools must not be called') as never,
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as Record<string, unknown>;
    assert.deepEqual(Object.keys(body), STATUS_KEYS);
    assert.deepEqual(body, {
      configured: false,
      gmailRead: false,
      calendar: false,
      shopping: false,
    });
  });

  it('returns exactly four booleans and no token text or URL when configured', async () => {
    const response = await handleArcadeStatus(
      sameOriginGet(),
      withTools(async name => ({
        requirements: {
          met: true,
          authorization:
            name === 'Walmart.SearchProducts'
              ? undefined
              : { token_status: 'completed', url: 'https://accounts.google.com/x' },
        },
      })),
    );
    assert.equal(response.status, 200);
    const raw = await response.text();
    const body = JSON.parse(raw) as Record<string, unknown>;
    assert.deepEqual(Object.keys(body), STATUS_KEYS);
    assert.deepEqual(body, { configured: true, gmailRead: true, calendar: true, shopping: true });
    assert.equal(raw.includes('http'), false);
    assert.equal(raw.includes('token'), false);
  });

  it('returns the four keys, all false but configured, when Arcade is unreachable', async () => {
    const response = await handleArcadeStatus(
      sameOriginGet(),
      withTools(() => {
        throw new Error('network down');
      }),
    );
    assert.equal(response.status, 502);
    const body = (await response.json()) as Record<string, unknown>;
    assert.deepEqual(Object.keys(body), STATUS_KEYS);
    assert.deepEqual(body, {
      configured: true,
      gmailRead: false,
      calendar: false,
      shopping: false,
    });
  });
});
