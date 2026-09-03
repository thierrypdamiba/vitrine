import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CATALOG_SEARCH_TOOL_NAME,
  catalogSearchToolDefinition,
  compactCatalogToolOutput,
  privateFieldsInSchema,
  registerVitrineTools,
  type ModelContext,
} from './webmcp.ts';
import {
  DAD_SCOTLAND_FIXTURE,
  PRIVATE_FIELD_NAMES,
  PUBLIC_BRIEF_FIELDS,
  completeSearch,
  publicBriefFromFixture,
  searchInventory,
} from './vitrine.ts';
import { consentNeededMessage } from './session.ts';

function fakeModelContext(): ModelContext & {
  registered: Array<{ name: string; execute: (input: unknown) => Promise<string> | string }>;
} {
  const registered: Array<{ name: string; execute: (input: unknown) => Promise<string> | string }> =
    [];
  return {
    registered,
    async registerTool(tool) {
      registered.push(tool);
    },
  };
}

describe('search_products schema', () => {
  it('excludes every private-context field', () => {
    const tool = catalogSearchToolDefinition(async () => 'ok');
    assert.equal(tool.name, CATALOG_SEARCH_TOOL_NAME);
    assert.equal(tool.name, 'search_products');
    assert.equal(tool.name.length <= 30, true);
    assert.ok(tool.description.length <= 500);
    const leaked = privateFieldsInSchema(tool.inputSchema);
    assert.deepEqual(leaked, []);
    const propertyNames = Object.keys(tool.inputSchema.properties);
    assert.deepEqual(propertyNames.sort(), [...PUBLIC_BRIEF_FIELDS].sort());
    assert.equal(tool.inputSchema.additionalProperties, false);
    for (const field of PRIVATE_FIELD_NAMES) {
      assert.equal(propertyNames.includes(field), false);
    }
  });
});

describe('registerVitrineTools', () => {
  it('registers the catalog tool and shares results with the page command', async () => {
    const context = fakeModelContext();
    const seen: unknown[] = [];
    const brief = publicBriefFromFixture();
    const expected = completeSearch(brief, searchInventory(brief), DAD_SCOTLAND_FIXTURE);

    await registerVitrineTools(context, {
      signal: new AbortController().signal,
      onResult: result => {
        seen.push(result);
      },
      search: async () => expected,
    });

    const tool = context.registered.find(entry => entry.name === 'search_products');
    assert.ok(tool);
    const output = await tool.execute(brief);
    assert.deepEqual(seen, [expected]);
    assert.equal(output, compactCatalogToolOutput(expected));
    assert.ok(output.length <= 1500);
    const parsed = JSON.parse(output) as { receipt: unknown };
    assert.deepEqual(parsed.receipt, expected.receipt);
    assert.equal(JSON.parse(output).receipt.destination, undefined);
  });

  it('refuses search_products until the shopper shares the brief', async () => {
    const context = fakeModelContext();
    await registerVitrineTools(context, {
      signal: new AbortController().signal,
      isApproved: () => false,
      search: async () => {
        throw new Error('search should not run');
      },
      onResult: () => undefined,
    });
    const tool = context.registered.find(entry => entry.name === 'search_products');
    assert.ok(tool);
    const output = JSON.parse(await tool.execute(publicBriefFromFixture())) as { error: string };
    assert.equal(output.error, consentNeededMessage());
  });

  it('registers compare and prepare only after search', async () => {
    const context = fakeModelContext();
    await registerVitrineTools(context, {
      signal: new AbortController().signal,
      stage: 'results',
      search: async () => completeSearch(publicBriefFromFixture(), [], DAD_SCOTLAND_FIXTURE),
      onResult: () => undefined,
      onCompare: () => undefined,
      currentItems: () => searchInventory(publicBriefFromFixture()),
    });
    assert.deepEqual(
      context.registered.map(tool => tool.name),
      ['search_products', 'compare_products'],
    );
  });
});
