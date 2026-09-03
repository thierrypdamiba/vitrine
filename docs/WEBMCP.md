# WebMCP implementation context

This is the technical operating contract for Vitrine. It is based on the WebMCP Draft Community
Group Report dated August 26, 2026, its source repository, and current Chrome documentation. WebMCP
is experimental, is not yet a W3C Standard, and can change during the project.

## Why Vitrine fits WebMCP

WebMCP is designed for a person, a page, and an agent to cooperate in the same visible browser
experience. The useful split is already in the spec's shopping example: the merchant receives narrow
catalog parameters, the agent keeps the person's context, and later tools update the visible UI.

Vitrine makes that split the product. Private context stays in the vault. The merchant adapter
receives the public brief. The shopper shares that brief. Product cards and the receipt stay free of
private values.

## API and lifecycle contract

- Use the current imperative surface: `document.modelContext.registerTool(...)`.
- Register agent-facing tools from the top-level Vitrine document.
- Feature-detect `document.modelContext`; the human UI must still work when WebMCP is unavailable.
- Give every tool a specific name, short description, explicit JSON Schema, required fields, and
  structured result.
- Tie registration to workflow stage and clean it up with an `AbortController`.
- Keep tool names, descriptions, parameters, and outputs concise. Chrome currently recommends no
  more than 30 characters for names, 500 for tool descriptions, 150 for parameter descriptions,
  and 1,500 for one tool output.
- Apply `readOnlyHint` only when the tool truly has no state-changing effect. Mark merchant content
  with `untrustedContentHint`.
- Use a declarative `share_brief` form so an agent can fill the public brief and the shopper submits
  it. Do not set `toolautosubmit`.
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
- Avoid consequential actions in the submission path. Prepare a selection, then require the shopper
  to open the listing.

The vault/merchant split is boundary evidence. The merchant panel must render the adapter's received
payload and must not receive private context as props.

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

Agent evaluations must cover:

- selecting `load_context`, `propose_brief`, then `search_products` from a private shopping prompt;
- producing the public brief without adding private context;
- using returned products to compare and prepare a selection.
