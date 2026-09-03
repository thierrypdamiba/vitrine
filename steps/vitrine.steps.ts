import { strict as assert } from 'node:assert';

import { Given, Then, When } from '@cucumber/cucumber';

import {
  DAD_SCOTLAND_FIXTURE,
  GLEN_PACKABLE_SHELL_ID,
  PUBLIC_BRIEF_FIELDS,
  completeSearch,
  handleCatalogSearch,
  publicBriefFromFixture,
  rankForTrip,
  searchInventory,
  viewFromSearch,
} from '../lib/vitrine.ts';
import {
  catalogSearchToolDefinition,
  privateFieldsInSchema,
  registerVitrineTools,
} from '../lib/webmcp.ts';
import type { SafewordWorld } from './world.ts';

Given("the deterministic private context for Dad's Scotland trip", function (this: SafewordWorld) {
  this.privateContext = DAD_SCOTLAND_FIXTURE;
});

When('the shopper runs the Vitrine search', function (this: SafewordWorld) {
  const brief = publicBriefFromFixture(this.privateContext);
  const result = handleCatalogSearch(brief);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  this.adapterStatus = result.status;
  this.adapterBody = { receipt: result.receipt, items: result.items };
  this.searchResult = completeSearch(result.receipt, result.items, this.privateContext);
});

Then(
  'the merchant receives only category, size, features, and colors',
  function (this: SafewordWorld) {
    const receipt = this.searchResult?.receipt;
    assert.ok(receipt);
    assert.deepEqual(Object.keys(receipt).sort(), [...PUBLIC_BRIEF_FIELDS].sort());
    assert.equal('destination' in receipt, false);
    assert.equal('budgetUsd' in receipt, false);
    assert.equal(this.adapterStatus, 200);
  },
);

Given('a catalog request that includes the private destination', function (this: SafewordWorld) {
  this.catalogRequest = {
    ...publicBriefFromFixture(),
    destination: 'Scotland',
  };
});

When('the request reaches the merchant adapter', function (this: SafewordWorld) {
  const result = handleCatalogSearch(this.catalogRequest);
  this.adapterStatus = result.status;
  this.adapterBody = result.ok
    ? { receipt: result.receipt, items: result.items }
    : { error: result.error };
});

Then('the merchant rejects it without searching inventory', function (this: SafewordWorld) {
  assert.equal(this.adapterStatus, 400);
  assert.match(this.adapterBody?.error ?? '', /destination/i);
  assert.equal(this.adapterBody?.items, undefined);
});

Given(
  'catalog results with relevant jackets above and below the private budget',
  function (this: SafewordWorld) {
    this.privateContext = DAD_SCOTLAND_FIXTURE;
    this.catalogItems = searchInventory(publicBriefFromFixture());
    assert.ok(this.catalogItems.some(item => item.priceUsd <= DAD_SCOTLAND_FIXTURE.budgetUsd));
    assert.ok(this.catalogItems.some(item => item.priceUsd > DAD_SCOTLAND_FIXTURE.budgetUsd));
  },
);

When("Vitrine ranks the results for Dad's trip", function (this: SafewordWorld) {
  this.ranking = rankForTrip(this.catalogItems ?? [], this.privateContext);
});

Then(
  'the shortlist leads with an under-budget waterproof packable jacket',
  function (this: SafewordWorld) {
    const lead = this.ranking?.[0];
    assert.ok(lead);
    assert.equal(lead.id, GLEN_PACKABLE_SHELL_ID);
    assert.ok(lead.priceUsd <= DAD_SCOTLAND_FIXTURE.budgetUsd);
    assert.ok(lead.features.includes('waterproof'));
    assert.ok(lead.features.includes('packable'));
  },
);

Given('Vitrine can search its deterministic catalog', function (this: SafewordWorld) {
  this.privateContext = DAD_SCOTLAND_FIXTURE;
});

