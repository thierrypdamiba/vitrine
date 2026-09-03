import type { CatalogItem, PublicBrief } from './vitrine.ts';

export type DemoStage = 'browse' | 'results' | 'compared' | 'prepared';

export type TraceLane = 'vault' | 'consent' | 'webmcp' | 'merchant';

export type TraceEvent = {
  id: string;
  lane: TraceLane;
  title: string;
  detail: string;
};

export const SEARCH_PRODUCTS_TOOL_NAME = 'search_products';
export const LOAD_CONTEXT_TOOL_NAME = 'load_context';
export const PROPOSE_BRIEF_TOOL_NAME = 'propose_brief';
export const COMPARE_PRODUCTS_TOOL_NAME = 'compare_products';
export const PREPARE_SELECTION_TOOL_NAME = 'prepare_selection';
export const SHARE_BRIEF_TOOL_NAME = 'share_brief';

export function toolsForStage(stage: DemoStage): string[] {
  switch (stage) {
    case 'browse':
      return [SEARCH_PRODUCTS_TOOL_NAME];
    case 'results':
      return [SEARCH_PRODUCTS_TOOL_NAME, COMPARE_PRODUCTS_TOOL_NAME];
    case 'compared':
      return [SEARCH_PRODUCTS_TOOL_NAME, COMPARE_PRODUCTS_TOOL_NAME, PREPARE_SELECTION_TOOL_NAME];
    case 'prepared':
      return [SEARCH_PRODUCTS_TOOL_NAME, PREPARE_SELECTION_TOOL_NAME];
  }
}

export function consentNeededMessage(): string {
  return 'The shopper has not shared the public brief. Fill share_brief and wait for them to submit.';
}

export function searchFirstMessage(): string {
  return 'No products yet. Call search_products first.';
}

export function compareFirstMessage(): string {
  return 'Compare two products first, then call prepare_selection with one id.';
}

export function parseProductIds(input: unknown): string[] {
  if (typeof input === 'object' && input !== null && 'ids' in input && Array.isArray(input.ids)) {
    return input.ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  }
  return [];
}

export function parseProductId(input: unknown): string | null {
  if (
    typeof input === 'object' &&
    input !== null &&
    'id' in input &&
    typeof input.id === 'string'
  ) {
    const id = input.id.trim();
    return id.length > 0 ? id : null;
  }
  return null;
}

export function compareProducts(items: CatalogItem[], ids: string[]): CatalogItem[] | string {
  const unique = [...new Set(ids)];
  if (unique.length < 2 || unique.length > 3) {
    return 'Pass two or three product ids from the visible results.';
  }
  const selected: CatalogItem[] = [];
  for (const id of unique) {
    const item = items.find(entry => entry.id === id);
    if (!item)
      return `Unknown product id ${id}. Search first, then compare ids from those results.`;
    selected.push(item);
  }
  return selected;
}

export function prepareSelection(items: CatalogItem[], id: string): CatalogItem | string {
  const item = items.find(entry => entry.id === id);
  if (!item) return 'Unknown product id. Compare products first, then prepare one of those ids.';
  return item;
}

export function briefsMatch(left: PublicBrief, right: PublicBrief): boolean {
  return (
    left.category === right.category &&
    left.size === right.size &&
    left.features.join(',') === right.features.join(',') &&
    left.colors.join(',') === right.colors.join(',')
  );
}

let traceSeq = 0;

export function nextTraceEvent(lane: TraceLane, title: string, detail: string): TraceEvent {
  traceSeq += 1;
  return { id: `trace-${traceSeq}`, lane, title, detail };
}

export function stageIndex(stage: DemoStage): number {
  if (stage === 'browse') return 0;
  if (stage === 'results') return 1;
  return 2;
}
