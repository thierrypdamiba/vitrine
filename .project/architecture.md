# Vitrine Architecture

**Version:** 2.0  
**Last Updated:** 2026-09-03  
**Status:** Active

## Overview

Vitrine is the jacket shop and the shopper's vault on one page. The agent reads the shopper's gift
notes into the vault (`load_context`, backed by Gmail through Arcade on the server, or a labeled
fixture). The merchant adapter accepts only the public brief, turns it into a one-key Arcade
shopping request, and echoes the accepted brief back as the receipt. The sidebar counts what the
agent knows and what the shop received from that receipt. Private values never reach the merchant
adapter, the Arcade shopping call, or the SSR HTML.

## Layers and boundaries

| Layer            | Location                                       | Responsibility                                                                      |
| ---------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| Page             | `app/vitrine-app.tsx`                          | Sealed vault state, registry effect, actor-tagged activity, filter form, grid       |
| Sidebar          | `app/demo-sidebar.tsx`, `app/arcade-panel.tsx` | Seam counters, vault, literal receipt, exact Arcade call, Try to leak, tool strip   |
| Domain           | `lib/vitrine.ts`                               | Public-brief validation, ranking, withheld facts, judge prompts                     |
| Catalog          | `lib/catalog-data.ts`                          | House-brand recorded sample                                                         |
| Workflow         | `lib/session.ts`                               | Stage tool lists, `{ error, hint }` messages, trace events                          |
| WebMCP bridge    | `lib/webmcp.ts`                                | Tool table, annotations, per-tool AbortController registry, output budget           |
| Leak demo        | `lib/leaky.ts`                                 | `personalize_for_shopper` (spec 6.3.3 reproduction), page-local ledger, no network  |
| Vault client     | `lib/vault.ts`                                 | `loadVault`, `fetchArcadeStatus`, `probeMerchantRejection`                          |
| Vault Arcade     | `lib/arcade.ts`                                | Gmail parse, optional Calendar summary, boolean status                              |
| Merchant Arcade  | `lib/shopping.ts`                              | Walmart / Google Shopping search with `{ keywords }`. No Gmail imports              |
| Merchant adapter | `app/api/catalog/search/route.ts`              | Strict request validation, server-derived receipt, `arcadeRequest` echo             |
| Vault routes     | `app/api/arcade/context/route.ts`, `.../status` | Same-origin guard, rate limit, memo; never an authorization URL                     |

## Data flow

```text
page load: vault sealed, browse catalog, no request
            |
            v
load_context -> POST /api/arcade/context -> Gmail.SearchEmailsByQuery (+ GoogleCalendar.ListEvents)
            |            (or the labeled fixture when Arcade is not connected)
            v
search_products (category, size, features, colors)
            |
            v
POST /api/catalog/search -> parsePublicBrief (400 on any extra key)
            |
            v
Walmart.SearchProducts / GoogleShopping.SearchProducts { keywords }  (or the recorded sample)
            |
            v
receipt + arcadeRequest + items -> sidebar seam "9 facts / 4 fields", budget ranks on the page
            |
            v
compare_products -> prepare_selection -> shopper opens the listing (separate gesture)
```

## Key decisions

### The schema is the seam

**Status:** Active  
**Date:** 2026-09-03

| Field          | Value                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| What           | `search_products` has four enum fields and `additionalProperties: false`; the server rejects any extra key with 400 before any search.   |
| Why            | Spec section 6.3.3 names over-parameterization as the attack. A schema with no room is the site-side fix, and the receipt proves it.     |
| Trade-off      | The merchant cannot personalize. That is the product.                                                                                    |
| Alternatives   | A consent step before search. Superseded on 2026-09-03: a gate is a caption; the schema is a boundary.                                   |
| Implementation | `lib/webmcp.ts`, `lib/vitrine.ts`, `app/api/catalog/search/route.ts`                                                                    |

### The page starts sealed; the agent loads the vault

**Status:** Active  
**Date:** 2026-09-03

| Field          | Value                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| What           | No vault load and no catalog search on mount. `load_context` (or the shopper's "Load gift notes" button) fills the vault; the first `search_products` is the first adapter hit. |
| Why            | The seam counters must start at 0 / 0 and be derived from real requests; the SSR HTML must contain no private value.                   |
| Trade-off      | A judge without an agent has one extra click.                                                                                          |
| Alternatives   | Auto-search on load with the fixture brief (superseded on 2026-09-03).                                                                 |
| Implementation | `app/vitrine-app.tsx`, `lib/vault.ts`                                                                                                  |

### Tools accumulate; one registration per name per session

**Status:** Active  
**Date:** 2026-09-03

| Field          | Value                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| What           | `load_context` and `search_products` at browse, then `compare_products`, then `prepare_selection`; nothing is unregistered mid-session.      |
| Why            | A host that ignores `AbortSignal` cannot break the page; state-aware `{ error, hint }` results gate tools that are called too early.          |
| Trade-off      | The progressive story depends on the host surfacing later registrations; `REGISTER_ALL_AT_MOUNT` flips to all-at-load if it does not.        |
| Alternatives   | Re-register per stage and abort the previous set (superseded on 2026-09-03: it broke on hosts that ignore the signal).                      |
| Implementation | `lib/session.ts`, `lib/webmcp.ts`                                                                                                           |

### Arcade is server-side vault and merchant infrastructure

**Status:** Active  
**Date:** 2026-08-28, revised 2026-09-03

| Field          | Value                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| What           | Gmail (and optionally Calendar) fill the vault; Walmart / Google Shopping run the search with `{ keywords }` only. Fixture and recorded sample when Arcade is missing. |
| Why            | Judges cannot be required to OAuth, live shopping needs a server secret, and the merchant must demonstrably never receive `max_price`.      |
| Trade-off      | One demo mailbox owned by the author; the fixture is embedded in the client bundle as the fallback.                                        |
| Alternatives   | Arcade on the only path, or a fake connected store.                                                                                        |
| Implementation | `lib/arcade.ts`, `lib/shopping.ts`, `app/api/arcade/*`                                                                                     |

### Superseded on 2026-09-03

The 2026-08-28 design had a separate merchant panel component, a brief-proposal tool, and a
shopper-submitted brief-sharing step before `search_products` could run. All three are gone: the
merchant panel is the sidebar's literal receipt, and the sharing step is replaced by the schema and
the server's 400. No file in `app/` or `lib/` references them.

## Assessment triggers

- Split the vault and merchant onto separate origins when a retailer hosts the product page.
- Add per-user Arcade authorization before treating this as a multi-shopper product.
- Add visible confirmation and a separate security review before introducing checkout.
