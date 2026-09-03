import {
  compareFirstMessage,
  compareProducts,
  COMPARE_PRODUCTS_TOOL_NAME,
  LEAKY_TOOL_NAME,
  LOAD_CONTEXT_TOOL_NAME,
  parseProductId,
  parseProductIds,
  PREPARE_SELECTION_TOOL_NAME,
  prepareSelection,
  SEARCH_PRODUCTS_TOOL_NAME,
  searchFirstMessage,
  toolsToRegister,
  type DemoStage,
} from './session.ts';
import {
  PRIVATE_FIELD_NAMES,
  parsePublicBrief,
  runVitrineSearch,
  type CatalogItem,
  type PrivateContext,
  type PublicBrief,
  type VitrineSearchResult,
} from './vitrine.ts';

export { SEARCH_PRODUCTS_TOOL_NAME, SEARCH_PRODUCTS_TOOL_NAME as CATALOG_SEARCH_TOOL_NAME };

export type JsonSchema = {
  type: 'object';
  additionalProperties: false;
  required: string[];
  properties: Record<
    string,
    {
      type: string;
      enum?: string[];
      description: string;
      items?: { type: string; enum?: string[] };
    }
  >;
};

export type ModelContextTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchema;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute: (input: unknown, extras?: { signal?: AbortSignal }) => Promise<string> | string;
};

export type ModelContext = {
  registerTool(tool: ModelContextTool, options: { signal: AbortSignal }): Promise<void> | void;
  getTools?(): Promise<Array<{ name: string }>> | Array<{ name: string }>;
  addEventListener?(type: 'toolchange', listener: () => void): void;
  removeEventListener?(type: 'toolchange', listener: () => void): void;
};

export const CATALOG_SEARCH_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['category', 'size', 'features', 'colors'],
  properties: {
    category: {
      type: 'string',
      enum: ['jacket'],
      description: 'Garment category to search',
    },
    size: {
      type: 'string',
      enum: ['XS', 'S', 'M', 'L', 'XL'],
      description: 'Listed catalog size',
    },
    features: {
      type: 'array',
      items: { type: 'string', enum: ['waterproof', 'packable'] },
      description: 'Required catalog features',
    },
    colors: {
      type: 'array',
      items: { type: 'string', enum: ['navy', 'olive'] },
      description: 'Allowed catalog colors',
    },
  },
};

const EMPTY_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {},
};

const COMPARE_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['ids'],
  properties: {
    ids: {
      type: 'array',
      items: { type: 'string' },
      description: 'Two or three ids from the visible results',
    },
  },
};

const PREPARE_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      description: 'One product id. The shopper opens the listing.',
    },
  },
};

const SEARCH_DESCRIPTION =
  'Search this jacket shop. Send only category, size, features, and colors. Do not send recipient, trip, dates, or budget. Updates the visible catalog.';

export function privateFieldsInSchema(schema: JsonSchema): string[] {
  const blob = JSON.stringify(schema).toLowerCase();
  return PRIVATE_FIELD_NAMES.filter(field => blob.includes(field.toLowerCase()));
}

export function compactCatalogToolOutput(result: VitrineSearchResult): string {
  return JSON.stringify({
    receipt: result.receipt,
    merchantQuery: result.merchantQuery,
    merchant: result.merchant,
    shortlist: result.shortlist.slice(0, 5).map(item => ({
      id: item.id,
      name: item.name,
      priceUsd: item.priceUsd,
      merchantName: item.merchantName,
      rating: item.rating,
    })),
  });
}

export function catalogSearchToolDefinition(
  execute: ModelContextTool['execute'],
): ModelContextTool {
  return {
    name: SEARCH_PRODUCTS_TOOL_NAME,
    title: 'Search jackets (public brief only)',
    description: SEARCH_DESCRIPTION,
    inputSchema: CATALOG_SEARCH_INPUT_SCHEMA,
    annotations: {
      readOnlyHint: false,
      untrustedContentHint: true,
    },
    execute,
  };
}

