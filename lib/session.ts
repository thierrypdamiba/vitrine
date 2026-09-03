import type { ArcadeRequest, CatalogItem, PublicBrief } from './vitrine.ts';

export type DemoStage = 'browse' | 'results' | 'compared' | 'prepared';

/**
 * The storefront's own browse query, sent once at page load when live shopping is
 * available so first paint shows real inventory. It is the shop's default, not a
 * shopper request: it never sets the receipt, the seam, or "Shop received".
 */
export const STOREFRONT_DEFAULT_BRIEF: PublicBrief = {
  category: 'jacket',
  size: 'M',
  features: ['waterproof', 'packable'],
  colors: ['navy', 'olive'],
};

/** Live rows shown in the browse grid before any shopper request. Never a receipt. */
export type StorefrontDefault = {
  items: CatalogItem[];
  merchant: 'walmart' | 'google_shopping';
  arcadeRequest?: ArcadeRequest;
  cached?: boolean;
};

export type TraceActor = 'agent' | 'shopper' | 'merchant';

export type TraceEvent = {
  id: string;
  actor: TraceActor;
  title: string;
  detail: string;
  arcadeTool?: string;
};

export type ToolMessage = { error: string; hint: string };

export const SEARCH_PRODUCTS_TOOL_NAME = 'search_products';
export const LOAD_CONTEXT_TOOL_NAME = 'load_context';
export const COMPARE_PRODUCTS_TOOL_NAME = 'compare_products';
export const PREPARE_SELECTION_TOOL_NAME = 'prepare_selection';
export const LEAKY_TOOL_NAME = 'personalize_for_shopper';

// flip to true if the hosted check shows ChatGPT does not surface tools registered after page load
export const REGISTER_ALL_AT_MOUNT = false;

/**
 * Tools accumulate as the page state advances and are never unregistered
 * mid-session; each later stage is a superset of the one before it.
 */
export function toolsForStage(stage: DemoStage): string[] {
  switch (stage) {
    case 'browse':
      return [LOAD_CONTEXT_TOOL_NAME, SEARCH_PRODUCTS_TOOL_NAME];
    case 'results':
      return [LOAD_CONTEXT_TOOL_NAME, SEARCH_PRODUCTS_TOOL_NAME, COMPARE_PRODUCTS_TOOL_NAME];
    case 'compared':
    case 'prepared':
      return [
        LOAD_CONTEXT_TOOL_NAME,
        SEARCH_PRODUCTS_TOOL_NAME,
        COMPARE_PRODUCTS_TOOL_NAME,
        PREPARE_SELECTION_TOOL_NAME,
      ];
  }
}

export function toolsToRegister(stage: DemoStage): string[] {
  return REGISTER_ALL_AT_MOUNT ? toolsForStage('compared') : toolsForStage(stage);
}

export function searchFirstMessage(): ToolMessage {
  return { error: 'No products yet.', hint: 'Call search_products first.' };
}

export function compareFirstMessage(): ToolMessage {
  return {
    error: 'Nothing compared yet.',
    hint: 'Call compare_products with two or three ids from the visible results, then prepare_selection with one of them.',
  };
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

export function nextTraceEvent(
  actor: TraceActor,
  title: string,
  detail: string,
  arcadeTool?: string,
): TraceEvent {
  traceSeq += 1;
  const event: TraceEvent = { id: `trace-${traceSeq}`, actor, title, detail };
  if (arcadeTool) event.arcadeTool = arcadeTool;
  return event;
}

export function stageIndex(stage: DemoStage): number {
  if (stage === 'browse') return 0;
  if (stage === 'results') return 1;
  return 2;
}
