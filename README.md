# Vitrine

A jacket shop that never learns why you are shopping.

The agent reads the shopper's gift notes (recipient, relationship, destination, dates, weather,
size, features, colors, budget) and the shop's `search_products` tool accepts only `category`,
`size`, `features`, and `colors`. The sidebar counts both sides from what the server actually
received: **Agent knows 9 facts / Shop received 4 fields.** There is no field for the occasion,
so the occasion cannot be sent, and the merchant adapter returns HTTP 400 for any extra key before
any inventory is searched.

New project created during the Submission Period: first commit 2026-08-26, history unmodified.

## WebMCP surface

Registered on `document.modelContext` (with a `navigator.modelContext` fallback) from
`lib/webmcp.ts`. Titles and annotations below are the ones the code registers.

| name                      | title                                           | readOnlyHint | untrustedContentHint | appears at stage                   | host                               |
| ------------------------- | ----------------------------------------------- | ------------ | -------------------- | ---------------------------------- | ---------------------------------- |
| `load_context`            | Read the shopper's gift notes                   | true         | true                 | browse (page load)                 | ChatGPT + Chrome                   |
| `search_products`         | Search jackets (four fields only)               | true         | true                 | browse (page load)                 | ChatGPT + Chrome                   |
| `compare_products`        | Compare visible jackets                         | false        | true                 | results (after a search returns)   | ChatGPT + Chrome                   |
| `prepare_selection`       | Prepare one jacket for the shopper              | false        | true                 | compared (after two ids compared)  | ChatGPT + Chrome                   |
| `filter_jackets`          | declarative `<form toolname>` (no annotations)  | n/a          | n/a                  | always                             | Chrome only                        |
| `personalize_for_shopper` | Tell the shop about the shopper (demonstration) | false        | false                | only while the Leak demo box is on | ChatGPT + Chrome (may be declined) |

- `search_products` is `readOnlyHint: true` on purpose: it is an idempotent catalog query that
  changes what the page shows and which tools register next, not shop state. The schema, not the
  hint, is the safety property.
- `filter_jackets` is the shop's own filter form carrying `toolname` / `tooldescription`. It is a
  Chrome-only extra: OpenAI's documentation says "Tools defined through HTML form attributes aren't
  available as site tools." The form still works as a normal form everywhere.
- `personalize_for_shopper` exists only while the checkbox is on; it is a
  demonstration, not product behavior; ChatGPT's safety review may decline it. It is the
  over-parameterized tool from WebMCP draft section 6.3.3, reproduced so a judge can watch the same
  agent volunteer everything the moment a schema asks. Nothing it receives leaves the page.

## Lifecycle

- Feature detection: `document.modelContext ?? navigator.modelContext`. Without either, the page is
  a normal shop and the sidebar says so.
- A per-tool `AbortController` registry (`createToolRegistry` in `lib/webmcp.ts`) registers each
  name once per page session. Tools accumulate as the page state advances
  (`browse -> results -> compared -> prepared`) and are never unregistered mid-session, so a host
  that ignores `AbortSignal` cannot break anything; `InvalidStateError` on a re-registration is
  tolerated. Definitions read live page state through refs.
- The sidebar strip "Agent can call now" is driven by the host's `toolchange` event and
  `getTools()` when the host exposes them, otherwise by the page registry.
- `REGISTER_ALL_AT_MOUNT` in `lib/session.ts` switches to registering all four tools at load with
  state-aware `{ error, hint }` results, if the hosted check shows ChatGPT does not surface tools
  registered after page load.
- No `exposedTo`, no iframes. ChatGPT does not discover iframe tools; the privacy boundary is the
  server adapter, not a frame.
- Every tool has a title, a description under 500 characters, property descriptions under 150,
  and a 1,500-character output budget (`MAX_TOOL_OUTPUT_CHARS`).
- Host compatibility: if `modelContext` is absent at mount the page polls every 500 ms for up to
  10 s before settling as a plain shop; every call into the host (`registerTool`, `getTools`,
  `addEventListener`) is wrapped so a throwing host never blocks registration; and `execute`
  accepts its arguments as an object or as a JSON string.

## Privacy boundary

The WebMCP draft, section 6.3.3 "Privacy Leakage Through Over-Parameterization": "Sites can design
highly parameterized WebMCP tools to extract sensitive user data that agents provide from
personalization context," creating a "personalization-to-fingerprinting pipeline." Vitrine inverts
it. The guarantees are layered:

