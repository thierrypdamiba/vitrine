# WebMCP implementation context

This is the technical operating contract for Passage. It is based on the WebMCP Draft Community
Group Report dated August 26, 2026, its source repository, and current Chrome documentation. WebMCP
is experimental, is not yet a W3C Standard, and can change during the project.

## Why Passage fits WebMCP

WebMCP is designed for a person, a page, and an agent to cooperate in the same visible browser
experience. The WebMCP repository's e-commerce example already uses the same useful separation as
Passage: the site returns products using narrow catalog parameters, the agent applies the person's
context, and another tool updates the visible product UI.

Passage makes that pattern the product. Private context stays at the shopper-controlled top level;
the merchant adapter receives the minimum catalog constraints; the result and disclosure boundary
remain visible to the person.

## API and lifecycle contract

- Use the current imperative surface: `document.modelContext.registerTool(...)`.
- Register agent-facing tools from the top-level Passage document.
- Feature-detect `document.modelContext`; the human UI must still work when WebMCP is unavailable.
- Give every tool a specific name, short description, explicit JSON Schema, required fields, and
  structured result.
- Tie registration to the page lifecycle and clean it up with an `AbortController` when appropriate.
- Keep tool names, descriptions, parameters, and outputs concise. Chrome currently recommends no
  more than 30 characters for names, 500 for tool descriptions, 150 for parameter descriptions,
  and 1,500 for one tool output.
- Apply `readOnlyHint` only when the tool truly has no state-changing effect. Mark merchant or other
  external content with `untrustedContentHint` when it can influence later agent behavior.
- Do not set `exposedTo` unless a reviewed use case requires a specific trusted origin.
- Do not disable origin isolation. The `tools` Permissions Policy defaults to `self`; cross-origin
  iframe registration requires explicit delegation with `allow="tools"`.

## Privacy and security contract

The draft specification names privacy leakage through over-parameterization as a first-class risk.
Passage treats the merchant schema itself as the privacy boundary:

- Vitrine input permits `size` and `length` only.
- It does not contain occasion, event date, venue, dress code, reserved colors, free text, or budget.
- Passage filters the returned inventory against budget and event context after the merchant call.
- Reject or strip unexpected merchant fields; do not merely hide them in the UI.
- Treat product titles, descriptions, URLs, and other merchant content as untrusted data, never as
  agent instructions.
- Bound free-text lengths anywhere private context is collected.
- Avoid consequential actions in the submission path. If checkout is later added, require visible
  user confirmation and a separate security review.

The Seam is boundary evidence. It must render the Vitrine adapter's received payload and distinguish
absent fields from fields whose value happens to be empty.

## Runtime compatibility

The WebMCP repository reports support in ChatGPT Desktop, an origin trial in Chrome 149, an Edge 150
origin trial, and experimental Brave support. Challenge judges are instructed to use ChatGPT's
in-app browser or Chrome with WebMCP enabled.

Local Passage probing on August 26 found `document.modelContext` in the ChatGPT top-level page but
not in the embedded merchant iframe. This is project evidence, not a claim about every client. The
submission therefore uses top-level Passage tools and a narrow HTTP merchant adapter instead of
depending on iframe tool discovery.

For local Chrome development, enable `chrome://flags/#enable-webmcp-testing` and relaunch Chrome.

## Test contract

Deterministic tests must cover:

- tool registration and cleanup;
- valid and invalid arguments against the declared schema;
- the exact Vitrine request payload, including forbidden-field absence;
- structured results, UI state, cancellation, and clear errors;
- private and leaky paths deriving their Seam evidence from received requests.

Agent evaluations must cover:

- selecting the intended tool from realistic shopper prompts;
- producing the right structured arguments without adding private context;
- using the returned inventory to continue the journey;
- avoiding instructions embedded in merchant content.

Manual checks must use the Chrome DevTools Application → WebMCP panel or the Model Context Tool
Inspector, plus the ChatGPT in-app browser. Record the tool list, exact inputs, outputs, errors, and
visible UI effects in testing notes.

## Primary technical sources

- [WebMCP draft specification](https://webmachinelearning.github.io/webmcp/)
- [WebMCP source repository](https://github.com/webmachinelearning/webmcp)
- [Implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)
- [Security and privacy questionnaire](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md)
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome WebMCP evaluations](https://developer.chrome.com/docs/ai/webmcp/evals)
- [Chrome tool security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome agent security guidance](https://developer.chrome.com/docs/agents/security)
- [Chrome DevTools WebMCP panel](https://developer.chrome.com/docs/devtools/application/webmcp)
