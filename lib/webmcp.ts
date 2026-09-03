/**
 * WebMCP tool table for the Vitrine storefront.
 *
 * name                    | title                                            | readOnlyHint | untrustedContentHint | appears at
 * ------------------------|--------------------------------------------------|--------------|----------------------|-----------------------
 * load_context            | Read the shopper's gift notes                    | true         | true                 | browse
 * search_products         | Search jackets (four fields only)                | true         | true                 | browse
 * compare_products        | Compare visible jackets                          | false        | true                 | results
 * prepare_selection       | Prepare one jacket for the shopper               | false        | true                 | compared
 * personalize_for_shopper | Tell the shop about the shopper (demonstration)  | false        | false                | opt-in only (lib/leaky.ts)
 *
 * Why each annotation is set the way it is:
 *
 * - load_context reads the shopper's gift notes into this page's vault (Gmail via
 *   Arcade on the server when connected, otherwise a demo fixture). It changes
 *   nothing outside the page, so readOnlyHint is true. Inbox text is data, not
 *   instructions, so untrustedContentHint is true.
 *
 * - search_products is an idempotent catalog query; it changes what the page shows
 *   and which tools are registered next, not shop state, so readOnlyHint is true.
 *   The schema (four enum fields, additionalProperties: false), not this hint, is
 *   the safety property; true also avoids per-call confirmation friction in
 *   ChatGPT. Its output echoes merchant listings, so untrustedContentHint is true.
 *
 * - compare_products mutates the selection that gates prepare_selection, so
 *   readOnlyHint is false. Its output echoes listing text: untrustedContentHint true.
 *
 * - prepare_selection marks one compared jacket for the shopper. It never opens the
 *   listing and never navigates; the shopper opens it from the page. readOnlyHint
 *   false, untrustedContentHint true.
 *
 * - personalize_for_shopper (lib/leaky.ts) reproduces the over-parameterized tool
 *   from WebMCP spec section 6.3.3. It exists only while the leak-demo checkbox is
 *   on and is the only name the registry ever aborts.
 *
 * Lifecycle: document.modelContext ?? navigator.modelContext; one AbortController
 * per tool name; a name is registered once per page session and never
 * re-registered (definitions read live page state through refs); tools accumulate
 * as the stage advances. Every non-success result is JSON `{ error, hint }` and
 * never upstream error text. Every output is capped at MAX_TOOL_OUTPUT_CHARS.
 */

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
  type ToolMessage,
} from './session.ts';
import { leakyToolDefinition, type LeakReceiver } from './leaky.ts';
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

export type JsonSchemaProperty = {
  type: 'string' | 'number' | 'array';
  enum?: string[];
  description: string;
  items?: { type: 'string'; enum?: string[] };
};

export type JsonSchema = {
  type: 'object';
  additionalProperties: false;
  required: string[];
  properties: Record<string, JsonSchemaProperty>;
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

/** Registration order. Names outside this list register after it, in the order given. */
export const TOOL_REGISTRATION_ORDER = [
  LOAD_CONTEXT_TOOL_NAME,
  SEARCH_PRODUCTS_TOOL_NAME,
  COMPARE_PRODUCTS_TOOL_NAME,
  PREPARE_SELECTION_TOOL_NAME,
  LEAKY_TOOL_NAME,
] as const;

/** Hosts truncate or refuse long tool results; keep every output under this. */
export const MAX_TOOL_OUTPUT_CHARS = 1500;

const MAX_SHORTLIST_IN_OUTPUT = 8;

export const CATALOG_SEARCH_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['category', 'size', 'features', 'colors'],
  properties: {
    category: {
      type: 'string',
      enum: ['jacket'],
      description: 'Garment category to search. Only jacket is listed.',
    },
    size: {
      type: 'string',
      enum: ['XS', 'S', 'M', 'L', 'XL'],
      description: 'Listed catalog size: XS, S, M, L, or XL.',
    },
    features: {
      type: 'array',
      items: { type: 'string', enum: ['waterproof', 'packable'] },
      description: 'Required catalog features. Every listed value must be present on a result.',
    },
    colors: {
      type: 'array',
      items: { type: 'string', enum: ['navy', 'olive'] },
      description: 'Allowed catalog colors. A result matches when it comes in any listed color.',
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
      description: 'Two or three ids from the visible results.',
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
      description: 'One id from the compared products. The shopper opens the listing.',
    },
  },
};

const LOAD_CONTEXT_DESCRIPTION =
  "Read the shopper's private gift notes into this page's vault (Gmail via Arcade when connected, otherwise a demo fixture). Returns recipient, trip, dates, weather, budget, size, features, colors. search_products can accept only size, features, and colors from these.";

const SEARCH_DESCRIPTION =
  'Search this jacket shop. Accepts only category, size, features, and colors; the merchant rejects any other field. Updates the visible catalog.';

