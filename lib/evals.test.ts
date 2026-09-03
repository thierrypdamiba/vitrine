import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { PUBLIC_BRIEF_FIELDS } from './vitrine.ts';

describe('WebMCP evals', () => {
  it('expects search_products to receive only the public brief', () => {
    const evalCase = JSON.parse(
      readFileSync(new URL('../evals/private-shopping.json', import.meta.url), 'utf8'),
    ) as {
      expectedCall: Array<{ functionName: string; arguments: Record<string, unknown> }>;
    };
    const search = evalCase.expectedCall.find(call => call.functionName === 'search_products');
    assert.ok(search);
    assert.deepEqual(Object.keys(search.arguments).sort(), [...PUBLIC_BRIEF_FIELDS].sort());
    const blob = JSON.stringify(search.arguments);
    assert.equal(blob.includes('Dad'), false);
    assert.equal(blob.includes('Scotland'), false);
    assert.equal(blob.includes('250'), false);
  });
});
