# Devpost submission

Paste-ready material for the WebMCP Challenge entry. Every sentence here must be checkable against
the deployed page the same night. Bracketed `[if shipped]` conditionals were struck at integration
(2026-09-03 12:15 PT); everything below shipped except the seeded Calendar event.

## Status

| Required                                                   | State                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| Public repository with source, assets, setup               | https://github.com/thierrypdamiba/vitrine (public, MIT)      |
| Open-source license visible at repo root                   | `LICENSE` (MIT)                                              |
| Testing instructions incl. agents/clients used             | below, `JUDGE.md`, and `README.md` → "Test the WebMCP tools" |
| Working live URL (ChatGPT in-app browser or Chrome + flag) | deploy from ChatGPT Sites, audience "Anyone on the internet" |
| YouTube demo, under 3 minutes, with audio                  | shot list below                                              |
| Text description                                           | below                                                        |

Live URL: _____

Video URL: _____

Submitted commit (`git rev-parse HEAD`): _____

## Deadline

Devpost posted "Deadline Extension | 12 more hours" on Sep 3 (~10:20am PT, ChatGPT outage):
**submissions close Sep 4, 2026, 1:00am PT.** The rules text still prints Sep 3 1:00pm PT, so
mark the entry **Submitted** (green, not draft) as early as possible; edits stay open until the
form closes. A saved draft is not a submission.

## Hosted status

Recorded from the hosted page's browser console with
`fetch('/api/arcade/status').then(r=>r.json())` (same-origin, passes the request guard).

- [WI-0] `____-__-__ __:__ PT` — `{ ... }` — `configured: true` means Sites forwards
  `process.env`; `configured: false` means the hosted page runs the labeled fixture and recorded
  sample, and every Arcade narration below is gated on that.
- [WI-A2] Walmart probe `XL waterproof packable navy olive jacket` (2026-09-03 ~12:10 PT): 20
  rows, 6 clean men's rows; adapter order decided: `[Walmart, GoogleShopping]`, threshold 3.
- [WI-OWNER] Calendar: `GoogleCalendar.ListEvents` authorized **yes** (local `/api/arcade/status`
  at 12:12 PT: `{"configured":true,"gmailRead":true,"calendar":true,"shopping":true}`);
  `calendarSummary` starts with `Scotland trip with Dad`: **no** (the demo calendar has no event
  in the next 180 days; the vault shows nine facts, no Calendar row, until the owner creates
  the event `Scotland trip with Dad`, Oct 10–17 2026, location Edinburgh).

## Verified locally at integration (2026-09-03 14:00 PT, main at fe23ea9, dev server on :3001)

- `curl -s localhost:3001 | grep -c -w -E 'Dad|Scotland|October|250'` → `0`.
- `POST /api/catalog/search` with the XL brief → 200, receipt keys exactly
  `category, size, features, colors`, `merchant: walmart`, `arcadeRequest`
  `{"tool":"Walmart.SearchProducts","input":{"keywords":"XL waterproof packable navy olive jacket"}}`,
  5 items, all 5 with an `imageUrl` on walmartimages.com and a walmart.com `url`; no private
  marker and no secret-like string in the body.
- `POST /api/catalog/search` with the storefront default (size M) → 200,
  `merchant: google_shopping`, 8 items, swatch cards (no photo, Google Shopping search links).
- The same XL body plus `destination` → `400 {"error":"Merchant rejected unexpected fields: destination"}`.
- The XL body with `features` repeated 5,000 times →
  `400 {"error":"features must be waterproof and packable values"}`; with
  `["waterproof","waterproof"]` → 200 and the receipt shows `["waterproof"]`.
- `GET /api/arcade/status` with `Sec-Fetch-Site: same-origin` or a same-host `Origin` →
  `{"configured":true,"gmailRead":true,"calendar":true,"shopping":true}`; with
  `Sec-Fetch-Site: cross-site` or no header → 403.
- `npm test` 132/132 (42 suites), `npm run test:bdd` 8 scenarios / 24 steps, lint, format,
  `tsc --noEmit`, build, `check:ssr` 0.
- `POST /api/arcade/context` (same-origin) → 200, `context.source: "arcade"`, no URL in the body,
  `calendarSummary` absent (no event on the demo calendar); without the header → 403.