const COMPARE_DESCRIPTION =
  'Compare two or three visible jackets by id. The shopper may also pick them by clicking Compare.';

const PREPARE_DESCRIPTION =
  'Prepare one compared jacket for the shopper. Never opens the listing and never navigates; the shopper opens it from the page.';

const SEARCH_REJECTED_HINT = 'search_products accepts only category, size, features, colors.';
const SEARCH_FAILED: ToolMessage = {
  error: 'Catalog search failed.',
  hint: 'Retry search_products with the same four fields.',
};
const COMPARE_HINT = 'Pass two or three ids from the visible results.';
const PREPARE_HINT = 'Pass one id from the compared products.';

function toolError(message: ToolMessage): string {
  return JSON.stringify(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function privateFieldsInSchema(schema: JsonSchema): string[] {
  const blob = JSON.stringify(schema).toLowerCase();
  return PRIVATE_FIELD_NAMES.filter(field => blob.includes(field.toLowerCase()));
}

/**
 * JSON for a tool result, kept under MAX_TOOL_OUTPUT_CHARS. Objects with a
 * `shortlist` array lose trailing entries until they fit and gain `truncated: true`.
 */
export function boundedToolOutput(value: unknown): string {
  const full = JSON.stringify(value);
  if (full.length <= MAX_TOOL_OUTPUT_CHARS || !isRecord(value) || !Array.isArray(value.shortlist)) {
    return full;
  }
  let shortlist = value.shortlist;
  let attempt = full;
  while (shortlist.length > 0) {
    shortlist = shortlist.slice(0, -1);
    attempt = JSON.stringify({ ...value, shortlist, truncated: true });
    if (attempt.length <= MAX_TOOL_OUTPUT_CHARS) break;
  }
  return attempt;
}

export function compactCatalogToolOutput(result: VitrineSearchResult): string {
  const output: Record<string, unknown> = {
    receipt: result.receipt,
    merchantQuery: result.merchantQuery,
    merchant: result.merchant,
  };
  if (result.arcadeRequest) {
    output.arcadeRequest = {
      tool: result.arcadeRequest.tool,
      keywords: result.arcadeRequest.input.keywords,
    };
  }
  output.shortlist = result.shortlist.slice(0, MAX_SHORTLIST_IN_OUTPUT).map(item => ({
    id: item.id,
    name: item.name,
    priceUsd: item.priceUsd,
    merchantName: item.merchantName,
    rating: item.rating,
  }));
  return boundedToolOutput(output);
}

export function catalogSearchToolDefinition(
  execute: ModelContextTool['execute'],
): ModelContextTool {
  return tool({
    name: SEARCH_PRODUCTS_TOOL_NAME,
    title: 'Search jackets (four fields only)',
    description: SEARCH_DESCRIPTION,
    inputSchema: CATALOG_SEARCH_INPUT_SCHEMA,
    // Idempotent catalog query: it changes what the page shows and which tools
    // are registered next, not shop state. The schema, not this hint, is the
    // safety property; true also avoids per-call confirmation friction in ChatGPT.
    readOnly: true,
    untrusted: true,
    execute,
  });
}

function tool(
  definition: Omit<ModelContextTool, 'annotations'> & { readOnly?: boolean; untrusted?: boolean },
): ModelContextTool {
  const { readOnly, untrusted, ...rest } = definition;
  return {
    ...rest,
    annotations: {
      readOnlyHint: readOnly === true,
      untrustedContentHint: untrusted === true,
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

function registrationRank(name: string): number {
  const index = (TOOL_REGISTRATION_ORDER as readonly string[]).indexOf(name);
  return index === -1 ? TOOL_REGISTRATION_ORDER.length : index;
}

/**
 * One AbortController per registered tool name. Names accumulate for the whole
 * page session: a host that ignores AbortSignal still holds the first
 * registration, and each definition reads live state through refs, so a name is
 * never re-registered even when the definition object changes. Only the opt-in
 * leaky demo tool is ever aborted. A host that throws InvalidStateError already
 * holds the name; it is treated as held and reported through onError.
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

      const leaky = held.get(LEAKY_TOOL_NAME);
      if (leaky && !wanted.has(LEAKY_TOOL_NAME)) {
        leaky.abort();
        held.delete(LEAKY_TOOL_NAME);
        dirty = true;
      }

      const ordered = desired
        .map((entry, index) => ({ entry, index }))
        .sort(
          (a, b) =>
            registrationRank(a.entry.name) - registrationRank(b.entry.name) || a.index - b.index,
        )
        .map(({ entry }) => entry);

      for (const entry of ordered) {
        if (held.has(entry.name) || options.signal.aborted) continue;
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
  onRejected?: (input: unknown, error: string) => void;
  onCompare?: (ids: string[]) => void;
  onPrepare?: (id: string) => void;
};

export function loadContextToolOutput(context: PrivateContext): string {
  return boundedToolOutput({
    recipient: context.recipient,
    relationship: context.relationship,
    destination: context.destination,
    dates: context.dates,
    weather: context.weather,
    budgetUsd: context.budgetUsd,
    size: context.size,
    features: context.features,
    colors: context.colors,
    calendarSummary: context.calendarSummary ?? null,
    source: context.source,
    arcadeTool: context.source === 'arcade' ? 'Gmail.SearchEmailsByQuery' : null,
  });
}

/**
 * Tool definitions for a page stage, in registration order. The leaky demo tool
 * (lib/leaky.ts) is appended when handlers.leaky is true; the registry aborts it
 * when the flag turns off. load_context is omitted when no loader is wired so
 * credential-free hosts never advertise it.
 */
export function buildVitrineTools(
  stage: DemoStage,
  handlers: VitrineToolHandlers & { leaky?: boolean; onLeak?: LeakReceiver },
): ModelContextTool[] {
  const search = handlers.search ?? runVitrineSearch;
  const onResult = handlers.onResult ?? (() => undefined);
  const names = new Set(toolsToRegister(stage));
  const tools: ModelContextTool[] = [];

  if (handlers.loadContext && names.has(LOAD_CONTEXT_TOOL_NAME)) {
    tools.push(
      tool({
        name: LOAD_CONTEXT_TOOL_NAME,
        title: "Read the shopper's gift notes",
        description: LOAD_CONTEXT_DESCRIPTION,
        inputSchema: EMPTY_SCHEMA,
        // Reads inbox text into the page vault; changes nothing outside the page.
        readOnly: true,
        // Inbox text is data, not instructions.
        untrusted: true,
        execute: async () => {
          const context = await handlers.loadContext!();
          handlers.onContext?.(context);
          return loadContextToolOutput(context);
        },
      }),
    );
  }

  if (names.has(SEARCH_PRODUCTS_TOOL_NAME)) {
    tools.push(
      catalogSearchToolDefinition(async (input, extras) => {
        const parsed = parsePublicBrief(input);
        if (!parsed.ok) {
          handlers.onRejected?.(input, parsed.error);
          return toolError({ error: parsed.error, hint: SEARCH_REJECTED_HINT });
        }
        let result: VitrineSearchResult;
        try {
          result = await search(parsed.brief, { signal: extras?.signal });
        } catch {
          // Never echo upstream error text into the agent's context.
          return toolError(SEARCH_FAILED);
        }
        onResult(result);
        return compactCatalogToolOutput(result);
      }),
    );
  }

  if (names.has(COMPARE_PRODUCTS_TOOL_NAME)) {
    tools.push(
      tool({
        name: COMPARE_PRODUCTS_TOOL_NAME,
        title: 'Compare visible jackets',
        description: COMPARE_DESCRIPTION,
        inputSchema: COMPARE_SCHEMA,
        // Mutates the selection that gates prepare_selection.
        readOnly: false,
        untrusted: true,
        execute: input => {
          const items = handlers.currentItems?.() ?? [];
          if (items.length === 0) {
            return toolError(searchFirstMessage());
          }
          const ids = parseProductIds(input);
          const selected = compareProducts(items, ids);
          if (typeof selected === 'string') {
            return toolError({ error: selected, hint: COMPARE_HINT });
          }
          handlers.onCompare?.(selected.map(item => item.id));
          return boundedToolOutput({
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
        title: 'Prepare one jacket for the shopper',
        description: PREPARE_DESCRIPTION,
        inputSchema: PREPARE_SCHEMA,
        // Marks the prepared jacket on the page; never navigates.
        readOnly: false,
        untrusted: true,
        execute: input => {
          if ((handlers.comparedIds?.() ?? []).length < 2) {
            return toolError(compareFirstMessage());
          }
          const id = parseProductId(input);
          if (!id) {
            return toolError({ error: 'id is required.', hint: PREPARE_HINT });
          }
          const selected = prepareSelection(handlers.currentItems?.() ?? [], id);
          if (typeof selected === 'string') {
            return toolError({ error: selected, hint: PREPARE_HINT });
          }
          handlers.onPrepare?.(selected.id);
          return boundedToolOutput({
            prepared: {
              id: selected.id,
              name: selected.name,
              priceUsd: selected.priceUsd,
              url: selected.url,
            },
            openedBy: 'shopper',
            needsShopperConfirmation: true,
          });
        },
      }),
    );
  }

  if (handlers.leaky === true) {
    // Demonstration only (spec 6.3.3). Registered at every stage while the
    // checkbox is on; the registry aborts it the moment the flag turns off.
    tools.push(leakyToolDefinition(handlers.onLeak ?? (() => undefined)));
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
