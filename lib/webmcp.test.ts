import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CATALOG_SEARCH_INPUT_SCHEMA,
  CATALOG_SEARCH_TOOL_NAME,
  MAX_TOOL_OUTPUT_CHARS,
  boundedToolOutput,
  buildVitrineTools,
  catalogSearchToolDefinition,
  compactCatalogToolOutput,
  createToolRegistry,
  detectModelContext,
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
  type CatalogItem,
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

function liveShapedResult(count: number) {
  const brief = publicBriefFromFixture();
  const items: CatalogItem[] = Array.from({ length: count }, (_, index) => ({
    id: `walmart-${1000000000 + index}`,
    name: `${'Men’s XL Waterproof Packable Navy Rain Shell Jacket with Hood '.repeat(2)}`.slice(
      0,
      90,
    ),
    priceUsd: 129.99 + index,
    imageUrl: '',
    merchantName: 'Walmart via Arcade',
    rating: 4.4,
    url: `https://www.walmart.com/ip/${1000000000 + index}`,
    features: ['waterproof', 'packable'],
    colors: ['navy'],
    size: 'XL',
  }));
  return completeSearch(brief, items, DAD_SCOTLAND_FIXTURE, {
    merchant: 'walmart',
    arcadeRequest: {
      tool: 'Walmart.SearchProducts',
      input: { keywords: 'XL waterproof packable navy olive jacket' },
    },
    cached: false,
  });
}

const fullHandlers = {
  loadContext: async () => DAD_SCOTLAND_FIXTURE,
  currentItems: () => searchInventory(publicBriefFromFixture()),
  comparedIds: () => searchInventory(publicBriefFromFixture()).map(item => item.id),
  search: async () => completeSearch(publicBriefFromFixture(), [], DAD_SCOTLAND_FIXTURE),
};

describe('search_products schema', () => {
  it('excludes every private-context field', () => {
    const tool = catalogSearchToolDefinition(async () => 'ok');
    assert.equal(tool.name, CATALOG_SEARCH_TOOL_NAME);
    assert.equal(tool.name, 'search_products');
    assert.equal(tool.name.length <= 30, true);
    assert.ok(tool.description.length <= 500);
    const leaked = privateFieldsInSchema(tool.inputSchema);
    assert.deepEqual(leaked, []);
    assert.deepEqual(privateFieldsInSchema(CATALOG_SEARCH_INPUT_SCHEMA), []);
    const propertyNames = Object.keys(tool.inputSchema.properties);
    assert.deepEqual(propertyNames.sort(), [...PUBLIC_BRIEF_FIELDS].sort());
    assert.equal(tool.inputSchema.additionalProperties, false);
    for (const field of PRIVATE_FIELD_NAMES) {
      assert.equal(propertyNames.includes(field), false);
    }
  });
});