function tool(
  definition: Omit<ModelContextTool, 'annotations'> & { untrusted?: boolean },
): ModelContextTool {
  return {
    ...definition,
    annotations: {
      readOnlyHint: false,
      untrustedContentHint: definition.untrusted === true,
    },
  };
}

export function detectModelContext(
  documentLike: { modelContext?: ModelContext } | null | undefined,
  navigatorLike?: { modelContext?: ModelContext } | null,
): ModelContext | null {
  // ChatGPT's browser and Chrome expose document.modelContext; some hosts and
  // older builds only expose the navigator alias.
  return documentLike?.modelContext ?? navigatorLike?.modelContext ?? null;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
  interface Navigator {
    modelContext?: ModelContext;
  }
}

export type ToolRegistry = {
  sync(desired: ModelContextTool[]): Promise<void>;
  names(): string[];
  abortAll(): void;
};

function isInvalidStateError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'InvalidStateError'
  );
}

/**
 * One AbortController per registered tool name. Names accumulate for the whole
 * page session: a host that ignores AbortSignal still holds the first
 * registration, and each definition reads live state through refs, so a name is
 * never re-registered. Only the opt-in leaky demo tool is ever aborted.
 */
export function createToolRegistry(
  modelContext: ModelContext,
  options: {
    signal: AbortSignal;
    onChange?: (names: string[]) => void;
    onError?: (name: string, error: unknown) => void;
  },
): ToolRegistry {
  const held = new Map<string, AbortController>();

  const names = () => [...held.keys()];
  const changed = () => options.onChange?.(names());

  const abortAll = () => {
    if (held.size === 0) return;
    for (const controller of held.values()) controller.abort();
    held.clear();
    changed();
  };

  if (options.signal.aborted) {
    abortAll();
  } else {
    options.signal.addEventListener('abort', abortAll, { once: true });
  }

  return {
    names,
    abortAll,
    async sync(desired) {
      if (options.signal.aborted) return;
      const wanted = new Set(desired.map(entry => entry.name));
      let dirty = false;

      for (const name of names()) {
        if (name === LEAKY_TOOL_NAME && !wanted.has(name)) {
          held.get(name)?.abort();
          held.delete(name);
          dirty = true;
        }
      }

      for (const entry of desired) {
        if (held.has(entry.name)) continue;
        const controller = new AbortController();
        try {
          await modelContext.registerTool(entry, { signal: controller.signal });
          held.set(entry.name, controller);
          dirty = true;
        } catch (error) {
          options.onError?.(entry.name, error);
          if (isInvalidStateError(error)) {
            // The host still holds an earlier registration under this name.
            held.set(entry.name, controller);
            dirty = true;
          }
        }
      }

      if (dirty) changed();
    },
  };
}

export type VitrineToolHandlers = {
  loadContext?: () => Promise<PrivateContext>;
  currentItems?: () => CatalogItem[];
  comparedIds?: () => string[];
  search?: (brief: PublicBrief, extras?: { signal?: AbortSignal }) => Promise<VitrineSearchResult>;
  onContext?: (context: PrivateContext) => void;
  onResult?: (result: VitrineSearchResult) => void;
  onCompare?: (ids: string[]) => void;
  onPrepare?: (id: string) => void;
};

/**
 * Tool definitions for a page stage, in registration order. The leaky demo tool
 * is appended by lib/leaky.ts; the flag is accepted here so the call site is stable.
 */