- `npm run test:evals` (webmcp-evals 0.0.4 smoke, Puppeteer Chrome, no LLM) → 2/2 steps PASS:
  `load_context` returned `source: "arcade"`, `search_products` returned the four-key receipt and
  the Walmart Arcade request (captured in `evals/README.md`).

## Verified on host

Written by integration from the ~16:30 check in ChatGPT desktop (GPT-5.6 Sol, site tools on),
running the agent prompt on the owner-only deploy:

- `__:__` "Available site tools" on load shows: `__________`
- `__:__` after `search_products`, `compare_products` callable in the same conversation: `yes/no`
  → `REGISTER_ALL_AT_MOUNT` = `__________`
- `__:__` confirmation prompts on `load_context` / `search_products`: `__________`
- `__:__` the host clicked a page button by itself: `yes/no`
- `__:__` leak prompt with `personalize_for_shopper`: `volunteered / refused / not run`

## Text description

**Vitrine — a jacket shop that never learns why you are shopping.**

**Why WebMCP fits.** An agent that shops for you knows things a merchant should not: who the gift
is for, where they are going, when, and what you can spend. The agent belongs to the person: it
translates those private reasons into neutral catalog attributes on the person's side, and the shop
only publishes a schema. Through a search box that context leaks by default, and the WebMCP draft
names the failure mode in §6.3.3, "Privacy Leakage Through Over-Parameterization": a site can
publish a tool that asks for age, location, and history "for personalization," and the agent
helpfully fills it in. WebMCP is the first surface where a merchant can say exactly what it
accepts, in a typed schema, on the page the shopper is looking at. Vitrine's `search_products`
accepts `category`, `size`, `features`, `colors` (enums, `additionalProperties: false`). There is
no field for the occasion, so the occasion cannot be sent, and the server returns HTTP 400 for any
extra key before any inventory is searched. Several entries keep private context with the agent;
Vitrine makes the merchant side of that line inspectable: a schema that cannot carry the reason
and a receipt of what the merchant received.

**How it creates a better user experience.** The shop is a real storefront: with Arcade
configured the grid shows live inventory from the shop's own default query before the agent does
anything, labeled "storefront default, no shopper request yet". The shop still starts sealed: the
sidebar reads "Agent knows 0 facts / Shop received 0 fields" because only shopper requests count.
The agent calls `load_context` and the vault fills with nine facts read from the shopper's Gmail
through Arcade on the server (labeled "from Arcade Gmail"; a labeled demo fixture when Arcade is
not connected). The agent calls `search_products`; the grid narrows to live Walmart rows with real
product photos and walmart.com links, and the sidebar prints the literal request body the merchant
adapter accepted,
"200 · accepted," and the counter flips to "9 / 4." Beside it is the exact Arcade call the adapter
made — `{"tool":"Walmart.SearchProducts","input":{"keywords":"XL waterproof packable navy olive jacket"}}`
— and one sentence: Walmart's tool accepts `max_price`; Vitrine leaves it empty, and the $250
ceiling ranks results on the shopper's side after they return. One click on "Try to leak" sends
destination and budget on purpose and prints the adapter's 400. Nothing on that screen is the
agent's word for it; every number is derived from a request the server received.