describe('tool table', () => {
  const tools = buildVitrineTools('compared', fullHandlers);
  const byName = (name: string) => {
    const found = tools.find(entry => entry.name === name);
    assert.ok(found, `${name} is registered at compared`);
    return found;
  };

  it('gives every tool a title and bounded text', () => {
    assert.deepEqual(
      tools.map(entry => entry.name),
      ['load_context', 'search_products', 'compare_products', 'prepare_selection'],
    );
    for (const entry of tools) {
      assert.ok(entry.name.length <= 30, `${entry.name} name`);
      assert.ok(entry.title && entry.title.length <= 60, `${entry.name} title`);
      assert.ok(entry.description.length <= 500, `${entry.name} description`);
      for (const [key, property] of Object.entries(entry.inputSchema.properties)) {
        assert.ok(property.description.length <= 150, `${entry.name}.${key} description`);
      }
    }
  });

  it('pins both annotation decisions per tool', () => {
    assert.deepEqual(byName('load_context').annotations, {
      readOnlyHint: true,
      untrustedContentHint: true,
    });
    assert.deepEqual(byName('search_products').annotations, {
      readOnlyHint: true,
      untrustedContentHint: true,
    });
    assert.deepEqual(byName('compare_products').annotations, {
      readOnlyHint: false,
      untrustedContentHint: true,
    });
    assert.deepEqual(byName('prepare_selection').annotations, {
      readOnlyHint: false,
      untrustedContentHint: true,
    });
  });

  it('load_context reports its source and never a query', async () => {
    const output = JSON.parse(await byName('load_context').execute({})) as Record<string, unknown>;
    assert.equal(output.source, 'fixture');
    assert.equal(output.arcadeTool, null);
    assert.equal(output.calendarSummary, null);
    assert.equal('query' in output, false);
    assert.equal(output.recipient, 'Dad');
  });

  it('load_context names the Arcade tool when the vault came from Gmail', async () => {
    const [loadContext] = buildVitrineTools('browse', {
      loadContext: async () => ({
        ...DAD_SCOTLAND_FIXTURE,
        source: 'arcade',
        calendarSummary: 'Scotland trip with Dad · Edinburgh · 2026-10-10',
      }),
    });
    const output = JSON.parse(await loadContext.execute({})) as Record<string, unknown>;
    assert.equal(output.source, 'arcade');
    assert.equal(output.arcadeTool, 'Gmail.SearchEmailsByQuery');
    assert.equal(output.calendarSummary, 'Scotland trip with Dad · Edinburgh · 2026-10-10');
  });

  it('prepare_selection leaves opening to the shopper', async () => {
    const [first] = searchInventory(publicBriefFromFixture());
    const output = JSON.parse(await byName('prepare_selection').execute({ id: first.id })) as {
      prepared: { id: string };
      openedBy: string;
    };
    assert.equal(output.prepared.id, first.id);
    assert.equal(output.openedBy, 'shopper');
  });
});

describe('tool errors', () => {
  it('rejects extra search fields with a hint and reports the rejection', async () => {
    const rejected: Array<{ input: unknown; error: string }> = [];
    const [search] = buildVitrineTools('browse', {
      search: async () => {
        throw new Error('must not run');
      },
      onRejected: (input, error) => rejected.push({ input, error }),
    });
    const input = { ...publicBriefFromFixture(), destination: 'Scotland', budgetUsd: 250 };
    const output = JSON.parse(await search.execute(input)) as Record<string, string>;
    assert.deepEqual(Object.keys(output), ['error', 'hint']);
    assert.equal(output.error, 'Merchant rejected unexpected fields: destination, budgetUsd');
    assert.equal(output.hint, 'search_products accepts only category, size, features, colors.');
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].error, output.error);
  });

  it('never echoes upstream error text', async () => {
    const [search] = buildVitrineTools('browse', {
      search: async () => {
        throw new Error('ECONNREFUSED 127.0.0.1:3001 secret-upstream-detail');
      },
    });
    const output = JSON.parse(await search.execute(publicBriefFromFixture())) as Record<
      string,
      string
    >;
    assert.deepEqual(output, {
      error: 'Catalog search failed.',
      hint: 'Retry search_products with the same four fields.',
    });
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

  it('answers bad ids with an error and a hint', async () => {
    const tools = buildVitrineTools('compared', fullHandlers);
    const compare = tools.find(entry => entry.name === 'compare_products');
    const prepare = tools.find(entry => entry.name === 'prepare_selection');
    assert.ok(compare);
    assert.ok(prepare);
    const compared = JSON.parse(await compare.execute({ ids: ['nope'] })) as Record<string, string>;
    assert.deepEqual(Object.keys(compared), ['error', 'hint']);
    const prepared = JSON.parse(await prepare.execute({})) as Record<string, string>;
    assert.deepEqual(Object.keys(prepared), ['error', 'hint']);
  });
});

