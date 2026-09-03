# Vitrine project context

Vitrine is a privacy-preserving shopping demo for the OpenAI WebMCP Challenge. Its flagship story is
an agent finding Dad a jacket for an October trip using private context while the merchant receives
only a public catalog brief.

## Product rules

- Vitrine is the product name. Passage is retired and must not appear in product copy.
- Vitrine is the shopping site. WebMCP tools search, compare, and prepare on this page.
- Private context stays with the agent. It must not be sent to `search_products`.
- The public brief may contain `category`, `size`, `features`, and `colors` only.
- The public brief must not contain a recipient, relationship, destination, dates, source records,
  free text, or budget.
- Private budget and trip fit are applied after the catalog returns products.
- The sidebar receipt is the adapter's accepted public brief, not a client-authored summary.
- Arcade Gmail and Calendar loaders must not be imported by the shopping module.
- The complete judging path works without Arcade. If live shopping is missing, label the recorded
  sample honestly.
- Copy and demos describe only behavior that is running.

## WebMCP boundary

- Register tools from Vitrine's top-level document with the imperative `document.modelContext` API.
- Keep `search_products` constrained: no private field names, `additionalProperties: false`,
  cancellation via AbortSignal, and `untrustedContentHint` for merchant content.
- Expose tools by catalog state: `search_products` on the shop, then `compare_products`, then
  `prepare_selection`. The shopper confirms before opening a listing.
- `filter_jackets` is a declarative form. Agents may fill it. The shopper can submit it.
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
