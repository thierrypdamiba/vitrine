# Principles

## Disclose the minimum

**Intent:** Keep personal context on the shopper's side of the merchant boundary.

**Prefer:** Typed tools that send only the inventory constraints a merchant needs.

**Avoid:** Free-text queries, personal notes, event details, or budget ceilings in merchant requests.

**Evidence:** Behavior tests assert the exact merchant request and the interface displays it.

## Show what actually crossed

**Intent:** Make the privacy claim inspectable instead of asking the user to trust copy.

**Prefer:** A ledger built from the merchant adapter's received request.

**Avoid:** Client-authored claims about what another boundary received.

**Evidence:** The private and leaky demonstrations render received fields from the same request contract.

## Keep the judging path reliable

**Intent:** Give judges a complete demonstration without requiring third-party accounts.

**Prefer:** Deterministic demo data with optional integrations added only after the core path works.

**Avoid:** OAuth, checkout, or external commerce dependencies on the critical path.

**Evidence:** The production build and browser demo run without credentials.