describe('output budget', () => {
  it('keeps an 8-item live-shaped result under the budget with the receipt and ids', () => {
    const result = liveShapedResult(8);
    const output = compactCatalogToolOutput(result);
    assert.ok(output.length <= MAX_TOOL_OUTPUT_CHARS, `${output.length} chars`);
    assert.ok(output.length <= 1500);
    const parsed = JSON.parse(output) as {
      receipt: unknown;
      shortlist: Array<{ id: string }>;
      arcadeRequest: { tool: string; keywords: string };
    };
    assert.deepEqual(parsed.receipt, result.receipt);
    assert.ok(parsed.shortlist.length >= 3);
    assert.deepEqual(parsed.arcadeRequest, {
      tool: 'Walmart.SearchProducts',
      keywords: 'XL waterproof packable navy olive jacket',
    });
    assert.equal(output.includes('Scotland'), false);
  });

  it('marks truncation only when entries were dropped', () => {
    const small = boundedToolOutput({ shortlist: [{ id: 'a' }] });
    assert.equal(JSON.parse(small).truncated, undefined);
    const big = boundedToolOutput({
      shortlist: Array.from({ length: 200 }, (_, i) => ({ id: i })),
    });
    assert.ok(big.length <= MAX_TOOL_OUTPUT_CHARS);
    assert.equal(JSON.parse(big).truncated, true);
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
    assert.equal(output.source, 'fixture');
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
});

describe('detectModelContext', () => {
  const modelContext: ModelContext = { registerTool() {} };

  it('prefers document.modelContext and falls back to navigator', () => {
    const other: ModelContext = { registerTool() {} };
    assert.equal(detectModelContext({ modelContext }, { modelContext: other }), modelContext);
    assert.equal(detectModelContext({}, { modelContext: other }), other);
    assert.equal(detectModelContext(null, { modelContext: other }), other);
    assert.equal(detectModelContext({}, {}), null);
    assert.equal(detectModelContext(undefined, null), null);
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

  it('never passes a name to registerTool twice in one page session', async () => {
    const context = fakeModelContext();
    const registry = createToolRegistry(context, { signal: new AbortController().signal });
    const stages = [
      buildVitrineTools('browse', fullHandlers),
      buildVitrineTools('results', fullHandlers),
      buildVitrineTools('compared', fullHandlers),
      buildVitrineTools('results', fullHandlers),
      buildVitrineTools('prepared', fullHandlers),
      buildVitrineTools('browse', fullHandlers),
    ];
    for (const tools of stages) await registry.sync(tools);
    const names = context.registered.map(tool => tool.name);
    assert.deepEqual(names, [...new Set(names)]);
    assert.deepEqual(names, [
      'load_context',
      'search_products',
      'compare_products',
      'prepare_selection',
    ]);
  });

  it('registers in the deterministic order regardless of the desired order', async () => {
    const context = fakeModelContext();
    const registry = createToolRegistry(context, { signal: new AbortController().signal });
    await registry.sync([
      definition(LEAKY_TOOL_NAME),
      definition('prepare_selection'),
      definition('search_products'),
      definition('compare_products'),
      definition('load_context'),
    ]);
    assert.deepEqual(
      context.registered.map(tool => tool.name),
      ['load_context', 'search_products', 'compare_products', 'prepare_selection', LEAKY_TOOL_NAME],
    );
  });

  it('does not abort prepare_selection when the stage moves back to results', async () => {
    const signals = new Map<string, AbortSignal>();
    const context: ModelContext = {
      registerTool(tool, options) {
        signals.set(tool.name, options.signal);
      },
    };
    const registry = createToolRegistry(context, { signal: new AbortController().signal });
    await registry.sync(buildVitrineTools('compared', fullHandlers));
    await registry.sync(buildVitrineTools('results', fullHandlers));
    assert.equal(signals.get('prepare_selection')?.aborted, false);
    assert.deepEqual(registry.names(), [
      'load_context',
      'search_products',
      'compare_products',
      'prepare_selection',
    ]);
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

  it('does not reject when a host that ignores AbortSignal throws InvalidStateError', async () => {
    const context: ModelContext = {
      async registerTool() {
        throw new DOMException('already registered', 'InvalidStateError');
      },
    };
    const registry = createToolRegistry(context, { signal: new AbortController().signal });
    await assert.doesNotReject(registry.sync([definition('search_products')]));
    assert.deepEqual(registry.names(), ['search_products']);
  });

  it('aborts only the leaky demo tool when it leaves the desired set', async () => {
    const signals = new Map<string, AbortSignal>();
    const aborted: string[] = [];
    const context: ModelContext = {
      registerTool(tool, options) {
        signals.set(tool.name, options.signal);
        options.signal.addEventListener('abort', () => aborted.push(tool.name));
      },
    };
    const registry = createToolRegistry(context, { signal: new AbortController().signal });
    await registry.sync([definition('search_products'), definition(LEAKY_TOOL_NAME)]);
    await registry.sync([definition('search_products')]);
    assert.deepEqual(aborted, [LEAKY_TOOL_NAME]);
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
