import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CATALOG } from './vitrine.ts';
import {
  compareProducts,
  consentNeededMessage,
  prepareSelection,
  toolsForStage,
} from './session.ts';

describe('workflow stages', () => {
  it('exposes shop tools as the catalog state changes', () => {
    assert.deepEqual(toolsForStage('browse'), ['search_products']);
    assert.deepEqual(toolsForStage('results'), ['search_products', 'compare_products']);
    assert.deepEqual(toolsForStage('compared'), [
      'search_products',
      'compare_products',
      'prepare_selection',
    ]);
  });

  it('compares known ids and prepares one of them', () => {
    const selected = compareProducts(CATALOG, [CATALOG[0].id, CATALOG[1].id]);
    assert.equal(Array.isArray(selected), true);
    if (!Array.isArray(selected)) return;
    assert.equal(selected.length, 2);
    const prepared = prepareSelection(selected, CATALOG[0].id);
    assert.equal(typeof prepared === 'string', false);
    if (typeof prepared === 'string') return;
    assert.equal(prepared.id, CATALOG[0].id);
  });

  it('returns a recovery path when compare runs too early', () => {
    assert.match(consentNeededMessage(), /share_brief/);
    const missing = compareProducts(CATALOG, ['missing-a', 'missing-b']);
    assert.equal(typeof missing, 'string');
  });
});
