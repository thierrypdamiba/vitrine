# Principles

## Disclose the minimum

**Intent:** Keep private context on the shopper's side of the merchant boundary.

**Prefer:** Typed tools that send only the inventory constraints a merchant needs.

**Avoid:** Recipients, relationships, trip details, source records, free text, or budget ceilings in
merchant requests.

**Evidence:** Behavior tests assert the exact merchant request and the interface displays it.

## Show what actually crossed

**Intent:** Make the privacy claim inspectable instead of asking the user to trust copy.

**Prefer:** A receipt built from the merchant adapter's accepted request.

**Avoid:** Client-authored claims about what another boundary received.

**Evidence:** The merchant panel renders received fields from the merchant response.

## Keep the judging path reliable

**Intent:** Give judges a complete demonstration without requiring third-party accounts.

**Prefer:** Deterministic demo data with optional integrations added only after the core path works.

**Avoid:** OAuth, checkout, or external commerce dependencies on the critical path.

**Evidence:** The production build and browser demo run without credentials.

## Treat the schema as the boundary

**Intent:** Prevent privacy leakage through over-parameterization.

**Prefer:** A merchant schema that cannot represent private context or a budget ceiling.

**Avoid:** Accepting sensitive fields and relying on convention, prompt wording, or UI hiding not to
use them.

**Evidence:** Contract tests reject forbidden fields and assert the adapter's accepted payload.

## Keep people in the shared interface

**Intent:** Use WebMCP for visible human-agent collaboration rather than silent backend automation.

**Prefer:** Tool calls that update the same state and interface a shopper can inspect and adjust.

**Avoid:** Agent-only results that bypass the product UI or conceal consequential behavior.

**Evidence:** Browser tests pair each tool result with its visible UI effect and disclosure record.
