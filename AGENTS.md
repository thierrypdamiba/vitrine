# Passage / Vitrine project context

Passage is a shopper-controlled WebMCP app. It uses private event context to help an agent find a
dress while Vitrine, the merchant boundary, receives only narrow inventory constraints.

## Product rules

- Passage owns every agent-facing WebMCP tool because the ChatGPT in-app browser exposes
  `document.modelContext` to the top-level page, not the merchant iframe.
- Vitrine receives `size` and `length`. It must not receive the occasion, date, venue, dress code,
  reserved colors, free text, or the shopper's budget.
- Passage applies the budget and event-specific judgment after Vitrine returns inventory.
- The Seam displays the merchant adapter's received request, not a client-authored summary.
- Private mode is the product. Leaky mode is clearly labeled as a disclosure-risk simulation.
- The hosted judging path works without Google, Arcade, Shopify, or other third-party credentials.
- Copy and demos describe only behavior that is running.

## Browser constraint

Do not depend on iframe WebMCP registration. Browser testing showed that the ChatGPT in-app browser
provides WebMCP to the top-level page but not to an iframe. Passage tools may call a narrow Vitrine
HTTP adapter.

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
