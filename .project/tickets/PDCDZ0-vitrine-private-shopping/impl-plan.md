# Impl Plan: Vitrine private shopping

**Status:** planned
**Planned on:** 2026-08-27

> Superseded on 2026-09-03 where it disagrees with `.project/architecture.md` v2.0: the tool is
> named `search_products` (not `search_catalog`), `load_context` reads the vault from Gmail via
> Arcade on the server, there is no guided-demo button or consent step, and the page starts sealed
> with no search on load. The build order and decisions below are kept as the dated record.

## Approach

Riskiest assumption: a judge can tell the privacy claim from the merchant adapter's accepted request, not from copy. The cheapest proof is `A private field is rejected at the merchant boundary` plus `The Seam shows the merchant receipt`. If extra fields are accepted or the Seam is client-authored, the product is a storefront with a caption.

Each scenario's primary proof is the Cucumber lane at the actor-facing command or HTTP boundary named in the `When`. Unit tests cover the schema matrix and ranking edges. One wiring test calls the App Router `POST` handler. WebMCP registration is proven with a fake `document.modelContext` plus the real tool schema object the page registers. ChatGPT and flagged Chrome share that schema; there is no second iframe path.

Build order, load-bearing slice first:

1. Domain `parsePublicBrief` and `searchInventory` so a private field cannot be represented and the fixture brief returns jackets.
2. `rankForTrip` so the shortlist leads with an under-budget waterproof packable jacket.
3. `POST /api/catalog/search` returning `{ receipt, items }` from the parsed brief.
4. Shared `runVitrineSearch` used by the guided button and the tool execute handler.
5. `search_catalog` tool schema and AbortSignal registration.
6. Page: fixture, Arcade-not-connected copy, results, Seam from `receipt`.
7. Cucumber steps for all seven scenarios.
8. Layout title Vitrine.

Surface proof: web app and hosted Site via command, HTTP, and page copy. ChatGPT in-app browser and Chrome WebMCP testing via the same top-level schema and registration helper.

## Decisions

### Implementation Inspiration

<!-- prettier-ignore -->
| Reference | Checked on | Source version | Target version | Evidence of fit | Principle to borrow | Mismatch / license / security boundary |
| --- | --- | --- | --- | --- | --- | --- |
| https://developer.chrome.com/docs/ai/webmcp/imperative-api | 2026-08-27 | n/a | n/a | Chrome documents registerTool, AbortSignal cleanup, JSON-string executeTool, and annotations. This page is the judging client. | Register one catalog tool on the top-level document and retract it with AbortSignal. | Docs are CC-BY Chrome. Do not copy demo pizza or todo tools. Do not use navigator.modelContext. |
| https://webmachinelearning.github.io/webmcp/ | 2026-08-27 | n/a | n/a | Draft section 6.3.3 is the over-parameterization attack this product inverts. Maya's get-dresses tool already keeps occasion off the store. | Merchant input is an allowlist with no private-field names. | Draft, not a standard. Do not implement service-worker grocery checkout. |
| https://github.com/vercel/shop/pull/498 | 2026-08-27 | n/a | n/a | Bounded tool outputs, AbortSignal cleanup, no cart IDs in results. Later replaced by Shopify tools, which is the existing-concept trap. | Keep tool output small and structured. Do not ship Shopify's ten storefront tools. | MIT-style application code. Read as evidence, do not vendor the PR. |

**Decision impact:** retained: the Seam still renders the adapter's accepted request rather than a client summary
**Decision informed:** Merchant receipt is server-derived

### Recorded Decisions

| Decision | Choice | Alternatives considered | Rejected because |
| --- | --- | --- | --- |
| Merchant receipt is server-derived | HTTP POST /api/catalog/search validates the public brief and returns that exact object as receipt https://developer.chrome.com/docs/ai/webmcp/imperative-api | Client-authored Seam, in-memory filter with no HTTP hop | Impact is scored on what is demonstrated. A panel we wrote is not a merchant receipt. |
| Vitrine is a single top-level page | document.modelContext.registerTool on the Vitrine document, merchant boundary as HTTP | Passage iframe plus exposedTo | ChatGPT exposes tools at the top-level page. Cross-origin iframe tools are off the judging path. Passage is a retired name. |
| Arcade stays off the judging path | Deterministic Dad-Scotland fixture and copy that says Arcade is not connected | Live Arcade Gmail OAuth on first run | Judges are not required to authenticate. The FAQ forbids implying a live inbox. |

## Design alignment

| Principle | Consequence | Proof | Conflict |
| --- | --- | --- | --- |
| Disclose the minimum | Merchant request type has only category, size, features, and colors | .project/architecture.md | |
| Show what actually crossed | Seam reads receipt from the adapter response | .project/architecture.md | |
| Keep the judging path reliable | Guided run uses the fixture and does not call Arcade | .project/architecture.md | |
| Treat the schema as the boundary | Extra keys including destination fail parsePublicBrief | features/vitrine-private-shopping.feature | |
| Keep people in the shared interface | Guided button and search_catalog execute the same runVitrineSearch | .project/architecture.md | |

Existing architecture records honored: Vitrine is the single top-level product, the merchant receipt is server-derived, Arcade is optional context infrastructure.

## Known deviations

skip: no deviations planned

## Doc impact

AGENTS.md already names Vitrine, the public brief, the Seam, and Arcade-as-optional. This pass updates `app/layout.tsx` title and the live page copy. Judge-facing story in docs/HACKATHON.md still says Passage in places and should match the jacket receipt after the page exists.

## Assessment triggers

- Split the merchant to its own origin when a real retailer replaces deterministic inventory.
- Add per-user Arcade authorization before treating this as a multi-shopper product.
- Add visible confirmation and a separate security review before checkout.
