import {
  compareFirstMessage,
  compareProducts,
  COMPARE_PRODUCTS_TOOL_NAME,
  consentNeededMessage,
  LOAD_CONTEXT_TOOL_NAME,
  parseProductId,
  parseProductIds,
  PREPARE_SELECTION_TOOL_NAME,
  prepareSelection,
  PROPOSE_BRIEF_TOOL_NAME,
  SEARCH_PRODUCTS_TOOL_NAME,
  searchFirstMessage,
  toolsForStage,
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
  description: string;
  inputSchema: JsonSchema;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute: (input: unknown, extras?: { signal?: AbortSignal }) => Promise<string> | string;
};

export type ModelContext = {
  registerTool(tool: ModelContextTool, options?: { signal?: AbortSignal }): Promise<void> | void;
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
): ModelContext | null {
  return documentLike?.modelContext ?? null;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

export type VitrineToolHandlers = {
  loadContext?: () => Promise<PrivateContext>;
  proposeBrief?: () => PublicBrief;
  isApproved?: () => boolean;
  currentItems?: () => CatalogItem[];
  comparedIds?: () => string[];
  search?: (brief: PublicBrief, extras?: { signal?: AbortSignal }) => Promise<VitrineSearchResult>;
  onContext?: (context: PrivateContext) => void;
  onPropose?: (brief: PublicBrief) => void;
  onResult?: (result: VitrineSearchResult) => void;
  onCompare?: (ids: string[]) => void;
  onPrepare?: (id: string) => void;
};

export async function registerVitrineTools(
  modelContext: ModelContext,
  options: {
    signal: AbortSignal;
    stage?: DemoStage;
    onResult?: (result: VitrineSearchResult) => void;
    search?: (
      brief: PublicBrief,
      extras?: { signal?: AbortSignal },
    ) => Promise<VitrineSearchResult>;
  } & VitrineToolHandlers,
): Promise<void> {
  const search = options.search ?? runVitrineSearch;
  const onResult = options.onResult ?? (() => undefined);
  const names = options.stage ? new Set(toolsForStage(options.stage)) : null;

  const shouldRegister = (name: string) => names === null || names.has(name);

  const tools: ModelContextTool[] = [];

  if (options.loadContext && shouldRegister(LOAD_CONTEXT_TOOL_NAME)) {
    tools.push(
      tool({
        name: LOAD_CONTEXT_TOOL_NAME,
        description:
          'Load private gift context into the vault. Never send that context to search_products.',
        inputSchema: EMPTY_SCHEMA,
        execute: async () => {
          const context = await options.loadContext!();
          options.onContext?.(context);
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

  if (options.proposeBrief && shouldRegister(PROPOSE_BRIEF_TOOL_NAME)) {
    tools.push(
      tool({
        name: PROPOSE_BRIEF_TOOL_NAME,
        description:
          'Derive the public brief from vault context. Show it for shopper approval. Do not search yet.',
        inputSchema: EMPTY_SCHEMA,
        execute: () => {
          const brief = options.proposeBrief!();
          options.onPropose?.(brief);
          return JSON.stringify(brief);
        },
      }),
    );
  }

  if (shouldRegister(SEARCH_PRODUCTS_TOOL_NAME)) {
    tools.push(
      catalogSearchToolDefinition(async (input, extras) => {
        if (options.isApproved && !options.isApproved()) {
          return JSON.stringify({ error: consentNeededMessage() });
        }
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

  if (options.onCompare && shouldRegister(COMPARE_PRODUCTS_TOOL_NAME)) {
    tools.push(
      tool({
        name: COMPARE_PRODUCTS_TOOL_NAME,
        description: 'Compare two or three visible products after search_products returns.',
        inputSchema: COMPARE_SCHEMA,
        untrusted: true,
        execute: input => {
          const items = options.currentItems?.() ?? [];
          if (items.length === 0) {
            return JSON.stringify({ error: searchFirstMessage() });
          }
          const ids = parseProductIds(input);
          const selected = compareProducts(items, ids);
          if (typeof selected === 'string') {
            return JSON.stringify({ error: selected });
          }
          options.onCompare?.(selected.map(item => item.id));
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

  if (options.onPrepare && shouldRegister(PREPARE_SELECTION_TOOL_NAME)) {
    tools.push(
      tool({
        name: PREPARE_SELECTION_TOOL_NAME,
        description:
          'Prepare one compared product. The shopper confirms before opening the listing.',
        inputSchema: PREPARE_SCHEMA,
        untrusted: true,
        execute: input => {
          if ((options.comparedIds?.() ?? []).length < 2) {
            return JSON.stringify({ error: compareFirstMessage() });
          }
          const id = parseProductId(input);
          if (!id) {
            return JSON.stringify({ error: 'id is required' });
          }
          const selected = prepareSelection(options.currentItems?.() ?? [], id);
          if (typeof selected === 'string') {
            return JSON.stringify({ error: selected });
          }
          options.onPrepare?.(selected.id);
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

  for (const entry of tools) {
    await modelContext.registerTool(entry, { signal: options.signal });
  }
}
