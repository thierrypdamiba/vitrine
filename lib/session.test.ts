import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CATALOG } from './vitrine.ts';
import {
  LEAKY_TOOL_NAME,
  REGISTER_ALL_AT_MOUNT,
  compareFirstMessage,
  compareProducts,
  nextTraceEvent,
  prepareSelection,
  searchFirstMessage,
  toolsForStage,
  toolsToRegister,
} from './session.ts';

describe('workflow stages', () => {
  it('accumulates shop tools as the catalog state changes', () => {
    assert.deepEqual(toolsForStage('browse'), ['load_context', 'search_products']);
    assert.deepEqual(toolsForStage('results'), [
      'load_context',
      'search_products',
      'compare_products',
    ]);
    assert.deepEqual(toolsForStage('compared'), [
      'load_context',
      'search_products',
      'compare_products',
      'prepare_selection',
    ]);
    assert.deepEqual(toolsForStage('prepared'), toolsForStage('compared'));
    assert.ok(toolsForStage('prepared').includes('compare_products'));
  });

  it('never lists the leaky demo tool or a share step', () => {
    for (const stage of ['browse', 'results', 'compared', 'prepared'] as const) {
      const names = toolsForStage(stage);
      assert.equal(names.includes(LEAKY_TOOL_NAME), false);
      assert.equal(
        names.some(name => name.includes('share')),
        false,
      );
    }
  });

  it('registers everything at mount only when the flag is flipped', () => {
    const expected = REGISTER_ALL_AT_MOUNT ? toolsForStage('compared') : toolsForStage('browse');
    assert.deepEqual(toolsToRegister('browse'), expected);
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
    assert.deepEqual(searchFirstMessage(), {
      error: 'No products yet.',
      hint: 'Call search_products first.',
    });
    assert.match(compareFirstMessage().hint, /compare_products/);
    const missing = compareProducts(CATALOG, ['missing-a', 'missing-b']);
    assert.equal(typeof missing, 'string');
  });

  it('tags trace events with an actor and an optional Arcade tool', () => {
    const event = nextTraceEvent(
      'agent',
      'load_context',
      'Gmail via Arcade',
      'Gmail.SearchEmailsByQuery',
    );
    assert.equal(event.actor, 'agent');
    assert.equal(event.arcadeTool, 'Gmail.SearchEmailsByQuery');
    assert.equal('arcadeTool' in nextTraceEvent('shopper', 'filter form', ''), false);
  });
});