1. `search_products` schema: enums only, `additionalProperties: false`, four required keys.
2. `execute` re-validates with `parsePublicBrief` before any request leaves the page.
3. Server: `POST /api/catalog/search` runs `parsePublicBrief` again and returns 400
   `Merchant rejected unexpected fields: ...` before any search runs. The receipt in the sidebar is
   that accepted body, echoed back by the server.
4. The Arcade keyword string is built only from validated enum values
   (`XL waterproof packable navy olive jacket`).
5. `Walmart.SearchProducts` accepts `max_price`; Vitrine never fills it. The budget ranks results on
   the shopper's side after they return.
6. Unit tests: "no private field in any tool schema" (`lib/webmcp.test.ts`) and "sends only
   keywords to Arcade" (`lib/shopping.test.ts`).

The sidebar's **Try to leak** button sends `destination` and `budgetUsd` on purpose and prints the
adapter's literal 400.

## Shopper gesture

`prepare_selection` never navigates; opening is a separate shopper gesture. WebMCP issue #288
observed an in-app browser clicking a page's own Approve button, so the page does not rely on a
button an agent could press: the listing opens on a 700 ms press-and-hold.

## Arcade

Arcade runs only on the server. The API key never reaches the browser.

- `load_context` is backed by `POST /api/arcade/context`, which calls
  `Gmail.SearchEmailsByQuery` with `{ query, result_detail: 'full', max_results: 5 }` and,
  optionally, `GoogleCalendar.ListEvents`. The parsed facts are the vault.
- `search_products` runs through `Walmart.SearchProducts` / `GoogleShopping.SearchProducts` with
  input `{ keywords }` and nothing else. The sidebar prints the exact Arcade call.
- The Arcade routes are same-origin-gated and rate-limited, and never return an authorization URL.
  `GET /api/arcade/status` returns four booleans and nothing else.
- The hosted demo runs on one demo Google account owned by the author; the fixture is embedded in
  the client bundle as the credential-free fallback, and the recorded sample fills the shop when
  live search is unavailable. Both are labeled on the page.
- Why the split: Chrome's guidance is that "The most effective agentic applications use both MCP
  and WebMCP." WebMCP is the tab-bound surface the shopper sees; Arcade is the server-side MCP
  context provider.

Details in [docs/ARCADE.md](docs/ARCADE.md).

## Run it

Requires Node 22.13+.

```sh
npm install
npm run dev
```

```sh
npm test            # unit tests, including "no private field in any tool schema"
npm run test:bdd    # Gherkin scenarios in features/
npm run test:live   # against a running dev server with .env.local
npm run check:ssr   # prints 0: no private value in the SSR HTML
npm run test:evals  # webmcp-evals smoke against a running dev server; see evals/README.md
```

## Test the WebMCP tools

Clients used: ChatGPT's in-app browser (desktop app, Plus/Pro plan, GPT-5.6 Sol or Terra, not
Luna, site tools enabled under Settings > Browser > Permissions), and Chrome 149+ with
`chrome://flags/#enable-webmcp-testing` enabled.

1. Open the live URL. The sidebar reads "Agent knows 0 facts / Shop received 0 fields" and the
   vault is sealed. The grid shows the storefront's own default query (size M, live Walmart or
   Google Shopping via Arcade when the server has a key, otherwise the labeled recorded sample);
   the header says "storefront default, no shopper request yet" and the seam stays at 0 / 0.
2. Click **Copy agent prompt** and paste it into the agent. The prompt contains no private fact.
3. The agent calls `load_context`. The vault fills, labeled "from Arcade Gmail" or "demo fixture".
4. The agent calls `search_products` with only `category`, `size`, `features`, `colors`. Read
   **Shop received**: the accepted body, `200 · accepted by the merchant adapter`, and the exact
   Arcade call beside it.
5. Click **Try to leak** to see the 400.
6. The agent calls `compare_products`, then `prepare_selection`. Open the listing yourself: on live
   results that is a 700 ms press-and-hold; the sample catalog has no external listing, so the
   "Your pick" panel is the listing.

If the agent declines `load_context`, use the fallback prompt: "He is XL, likes navy or olive,
needs waterproof and packable."

## Hosting

Deploy from ChatGPT web or desktop ("Deploy this project with Sites"); the project link is in
`.openai/hosting.json`. Add the secrets from `.env.example` in the Site's settings and set the
sharing audience to **Anyone on the internet**. Owner-only or workspace-only Sites fail judging.

## What this shop may receive

`category`, `size`, `features`, `colors`. Nothing else.