export function buildVitrineTools(
  stage: DemoStage,
  handlers: VitrineToolHandlers & { leaky?: boolean },
): ModelContextTool[] {
  const search = handlers.search ?? runVitrineSearch;
  const onResult = handlers.onResult ?? (() => undefined);
  const names = new Set(toolsToRegister(stage));
  const tools: ModelContextTool[] = [];

  if (handlers.loadContext && names.has(LOAD_CONTEXT_TOOL_NAME)) {
    tools.push(
      tool({
        name: LOAD_CONTEXT_TOOL_NAME,
        title: 'Read the shopper vault',
        description:
          'Load private gift context into the vault. Never send that context to search_products.',
        inputSchema: EMPTY_SCHEMA,
        execute: async () => {
          const context = await handlers.loadContext!();
          handlers.onContext?.(context);
          return JSON.stringify({
            recipient: context.recipient,
            destination: context.destination,
            dates: context.dates,
            weather: context.weather,
            budgetUsd: context.budgetUsd,
            size: context.size,
            features: context.features,
            colors: context.colors,
            calendarSummary: context.calendarSummary ?? null,
          });
        },
      }),
    );
  }

  if (names.has(SEARCH_PRODUCTS_TOOL_NAME)) {
    tools.push(
      catalogSearchToolDefinition(async (input, extras) => {
        const parsed = parsePublicBrief(input);
        if (!parsed.ok) {
          return JSON.stringify({ error: parsed.error });
        }
        const result = await search(parsed.brief, { signal: extras?.signal });
        onResult(result);
        return compactCatalogToolOutput(result);
      }),
    );
  }

  if (names.has(COMPARE_PRODUCTS_TOOL_NAME)) {
    tools.push(
      tool({
        name: COMPARE_PRODUCTS_TOOL_NAME,
        title: 'Compare visible products',
        description: 'Compare two or three visible products after search_products returns.',
        inputSchema: COMPARE_SCHEMA,
        untrusted: true,
        execute: input => {
          const items = handlers.currentItems?.() ?? [];
          if (items.length === 0) {
            return JSON.stringify(searchFirstMessage());
          }
          const ids = parseProductIds(input);
          const selected = compareProducts(items, ids);
          if (typeof selected === 'string') {
            return JSON.stringify({ error: selected });
          }
          handlers.onCompare?.(selected.map(item => item.id));
          return JSON.stringify({
            compared: selected.map(item => ({
              id: item.id,
              name: item.name,
              priceUsd: item.priceUsd,
              merchantName: item.merchantName,
            })),
          });
        },
      }),
    );
  }

  if (names.has(PREPARE_SELECTION_TOOL_NAME)) {
    tools.push(
      tool({
        name: PREPARE_SELECTION_TOOL_NAME,
        title: 'Prepare one product for the shopper',
        description:
          'Prepare one compared product. The shopper confirms before opening the listing.',
        inputSchema: PREPARE_SCHEMA,
        untrusted: true,
        execute: input => {
          if ((handlers.comparedIds?.() ?? []).length < 2) {
            return JSON.stringify(compareFirstMessage());
          }
          const id = parseProductId(input);
          if (!id) {
            return JSON.stringify({ error: 'id is required' });
          }
          const selected = prepareSelection(handlers.currentItems?.() ?? [], id);
          if (typeof selected === 'string') {
            return JSON.stringify({ error: selected });
          }
          handlers.onPrepare?.(selected.id);
          return JSON.stringify({
            prepared: {
              id: selected.id,
              name: selected.name,
              priceUsd: selected.priceUsd,
              url: selected.url,
            },
            needsShopperConfirmation: true,
          });
        },
      }),
    );
  }

  return tools;
}

/**
 * Build the tools for a stage and register them once. Pages that advance through
 * stages should keep one createToolRegistry and call sync instead.
 */
export async function registerVitrineTools(
  modelContext: ModelContext,
  options: {
    signal: AbortSignal;
    stage?: DemoStage;
  } & VitrineToolHandlers,
): Promise<void> {
  const tools = buildVitrineTools(options.stage ?? 'compared', options);
  for (const entry of tools) {
    try {
      await modelContext.registerTool(entry, { signal: options.signal });
    } catch (error) {
      // A host that ignores the AbortSignal still holds the earlier registration
      // under this name; it reads live state through refs, so keep going.
      if (isInvalidStateError(error)) continue;
      throw error;
    }
  }
}