**What people and agents do together that was difficult before.** The agent reads the shopper's
private notes (Gmail via Arcade), searches the shop through a four-field schema, and compares two
or three visible jackets; the shopper can pick items to compare by hand, and human-picked
selections gate the agent's `prepare_selection`. `prepare_selection` never navigates: opening the
listing is a separate held gesture on the page, because a filed WebMCP issue (#288) shows an
in-app browser clicking a page's own Approve button. Tools appear as the page state changes, and
the sidebar lists what the agent can call right now. An opt-in "Leak demo" checkbox
registers `personalize_for_shopper`, the spec's over-parameterized tool, so a judge can watch the
same agent and prompt volunteer everything the moment a schema asks, while the strict request
still carries four keys. Before WebMCP, an agent shopping on your behalf either typed your life
into a search box or could not act on the page at all.

**How WebMCP was implemented.** Four imperative tools on `document.modelContext.registerTool`
(with a `navigator.modelContext` fallback), registered through a per-tool `AbortController`
registry that registers each name once per session, tolerates `InvalidStateError`, and drives the
sidebar strip from `toolchange` + `getTools()` where the host supports them: `load_context`
(readOnlyHint true, untrustedContentHint true), `search_products` (readOnlyHint true; the schema,
not the hint, is the safety property), `compare_products` and `prepare_selection` (readOnlyHint
false, untrustedContentHint true). Every tool has a title, state-aware `{error, hint}` results,
and a 1,500-character output budget; `execute` accepts its arguments as an object or as a JSON
string, every call into the host is guarded so a throwing host never blocks registration, and a
host that attaches `modelContext` after first paint is polled for up to 10 s. The shop's filter
form also carries `toolname`/`toolparamdescription` as a Chrome-only enhancement (ChatGPT's
browser does not expose form tools). Server side, `parsePublicBrief` re-validates and rejects
unknown keys, caps the two enum arrays at their allowed set (`maxItems: 2`, `uniqueItems: true`
in the schema) and collapses repeats; the Arcade keyword string is built only from validated enum
values; Walmart's `max_price` is never sent;
unit tests assert no private field appears in any tool schema and that the Arcade input object has
exactly one key. Arcade runs only on the server (Gmail.SearchEmailsByQuery,
GoogleCalendar.ListEvents, Walmart.SearchProducts / GoogleShopping.SearchProducts); the API key
never reaches the browser, the routes are same-origin-gated and rate-limited, and the judging path
needs no credentials. Evals ship in the webmcp-evals format. Stack: Next.js 16 on vinext, React
19, TypeScript, Arcade SDK; node:test and Cucumber. New project created during the Submission
Period: first commit 2026-08-26, history unmodified.

## Testing instructions (private Devpost field)

No login. Open the live URL in the ChatGPT desktop app's in-app browser (Plus/Pro/Business plan;
not Enterprise/Edu; model GPT-5.6 Sol or Terra, not Luna; Settings > Browser > Permissions >
Enable site tools) or in Chrome 149+ with `chrome://flags/#enable-webmcp-testing`.

1. The page loads sealed: "Agent knows 0 facts / Shop received 0 fields", the vault reads
   "Sealed", the grid shows the storefront's own default query (live inventory via Arcade when
   the server has a key, labeled "storefront default, no shopper request yet"; Walmart rows, when
   Walmart answers, show real product photos and open walmart.com; otherwise the labeled 12-jacket
   recorded sample). No shopper request has run yet, so the seam counts nothing.
2. Click **Copy agent prompt** and paste it into the agent. The prompt contains no private fact.
3. The agent calls `load_context` (vault fills, labeled "from Arcade Gmail" or "demo fixture"),
   then `search_products` (grid narrows; **Shop received** prints the accepted body with
   "200 · accepted by the merchant adapter" and the exact Arcade call), then `compare_products`
   and `prepare_selection`. Open the listing yourself.
4. Click **Try to leak**: the sidebar shows the body it sent with `destination` and `budgetUsd`
   and the literal 400. The grid and receipt do not change.
5. If ChatGPT declines `load_context`, use this fallback prompt instead: "He is XL, likes navy or
   olive, needs waterproof and packable". The receipt still shows four keys.
6. The **Leak demo** checkbox at the bottom of the sidebar is a demonstration of the
   spec's over-parameterized tool; it is off by default and nothing it receives leaves the page.
   ChatGPT's safety review may decline it.

The ARCADE panel shows real connected states from `GET /api/arcade/status` (it says it is still
checking until the route answers). When Arcade is not configured on the host, the page says so and
runs the labeled demo fixture and recorded sample.
Tools: `load_context`, `search_products`, `compare_products`, `prepare_selection` on
`document.modelContext`; `filter_jackets` is a Chrome-only declarative form.

## Video shot list (under 2:55)

1440x900, ChatGPT desktop in-app browser filling the frame with the sidebar visible, prompt
pre-typed in the composer, own voice or TTS, no music, no logos. Keep any live-listing shot under
two seconds; never open walmart.com or google.com on camera; the sidebar's "Exact Arcade call"
text is the Arcade evidence. Drop any beat whose feature did not ship or that the host refused;
narrate a refusal if it happened.

