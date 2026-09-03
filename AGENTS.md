# Vitrine project context

Vitrine is a privacy-preserving shopping demo for the OpenAI WebMCP Challenge. Its flagship story is
an agent finding Dad a jacket for an October trip using private context while the merchant receives
only a public catalog brief. The sidebar counts both sides: "Agent knows 9 facts / Shop received 4
fields", derived from the request the server accepted.

## Product rules

- Vitrine is the product name. Passage is retired and must not appear in product copy.
- Vitrine is the shopping site. WebMCP tools read the vault, search, compare, and prepare on this
  page.
- Private context stays with the agent. It must not be sent to `search_products`.
- The public brief may contain `category`, `size`, `features`, and `colors` only.
- The public brief must not contain a recipient, relationship, destination, dates, source records,
  free text, or budget.
- Private budget and trip fit are applied after the catalog returns products.
- The sidebar receipt is the adapter's accepted public brief, echoed by the server, not a
  client-authored summary.
- The Arcade shopping request is `{ keywords }` only. `Walmart.SearchProducts` accepts `max_price`;
  Vitrine never fills it.
- Arcade Gmail and Calendar loaders must not be imported by the shopping module.
- Arcade runs only on the server. The public routes never start an authorization flow and never
  return an authorization URL; the status route returns booleans only.
- The page starts sealed: no vault load and no catalog search on mount. The SSR HTML contains no
  private value (`npm run check:ssr` prints 0).
- The complete judging path works without Arcade. If live shopping is missing, label the recorded
  sample honestly; if Gmail is not connected, label the demo fixture honestly.
- Copy and demos describe only behavior that is running.

## WebMCP boundary

- Register tools from Vitrine's top-level document with `document.modelContext.registerTool`
  (`navigator.modelContext` fallback). No `exposedTo`, no iframes.
- Registration goes through `createToolRegistry` in `lib/webmcp.ts`: one `AbortController` per
  name, each name registered once per page session, `InvalidStateError` tolerated. Tools accumulate
  by page state (`load_context` and `search_products` at browse, then `compare_products`, then
  `prepare_selection`) and are never unregistered mid-session. The only name ever aborted is
  `personalize_for_shopper`, the opt-in leak demonstration.
- Keep `search_products` constrained: no private field names, `additionalProperties: false`,
  enums only, cancellation via AbortSignal, `untrustedContentHint` for merchant content.
- Every tool has a title and both annotation decisions; non-success results are `{ error, hint }`;
  tool output stays under 1,500 characters.
- `prepare_selection` never navigates. Opening the listing is a separate shopper gesture. Write
  "separate gesture", never "the agent cannot".
- `filter_jackets` is a declarative form, Chrome only. Agents may fill it. The shopper submits it.
  Do not set `toolautosubmit`.
- Do not describe WebMCP as a backend protocol or as a replacement for MCP.
- Feature-detect WebMCP; the human demo must work without it.

## Hackathon context

Read these files before changing scope, WebMCP behavior, judging material, or deployment:

- @docs/HACKATHON.md
- @docs/WEBMCP.md
- @docs/ECOSYSTEM.md
- @docs/SOURCES.md

The source order in `docs/SOURCES.md` settles conflicts. Current WebMCP specification and browser
documentation outrank examples, blog posts, and model memory.

SafeWord owns the development workflow under `.safeword/`. Project product knowledge lives under
`.project/`.
