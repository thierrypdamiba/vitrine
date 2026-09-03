---
id: PDCDZ0
slug: vitrine-private-shopping
type: feature
phase: implement
status: in_progress
scope:
  - a single-page Vitrine demo for finding Dad a jacket for an October Scotland trip
  - a validated merchant adapter that accepts category, size, features, and colors only
  - top-level WebMCP tools that update the same results and disclosure view as the human controls
  - shopper-side ranking that can use private trip context and budget after inventory returns
  - a credential-free guided run using deterministic private context and catalog fixtures
out_of_scope:
  - live Arcade, Google, email, calendar, or order-history credentials
  - a standalone MCP server or a claim that WebMCP runs on the backend
  - live retailer inventory, checkout, payments, accounts, or order placement
  - a general-purpose shopping engine beyond the jacket demonstration
done_when:
  - the guided run returns a relevant jacket under the private budget while the merchant receipt contains no recipient, trip, source-record, or budget fields
  - the merchant adapter rejects payloads with fields outside its public catalog schema
  - a WebMCP search tool returns structured data and updates the same visible results and merchant receipt as the human demo
  - the human demo remains usable when WebMCP is unavailable
  - tests, lint, and the production build pass without third-party credentials
inspiration_contract: v1
inspiration_contract_scaffold: v1
created: 2026-08-27T00:49:16.926Z
last_modified: 2026-08-27T20:33:58.000Z
---

# Build the Vitrine private shopping demo

**Goal:** Ship a working WebMCP shopping demo that uses private context without giving that context
to the store.

**See:** [spec.md](./spec.md) for personas, jobs-to-be-done, and outcomes.

## Work Log

- 2026-08-27T00:49:16.926Z Started: Created ticket PDCDZ0
- 2026-08-27T01:08:00.000Z Context: Indexed official challenge, WebMCP specification,
  implementation, security, browser tooling, judge, supporter, and community sources
- 2026-08-27T01:24:00.000Z Gate: Project owner approved the original privacy Rules and reopened
  the Arcade boundary choice
- 2026-08-27T20:33:58.000Z Pivot: Project owner chose Vitrine as the product, the Dad-jacket
  shopping story, and a real top-level WebMCP implementation
- 2026-08-27T20:33:58.000Z Intake gates: The owner's explicit instruction to build approved the
  Vitrine JTBDs, Apple-style inspectability principle, numbered Rules, and engineering scope captured
  in this ticket
- 2026-08-27T20:33:58.000Z Phase: Advanced from intake to define-behavior after removing the
  unresolved Passage-versus-Vitrine and Arcade-placement questions
- 2026-08-27T20:40:00.000Z Define behavior: Captured six dimensions, seven scenarios, six
  numbered Rules, two representative rejection paths, and coverage for all affected surfaces
- 2026-08-27T20:40:00.000Z Scenario completeness: The owner's instruction to build accepted the
  concrete Dad-jacket flow; no intent decision remains open before review
- 2026-08-28T01:40:00.000Z Scenario-gate: Owner said build it. No build-only kill-risk; WebMCP
  registration and the HTTP adapter are already specified. Advanced to plan-implementation.
- 2026-08-28T01:41:00.000Z Plan: Adapter receipt first, then ranking, shared command, one
  search_catalog tool, fixture UI. Arcade stays disconnected copy.
- 2026-08-28T01:42:00.000Z Implement: Plan valid, design approval gate off. Starting TDD
  at the merchant schema boundary.