- 0:00–0:12 Hosted URL open, sidebar visible: seam 0 / 0, vault Sealed, ARCADE rows read aloud
  exactly as shown, live grid labeled "storefront default, no shopper request yet" (the 12-jacket
  recorded sample if the host has no key). Press Enter on the pre-typed prompt. "This is a real
  jacket shop that never learns why you are shopping. The prompt says nothing about who it's for."
- 0:12–0:30 `load_context` fires; the vault fills, pilled "from Arcade Gmail"; seam "Agent knows 9 facts"; activity "agent · load_context → Gmail.SearchEmailsByQuery".
  "The agent just read my gift notes from Gmail through Arcade, on the server. Nine facts. Now
  watch what the shop gets."
- 0:30–0:55 `search_products` fires; grid narrows; SHOP RECEIVED prints the four-key body and
  "200 · accepted"; seam 9 / 4; Exact Arcade call `{"tool":"...","input":{"keywords":"XL
waterproof packable navy olive jacket"}}` and the `max_price` line. "Four fields. The search ran
  through Arcade with one string. That tool would take a price ceiling. We never send it; the
  budget ranks results here, after they come back."
- 0:55–1:15 Click Try to leak: the sent body in red, then `→ 400 {"error":"Merchant rejected
unexpected fields: destination, budgetUsd"}`; grid and receipt unchanged. "Not a request for
  discretion. search_products has no field for Scotland, and the adapter refuses anything extra
  before any search runs. The schema is the boundary, not the model's manners."
- 1:15–1:40 AGENT CAN CALL NOW as compare_products and prepare_selection appear (or "four tools,
  state-aware errors" if REGISTER_ALL_AT_MOUNT shipped). Agent compares two, prepares one; [Your
  pick panel; hold to open]. "prepare_selection never navigates. Opening is a separate held
  gesture, because issue #288 showed an in-app browser clicking a page's own Approve button."
- 1:40–2:10 Leak demo on, leak prompt; `personalize_for_shopper` receives the
  facts, the seam's third number turns red, the strict receipt still shows four keys; narrate
  whichever actually happened, including a refusal. Fallback beat: Chrome 149 DevTools WebMCP
  panel showing search_products' Input column with exactly four keys.
- 2:10–2:40 Code: `lib/webmcp.ts` tool table and annotation rationale, `CATALOG_SEARCH_INPUT_SCHEMA`
  with `additionalProperties: false` and enums, the tests "no private field in any tool schema"
  and "sends only keywords to Arcade"; spec §6.3.3 on screen. "The spec names this attack and
  lists no site-side fix. A schema with no room is the fix, and the receipt lets you check it."
- 2:40–2:55 Close on the seam. "Agent knows 9. Shop received 4." End card: hosted URL ·
  github.com/thierrypdamiba/vitrine · MIT.

## Before the deadline

1. Push to GitHub, public. Confirm the MIT license shows in the About panel while signed out.
2. Deploy with ChatGPT Sites (ChatGPT web or desktop, not the CLI): open the Sites project for
   `.openai/hosting.json`'s `project_id`, add hosted secrets `ARCADE_API_KEY`, `ARCADE_USER_ID`,
   `ARCADE_CONTEXT_QUERY` in the Site's settings, then "Deploy this project with Sites".
3. Set the audience to **Anyone on the internet** only after the route lock (no authorization
   URL in any response) is in the deployed build. Open the URL in a private window while signed
   out and run `fetch('/api/arcade/status')` from the page console.
4. Hedge-submit at ~19:00 with the current description, repo URL, and hosted URL; a saved draft is
   not a submission.
5. Record and upload the video as Public (not unlisted). Fill the Devpost form with the
   description, URLs, three screenshots (ChatGPT "Available site tools" menu with the titles;
   Chrome DevTools WebMCP panel showing search_products' Input with four keys; the sidebar seam
   with the exact Arcade call and the 400 line), and the private testing instructions.
6. Press Submit and confirm the green "Submitted" state by 23:30 PT with the buffer intact.

## Freeze rule

After the final Submit: no commits, no redeploys, no video swaps, no entry edits until judging
ends on Sep 21, 2026 5pm PT. Keep building on a fork if you want to keep building.

Source: https://learn.chatgpt.com/docs/sites (Sites is available on Plus, Pro, Business,
Enterprise and Edu plans).
