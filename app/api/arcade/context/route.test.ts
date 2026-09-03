import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { handleArcadeContext, type ArcadeRouteDeps } from '../../../../lib/arcade-routes.ts';
import { clearMemo } from '../../../../lib/request-guard.ts';
import { POST } from './route.ts';

const AUTH_URL = 'https://accounts.google.com/x';
const CONFIG = { apiKey: 'secret', userId: 'demo-mailbox', contextQuery: 'subject:vitrine' };

const contextRecord = `Recipient: Dad
Relationship: father
Destination: Scotland
Dates: October
Weather: rainy
Size: XL
Features: waterproof, packable
Colors: navy, olive
BudgetUsd: 250`;

function fakeTools(connected: boolean) {
  const calls: string[] = [];
  return {
    calls,
    tools: {
      async get() {
        calls.push('get');
        return {
          requirements: {
            met: connected,
            authorization: { token_status: connected ? 'completed' : 'pending' },
          },
        };
      },
      async authorize() {
        calls.push('authorize');
        return { status: 'pending', url: AUTH_URL };
      },
      async execute(request: { tool_name: string }) {
        calls.push(`execute:${request.tool_name}`);
        if (request.tool_name !== 'Gmail.SearchEmailsByQuery') return { success: false };
        return { success: true, output: { value: { emails: [{ body: contextRecord }] } } };
      },
    },
  };
}

function deps(connected: boolean): ArcadeRouteDeps & { calls: string[] } {
  const fake = fakeTools(connected);
  return {
    calls: fake.calls,
    readConfig: () => CONFIG,
    createTools: () => fake.tools as never,
  };
}

function sameOriginPost(): Request {
  return new Request('http://vitrine.test/api/arcade/context', {
    method: 'POST',
    headers: { 'sec-fetch-site': 'same-origin' },
  });
}

describe('POST /api/arcade/context', () => {
  beforeEach(() => clearMemo());

  it('refuses callers that are not the page', async () => {
    const response = await POST(new Request('http://vitrine.test/api/arcade/context'));
    assert.equal(response.status, 403);
  });

  it('answers an unauthorized mailbox with a plain 401 and never a URL', async () => {
    const injected = deps(false);
    const response = await handleArcadeContext(sameOriginPost(), injected);
    assert.equal(response.status, 401);
    const raw = await response.text();
    assert.deepEqual(JSON.parse(raw), { error: 'Gmail is not authorized on this server.' });
    assert.equal(raw.includes('http'), false);
    assert.equal(raw.includes('authorizationUrl'), false);
    assert.equal(injected.calls.includes('authorize'), false);
  });

  it('returns the parsed context and memoizes it for later callers', async () => {
    const injected = deps(true);
    const first = await handleArcadeContext(sameOriginPost(), injected);
    assert.equal(first.status, 200);
    const payload = (await first.json()) as { context: Record<string, unknown> };
    assert.equal(payload.context.destination, 'Scotland');
    assert.equal(payload.context.source, 'arcade');

    const gmailCalls = () => injected.calls.filter(c => c.startsWith('execute:Gmail')).length;
    assert.equal(gmailCalls(), 1);
    const second = await handleArcadeContext(sameOriginPost(), injected);
    assert.equal(second.status, 200);
    assert.equal(gmailCalls(), 1);
  });

  it('reports a missing configuration as 503 without touching Arcade', async () => {
    const response = await handleArcadeContext(sameOriginPost(), {
      readConfig: () => null,
      createTools: () => assert.fail('createTools must not be called') as never,
    });
    assert.equal(response.status, 503);
  });
});
