# Devpost submission

Draft material for the WebMCP Challenge entry. Paste-ready; edit in place.

## Status

| Required                                                   | State                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| Public repository with source, assets, setup               | push this repo to GitHub, public                                     |
| Open-source license visible at repo root                   | `LICENSE` (MIT)                                                      |
| Testing instructions incl. agents/clients used             | `README.md` → "Test the WebMCP tools"                                |
| Working live URL (ChatGPT in-app browser or Chrome + flag) | deploy from ChatGPT Sites, set visibility to public, paste URL below |
| YouTube demo, under 3 minutes, with audio                  | record; script below                                                 |
| Text description                                           | below                                                                |

Live URL: _____

Video URL: _____

## Deadline

Official rules (section 12.4: rules prevail over marketing and website): **September 3, 2026,
1:00 p.m. Pacific Time.** The Devpost header shows a later time; do not rely on it.

## Text description

**Vitrine — a shop that never learns why you are shopping.**

_Why WebMCP._ An agent that shops for you knows things a merchant should not: who the gift is
for, where they are going, when, and how much you can spend. Today that context leaks through
the only channel available, a free-text search box. WebMCP lets a page publish tools with
typed schemas, so a merchant can say exactly what it accepts. Vitrine's `search_products`
takes `category`, `size`, `features`, `colors`. There is no field for the occasion, so the
occasion cannot be sent.

_What people and agents do together._ The shopper's private context (Dad, a rainy October trip to Scotland, a $250 ceiling) lives with the agent, never with the shop. The agent searches; the shopper sees the catalog update live and can use the same filters by hand. The agent compares two or three visible items, and the shopper confirms before any listing opens. Budget ranking happens on the shopper's side, never at the merchant.

_How it improves the experience._ The sidebar shows the split as it happens: what the agent
kept, what the merchant received. The merchant receipt is derived from the request the catalog
adapter actually got, not from what the agent claims it sent. A judge can read both in one
screen and verify the boundary held.

_How WebMCP was implemented._ Three imperative tools registered via `navigator.modelContext` (`search_products`, `compare_products`, `prepare_selection`) plus one declarative tool (`filter_jackets`, the shop's own filter form carrying `toolname`/`tooldescription`), so the human controls and the agent tools are the same surface.
Tools are registered progressively: compare and prepare only appear after a search returns,
so the agent's available actions track the page state. `prepare_selection` is marked
`untrusted` so the shopper confirms before the listing opens. Schemas use enums and bounded
arrays; a unit test asserts no tool schema contains a private field. The catalog adapter can
call Arcade (Google Shopping / Walmart) or a labeled recorded sample; the judging path needs
no credentials.

Stack: Next.js 16 on vinext, React 19, TypeScript, Arcade SDK. Tests: node:test, Cucumber.

## Video script (under 3 minutes)

0:00 Open the live URL. "This is a jacket shop. The agent knows I'm buying for Dad, for
Scotland, in October, under $250. Watch what the shop learns."
0:20 Paste the prompt. Point at the sidebar: "Agent kept" lists what stays private.
0:50 `search_products` fires. Catalog updates. Point at the merchant receipt: jacket, XL,
waterproof, packable, navy, olive. "No Dad. No Scotland. No budget."
1:30 Compare two. Prepare selection. Confirm. Listing opens.
2:10 Show `lib/webmcp.ts` schema and the test that scans for private fields.
2:40 "WebMCP made this possible because the merchant publishes a schema, not a search box."

## Before the deadline

1. Push to GitHub, public. Confirm the MIT license badge shows in the About panel.
2. Deploy. Open the URL in a private window while signed out; it must load.
3. Record and upload the video as public (not unlisted).
4. Fill the Devpost form with the description, URLs, and testing note above.
5. Freeze the repo, site, and entry until judging ends (September 21).
