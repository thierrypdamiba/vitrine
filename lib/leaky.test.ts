import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  LEAKY_INPUT_SCHEMA,
  MAX_LEAK_ROWS,
  MAX_LEAK_VALUE_CHARS,
  leakRows,
  leakyToolDefinition,
  type LeakRow,
} from './leaky.ts';
import { LEAKY_TOOL_NAME, toolsForStage, type DemoStage } from './session.ts';
import { DAD_SCOTLAND_FIXTURE } from './vitrine.ts';
import { CATALOG_SEARCH_INPUT_SCHEMA, buildVitrineTools, privateFieldsInSchema } from './webmcp.ts';

const fixturePayload = {
  recipient: DAD_SCOTLAND_FIXTURE.recipient,
  relationship: DAD_SCOTLAND_FIXTURE.relationship,
  destination: DAD_SCOTLAND_FIXTURE.destination,
  dates: DAD_SCOTLAND_FIXTURE.dates,
  weather: DAD_SCOTLAND_FIXTURE.weather,
  budgetUsd: DAD_SCOTLAND_FIXTURE.budgetUsd,
  size: DAD_SCOTLAND_FIXTURE.size,
  features: DAD_SCOTLAND_FIXTURE.features,
  colors: DAD_SCOTLAND_FIXTURE.colors,
};

describe('personalize_for_shopper', () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;

  beforeEach(() => {
    fetchCalls = 0;
    globalThis.fetch = (() => {
      fetchCalls += 1;
      throw new Error('personalize_for_shopper must not fetch');
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('records every volunteered field on the page and performs no network call', async () => {
    const received: LeakRow[][] = [];
    const tool = leakyToolDefinition(rows => received.push(rows));
    assert.equal(tool.name, LEAKY_TOOL_NAME);
    assert.equal(tool.name, 'personalize_for_shopper');
    assert.ok(tool.title && tool.title.length <= 60);
    assert.ok(tool.description.length <= 500);
    assert.deepEqual(tool.annotations, { readOnlyHint: false, untrustedContentHint: false });

    const output = JSON.parse(await tool.execute(fixturePayload)) as Record<string, unknown>;

    assert.equal(fetchCalls, 0);
    assert.deepEqual(output, {
      ok: true,
      tailored: false,
      note: 'Demonstration only. Nothing was sent to a merchant.',
    });
    assert.equal(received.length, 1);
    assert.equal(received[0].length, 9);
    assert.deepEqual(
      received[0].map(row => row.key),
      Object.keys(fixturePayload),
    );
    assert.deepEqual(
      received[0].find(row => row.key === 'destination'),
      {
        key: 'destination',
        value: 'Scotland',
      },
    );
    assert.deepEqual(
      received[0].find(row => row.key === 'budgetUsd'),
      {
        key: 'budgetUsd',
        value: '250',
      },
    );
    assert.deepEqual(
      received[0].find(row => row.key === 'features'),
      {
        key: 'features',
        value: '["waterproof","packable"]',
      },
    );
  });

  it('caps rows and value length and ignores non-object input', () => {
    const wide = Object.fromEntries(
      Array.from({ length: 30 }, (_, i) => [`k${i}`, 'x'.repeat(500)]),
    );
    const rows = leakRows(wide);
    assert.equal(rows.length, MAX_LEAK_ROWS);
    assert.ok(rows.every(row => row.value.length <= MAX_LEAK_VALUE_CHARS));
    assert.deepEqual(leakRows('nope'), []);
    assert.deepEqual(leakRows(null), []);
    assert.deepEqual(leakRows([1, 2]), []);
  });

  it('asks for every private field the strict schema refuses', () => {
    const asked = Object.keys(LEAKY_INPUT_SCHEMA.properties);
    for (const field of ['recipient', 'destination', 'dates', 'budgetUsd', 'notes']) {
      assert.ok(asked.includes(field));
    }
    assert.ok(privateFieldsInSchema(LEAKY_INPUT_SCHEMA).length > 0);
  });
});

describe('leaky build', () => {
  const handlers = {
    loadContext: async () => DAD_SCOTLAND_FIXTURE,
    currentItems: () => [],
    comparedIds: () => [],
  };

  it('appends personalize_for_shopper at every stage only when leaky is on', () => {
    for (const stage of ['browse', 'results', 'compared', 'prepared'] as DemoStage[]) {
      const off = buildVitrineTools(stage, handlers);
      assert.equal(
        off.some(tool => tool.name === LEAKY_TOOL_NAME),
        false,
        stage,
      );
      const on = buildVitrineTools(stage, { ...handlers, leaky: true });
      assert.equal(on.at(-1)?.name, LEAKY_TOOL_NAME, stage);
      assert.deepEqual(
        on.slice(0, -1).map(tool => tool.name),
        off.map(tool => tool.name),
      );
    }
  });

  it('leaves the strict search schema untouched', () => {
    const tools = buildVitrineTools('browse', { ...handlers, leaky: true });
    const search = tools.find(tool => tool.name === 'search_products');
    assert.ok(search);
    assert.deepEqual(privateFieldsInSchema(search.inputSchema), []);
    assert.deepEqual(privateFieldsInSchema(CATALOG_SEARCH_INPUT_SCHEMA), []);
    assert.deepEqual(Object.keys(search.inputSchema.properties), [
      'category',
      'size',
      'features',
      'colors',
    ]);
  });

  it('routes what the tool receives to onLeak', async () => {
    const ledger: LeakRow[] = [];
    const tools = buildVitrineTools('browse', {
      ...handlers,
      leaky: true,
      onLeak: rows => ledger.push(...rows),
    });
    const leaky = tools.find(tool => tool.name === LEAKY_TOOL_NAME);
    assert.ok(leaky);
    await leaky.execute({ destination: 'Scotland' });
    assert.deepEqual(ledger, [{ key: 'destination', value: 'Scotland' }]);
  });

  it('never appears in the stage tool lists', () => {
    for (const stage of ['browse', 'results', 'compared', 'prepared'] as DemoStage[]) {
      assert.equal(toolsForStage(stage).includes(LEAKY_TOOL_NAME), false, stage);
    }
  });
});
