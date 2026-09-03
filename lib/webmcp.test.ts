import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CATALOG_SEARCH_TOOL_NAME,
  buildVitrineTools,
  catalogSearchToolDefinition,
  compactCatalogToolOutput,
  createToolRegistry,
  privateFieldsInSchema,
  registerVitrineTools,
  type ModelContext,
  type ModelContextTool,
} from './webmcp.ts';
import {
  DAD_SCOTLAND_FIXTURE,
  PRIVATE_FIELD_NAMES,
  PUBLIC_BRIEF_FIELDS,
  completeSearch,
  publicBriefFromFixture,
  searchInventory,
} from './vitrine.ts';
import { LEAKY_TOOL_NAME } from './session.ts';

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

  it('registers load_context at browse when loadContext is passed', async () => {
    const context = fakeModelContext();
    await registerVitrineTools(context, {
      signal: new AbortController().signal,
      stage: 'browse',
      loadContext: async () => DAD_SCOTLAND_FIXTURE,
      search: async () => completeSearch(publicBriefFromFixture(), [], DAD_SCOTLAND_FIXTURE),
    });
    assert.deepEqual(
      context.registered.map(tool => tool.name),
      ['load_context', 'search_products'],
    );
    const loadContext = context.registered.find(entry => entry.name === 'load_context');
    assert.ok(loadContext);
    const output = JSON.parse(await loadContext.execute({})) as Record<string, unknown>;
    assert.equal(output.recipient, 'Dad');
    assert.equal('query' in output, false);
  });

  it('skips load_context when no loader is wired', async () => {
    const context = fakeModelContext();
    await registerVitrineTools(context, {
      signal: new AbortController().signal,
      stage: 'browse',
      search: async () => completeSearch(publicBriefFromFixture(), [], DAD_SCOTLAND_FIXTURE),
    });
    assert.deepEqual(
      context.registered.map(tool => tool.name),
      ['search_products'],
    );
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

  it('answers early compare and prepare calls with an error and a hint', async () => {
    const tools = buildVitrineTools('compared', {
      currentItems: () => [],
      comparedIds: () => [],
    });
    const compare = tools.find(entry => entry.name === 'compare_products');
    const prepare = tools.find(entry => entry.name === 'prepare_selection');
    assert.ok(compare);
    assert.ok(prepare);
    const compared = JSON.parse(await compare.execute({ ids: ['a', 'b'] })) as Record<
      string,
      string
    >;
    assert.deepEqual(Object.keys(compared), ['error', 'hint']);
    const prepared = JSON.parse(await prepare.execute({ id: 'a' })) as Record<string, string>;
    assert.deepEqual(Object.keys(prepared), ['error', 'hint']);
  });
});

describe('createToolRegistry', () => {
  const definition = (name: string): ModelContextTool => ({
    name,
    description: name,
    inputSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute: () => '{}',
  });

  it('registers each name once and accumulates across stages', async () => {
    const context = fakeModelContext();
    const changes: string[][] = [];
    const registry = createToolRegistry(context, {
      signal: new AbortController().signal,
      onChange: names => changes.push(names),
    });
    await registry.sync([definition('load_context'), definition('search_products')]);
    await registry.sync([definition('load_context'), definition('search_products')]);
    await registry.sync([
      definition('load_context'),
      definition('search_products'),
      definition('compare_products'),
    ]);
    await registry.sync([definition('search_products')]);
    assert.deepEqual(
      context.registered.map(tool => tool.name),
      ['load_context', 'search_products', 'compare_products'],
    );
    assert.deepEqual(registry.names(), ['load_context', 'search_products', 'compare_products']);
    assert.equal(changes.length, 2);
  });

  it('treats InvalidStateError as held and reports other errors', async () => {
    const errors: string[] = [];
    const context: ModelContext = {
      async registerTool(tool) {
        if (tool.name === 'search_products') {
          throw new DOMException('already registered', 'InvalidStateError');
        }
        if (tool.name === 'compare_products') throw new Error('boom');
      },
    };
    const registry = createToolRegistry(context, {
      signal: new AbortController().signal,
      onError: name => errors.push(name),
    });
    await registry.sync([
      definition('search_products'),
      definition('compare_products'),
      definition('prepare_selection'),
    ]);
    assert.deepEqual(registry.names(), ['search_products', 'prepare_selection']);
    assert.deepEqual(errors, ['search_products', 'compare_products']);
  });

  it('aborts only the leaky demo tool when it leaves the desired set', async () => {
    const signals = new Map<string, AbortSignal>();
    const context: ModelContext = {
      registerTool(tool, options) {
        signals.set(tool.name, options.signal);
      },
    };
    const registry = createToolRegistry(context, { signal: new AbortController().signal });
    await registry.sync([definition('search_products'), definition(LEAKY_TOOL_NAME)]);
    await registry.sync([definition('search_products')]);
    assert.equal(signals.get(LEAKY_TOOL_NAME)?.aborted, true);
    assert.equal(signals.get('search_products')?.aborted, false);
    assert.deepEqual(registry.names(), ['search_products']);
  });

  it('aborts everything when the page signal aborts', async () => {
    const signals: AbortSignal[] = [];
    const context: ModelContext = {
      registerTool(_tool, options) {
        signals.push(options.signal);
      },
    };
    const controller = new AbortController();
    const registry = createToolRegistry(context, { signal: controller.signal });
    await registry.sync([definition('load_context'), definition('search_products')]);
    controller.abort();
    assert.ok(signals.every(signal => signal.aborted));
    assert.deepEqual(registry.names(), []);
  });
});
