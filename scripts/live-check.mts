/**
 * Live check against a running dev server (`npm run dev`, port 3001 by default). Asserts the
 * public routes keep their shape with real Arcade credentials: four booleans from status, a
 * Gmail-backed context, and an Arcade search input whose only key is `keywords`.
 * Override the target with VITRINE_URL. Prints no secret values.
 */
import assert from 'node:assert/strict';

const BASE = process.env.VITRINE_URL ?? 'http://localhost:3001';
const SAME_ORIGIN = { 'Sec-Fetch-Site': 'same-origin' };
const XL_BRIEF = {
  category: 'jacket',
  size: 'XL',
  features: ['waterproof', 'packable'],
  colors: ['navy', 'olive'],
};

async function getJson(path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...SAME_ORIGIN, ...(init.headers ?? {}) },
  });
  const body = (await response.json()) as Record<string, unknown>;
  return { __status: response.status, ...body };
}

const status = await getJson('/api/arcade/status');
assert.equal(status.__status, 200, 'status route must answer 200');
const statusKeys = Object.keys(status).filter(key => key !== '__status');
assert.deepEqual(statusKeys, ['configured', 'gmailRead', 'calendar', 'shopping']);
for (const key of statusKeys) assert.equal(typeof status[key], 'boolean', `${key} is boolean`);
console.log('status', JSON.stringify(Object.fromEntries(statusKeys.map(k => [k, status[k]]))));

if (status.gmailRead === true) {
  const context = await getJson('/api/arcade/context', { method: 'POST' });
  assert.equal(context.__status, 200, 'context route must answer 200 when Gmail is authorized');
  const record = context.context as { source?: unknown } | undefined;
  assert.equal(record?.source, 'arcade', 'context.source must be arcade');
  assert.equal(JSON.stringify(context).includes('http'), false, 'context never carries a URL');
  console.log('context source', record?.source);
} else {
  console.log('skip: Gmail is not authorized on this server, context check skipped');
}

const search = await getJson('/api/catalog/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(XL_BRIEF),
});
assert.equal(search.__status, 200, 'catalog search must answer 200');
assert.deepEqual(search.receipt, XL_BRIEF, 'receipt echoes the four accepted fields');
console.log('merchant', search.merchant, search.cached ? '(cached)' : '');
if (status.shopping === true) {
  const arcadeRequest = search.arcadeRequest as { tool?: string; input?: object } | undefined;
  assert.ok(arcadeRequest, 'arcadeRequest present when shopping is ready');
  assert.deepEqual(Object.keys(arcadeRequest.input ?? {}), ['keywords']);
  console.log('arcade call', JSON.stringify(arcadeRequest));
} else {
  console.log('skip: shopping is off, recorded sample expected');
}
console.log('live check passed against', BASE);
