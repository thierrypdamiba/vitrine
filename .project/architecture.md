# Vitrine Architecture

**Version:** 1.1  
**Last Updated:** 2026-08-28  
**Status:** Proposed

## Overview

Vitrine is the private vault. Google Shopping or Walmart is the merchant. The vault page can read
Gmail and Calendar through Arcade, derive a public brief, and wait for the shopper to share it.
The merchant adapter accepts only that brief, turns it into a shopping request, and returns a
receipt plus product cards. Private values never enter the merchant DOM.

## Layers and boundaries

| Layer | Location | Responsibility |
| --- | --- | --- |
| Vault UI | `app/vitrine-app.tsx` | Private facts, consent, trace, judge prompt |
| Merchant UI | `app/merchant-panel.tsx` | Receipt, product cards, compare, prepare. No private context props |
| Domain | `lib/vitrine.ts` | Public-brief validation, ranking, vault/merchant view split |
| Workflow | `lib/session.ts` | Stage tools, consent, compare/prepare recovery |
| WebMCP bridge | `lib/webmcp.ts` | Imperative tools, cancellation, untrusted merchant output |
| Vault Arcade | `lib/arcade.ts` | Natural Gmail parse and optional Calendar summary |
| Merchant Arcade | `lib/shopping.ts` | Google Shopping / Walmart search. No Gmail imports |
| Merchant adapter | `app/api/catalog/search/route.ts` | Strict request validation and server-derived receipt |

## Data flow

```text
Arcade Gmail/Calendar or demo vault
            |
            v
Agent derives public brief
            |
            v
Shopper submits share_brief
            |
            v
search_products (category, size, features, colors)
            |
            v
Merchant adapter -> Google Shopping or recorded sample
            |
            v
Receipt + product cards (no private values)
            |
            v
compare_products -> prepare_selection -> shopper opens listing
```

## Key decisions

### This site is the vault, not the store

**Status:** Active  
**Date:** 2026-08-28

| Field | Value |
| --- | --- |
| What | Treat Vitrine as the agent vault. The merchant is Google Shopping or Walmart. |
| Why | If Vitrine both reads Gmail and is the store, the privacy claim is already false. |
| Trade-off | One origin still hosts both routes. The proof is the merchant request, receipt, and DOM split, plus a shopping module that cannot import Gmail loaders. |
| Alternatives | Two origins. Stronger isolation, but ChatGPT exposes WebMCP on the top-level page, not a cross-origin iframe. |
| Implementation | `lib/shopping.ts`, `app/merchant-panel.tsx`, `lib/vitrine.ts` |

### The shopper shares the brief

**Status:** Active  
**Date:** 2026-08-28

| Field | Value |
| --- | --- |
| What | `search_products` runs only after the shopper submits `share_brief`. |
| Why | Disclosure has to be an action, not a caption next to withheld facts. |
| Trade-off | The demo has two human steps: run, then share. |
| Alternatives | Auto-search after loading the vault. Faster, and it hides the gate. |
| Implementation | `app/vitrine-app.tsx`, `lib/webmcp.ts` |

### Arcade is vault infrastructure and merchant search, not a config file

**Status:** Active  
**Date:** 2026-08-28

| Field | Value |
| --- | --- |
| What | Parse a normal Gmail thread, optionally a Calendar event, and search live products. Keep a fixture and recorded sample when Arcade is missing. |
| Why | Judges cannot be required to OAuth, and live shopping needs a server secret. |
| Trade-off | Recorded cards are labeled when live search is not configured. |
| Alternatives | Arcade on the only path, or fake a connected store. |
| Implementation | `lib/arcade.ts`, `lib/shopping.ts` |

### WebMCP tools follow the workflow

**Status:** Active  
**Date:** 2026-08-28

| Field | Value |
| --- | --- |
| What | Register `load_context` and `propose_brief`, then `search_products`, then `compare_products`, then `prepare_selection`. |
| Why | Chrome's tool guidance is stateful collaboration, not one search wrapper. |
| Trade-off | Agents that skip stages get a recovery message or a missing tool. |
| Implementation | `lib/session.ts`, `lib/webmcp.ts` |

## Assessment triggers

- Split the vault and merchant onto separate origins when a retailer hosts the product page.
- Add per-user Arcade authorization before treating this as a multi-shopper product.
- Add visible confirmation and a separate security review before introducing checkout.