When(
  'the same public brief is submitted through each entry point',
  async function (this: SafewordWorld) {
    const brief = publicBriefFromFixture(this.privateContext);
    const items = searchInventory(brief);
    const guided = completeSearch(brief, items, this.privateContext);
    let toolResult: typeof guided | undefined;
    const registered: unknown[] = [];
    await registerVitrineTools(
      {
        async registerTool(tool) {
          registered.push(tool);
        },
      },
      {
        signal: new AbortController().signal,
        onResult: result => {
          toolResult = result;
        },
        search: async () => guided,
      },
    );
    const tool = registered.find(
      entry => (entry as { name?: string }).name === 'search_products',
    ) as { execute: (input: unknown) => Promise<string> } | undefined;
    assert.ok(tool);
    await tool.execute(brief);
    this.entryResults = { guided, webmcp: toolResult ?? guided };
  },
);

Then(
  'each entry point presents the same products and merchant receipt',
  function (this: SafewordWorld) {
    const guided = this.entryResults?.guided;
    const webmcp = this.entryResults?.webmcp;
    assert.ok(guided);
    assert.ok(webmcp);
    assert.deepEqual(webmcp.receipt, guided.receipt);
    assert.deepEqual(webmcp.shortlist, guided.shortlist);
  },
);

Given('the merchant accepted a public brief', function (this: SafewordWorld) {
  const brief = publicBriefFromFixture();
  const result = handleCatalogSearch(brief);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  this.adapterBody = { receipt: result.receipt, items: result.items };
  this.searchResult = completeSearch(result.receipt, result.items);
});

When('Vitrine presents the disclosure Seam', function (this: SafewordWorld) {
  assert.ok(this.searchResult);
  this.seamView = viewFromSearch(this.searchResult, 'unavailable');
});

Then(
  'the vault names the withheld private facts and the merchant receipt does not contain them',
  function (this: SafewordWorld) {
    assert.deepEqual(this.seamView?.merchant.receipt, this.adapterBody?.receipt);
    const named = (this.seamView?.vault.withheld ?? [])
      .map(fact => `${fact.label} ${fact.value}`)
      .join(' ');
    assert.match(named, /Dad/);
    assert.match(named, /Scotland/);
    assert.match(named, /October/);
    assert.match(named, /\$250/);
    const merchantCopy = JSON.stringify(this.seamView?.merchant);
    assert.equal(merchantCopy.includes('Dad'), false);
    assert.equal(merchantCopy.includes('Scotland'), false);
  },
);

Given('the browser supports the imperative WebMCP API', function () {
  // Registration is exercised against a fake document.modelContext.
});

When('Vitrine registers its page tools', function (this: SafewordWorld) {
  this.registeredTool = catalogSearchToolDefinition(async () => '{}');
  this.toolSchema = this.registeredTool.inputSchema;
});

Then(
  'the catalog search schema excludes every private-context field',
  function (this: SafewordWorld) {
    assert.ok(this.toolSchema);
    assert.deepEqual(privateFieldsInSchema(this.toolSchema), []);
    assert.deepEqual(
      Object.keys(this.toolSchema.properties).sort(),
      [...PUBLIC_BRIEF_FIELDS].sort(),
    );
    assert.equal(this.toolSchema.additionalProperties, false);
  },
);

Given(
  'the browser has no WebMCP API and no external context connection',
  function (this: SafewordWorld) {
    this.privateContext = DAD_SCOTLAND_FIXTURE;
  },
);

When('the shopper runs the guided demo', function (this: SafewordWorld) {
  const brief = publicBriefFromFixture(this.privateContext);
  const items = searchInventory(brief);
  this.searchResult = completeSearch(brief, items, this.privateContext);
  this.seamView = viewFromSearch(this.searchResult, 'unavailable');
});

Then(
  'Vitrine still presents a relevant shortlist and merchant receipt',
  function (this: SafewordWorld) {
    assert.equal(this.seamView?.webmcp, 'unavailable');
    assert.equal(this.seamView?.arcadeConnected, false);
    assert.equal(this.seamView?.merchant.shortlist[0]?.id, GLEN_PACKABLE_SHELL_ID);
    assert.deepEqual(
      Object.keys(this.seamView?.merchant.receipt ?? {}).sort(),
      [...PUBLIC_BRIEF_FIELDS].sort(),
    );
  },
);
