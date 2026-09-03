# WebMCP implementation context

This is the technical operating contract for Vitrine. It is based on the WebMCP Draft Community
Group Report dated August 26, 2026, its source repository, and current Chrome documentation. WebMCP
is experimental, is not yet a W3C Standard, and can change during the project.

## Why Vitrine fits WebMCP

WebMCP is designed for a person, a page, and an agent to cooperate in the same visible browser
experience. The useful split is already in the spec's shopping example: the merchant receives narrow
catalog parameters, the agent keeps the person's context, and later tools update the visible UI.

Vitrine makes that split the product. Private context stays in the vault, read by the agent through
`load_context`. The merchant adapter receives the public brief and nothing else; its schema has no
room for anything else. Product cards and the receipt stay free of private values.

## API and lifecycle contract

- Use the current imperative surface: `document.modelContext.registerTool(...)`, with a
  `navigator.modelContext` fallback for hosts that only expose the alias.
- Register agent-facing tools from the top-level Vitrine document.
- Feature-detect `document.modelContext`; the human UI must still work when WebMCP is unavailable.
- Give every tool a title, a specific name, a short description, explicit JSON Schema, required
  fields, and a structured result; non-success results are `{ error, hint }`.
- Register through the per-tool `AbortController` registry (`createToolRegistry`): each name once
  per page session, tools accumulate by stage and are never unregistered mid-session, an
  `InvalidStateError` re-registration is tolerated. Only the opt-in `personalize_for_shopper`
  demonstration is ever aborted.
- Keep tool names, descriptions, parameters, and outputs concise. Chrome currently recommends no
  more than 30 characters for names, 500 for tool descriptions, 150 for parameter descriptions,
  and 1,500 for one tool output; `MAX_TOOL_OUTPUT_CHARS` enforces the last one.
- `readOnlyHint` decisions are pinned by tests: `load_context` and `search_products` true (the
  search is an idempotent catalog query; the schema, not the hint, is the safety property),
  `compare_products` and `prepare_selection` false. Mark merchant content with
  `untrustedContentHint`.
- The shop's own filter form carries `toolname` / `tooldescription` as `filter_jackets`, a
  Chrome-only extra; ChatGPT's browser does not expose form tools. Do not set `toolautosubmit`.
- Do not set `exposedTo` unless a reviewed use case requires a specific trusted origin.
- Do not disable origin isolation. The `tools` Permissions Policy defaults to `self`; cross-origin
  iframe registration requires explicit delegation with `allow="tools"`.

## Privacy and security contract

The draft specification names privacy leakage through over-parameterization as a first-class risk.
Vitrine treats the merchant schema itself as the privacy boundary:

- `search_products` input permits `category`, `size`, `features`, and `colors` only.
- It does not contain recipient, destination, dates, budget, or source records.
- The vault ranks returned products against budget after the merchant call.
- Reject unexpected merchant fields; do not merely hide them in the UI.
- Treat product titles, descriptions, URLs, and other merchant content as untrusted data, never as
  agent instructions.
- Bound free-text lengths anywhere private context is collected.
- Avoid consequential actions in the submission path. `prepare_selection` never navigates; opening
  the listing is a separate shopper gesture.
- The Arcade shopping input is `{ keywords }` only. `Walmart.SearchProducts` accepts `max_price`;
  Vitrine never fills it.

The vault/merchant split is boundary evidence. The sidebar's "Shop received" block renders the
adapter's accepted payload as echoed by the server, plus the exact Arcade call; "Try to leak" sends
private fields on purpose and prints the adapter's 400. The seam counters are computed from those
responses, never from client-authored state.

## Runtime compatibility

The WebMCP repository reports support in ChatGPT Desktop, an origin trial in Chrome 149, an Edge 150
origin trial, and experimental Brave support. Challenge judges are instructed to use ChatGPT's
in-app browser or Chrome with WebMCP enabled.

Local probing on August 26 found `document.modelContext` in the ChatGPT top-level page but not in an
embedded merchant iframe. This is project evidence, not a claim about every client. The submission
therefore uses top-level Vitrine tools and a narrow HTTP merchant adapter instead of depending on
iframe tool discovery.

For local Chrome development, enable `chrome://flags/#enable-webmcp-testing` and relaunch Chrome.

## Test contract

Deterministic tests must cover:

- tool registration and cleanup;
- valid and invalid arguments against the declared schema;
- the exact merchant request payload, including forbidden-field absence;
- structured results, UI state, cancellation, and clear errors;
- merchant copy that does not contain vault markers;
- stage recovery when search, compare, or prepare run too early.

Agent evaluations (`evals/*.json`, webmcp-evals format; see `evals/README.md`) must cover:

- calling `load_context` first, then `search_products` with exactly the four public-brief keys,
  from a prompt that contains no private fact;
- the same expected calls from the leak-demo prompt, so the strict search carries four keys even
  when an over-parameterized tool is present;
- no expected argument containing a private value.
