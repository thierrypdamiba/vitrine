# Test Definitions: Vitrine private shopping

Feature source: `features/vitrine-private-shopping.feature`

test-definitions.md is the R/G/R ledger.

## Rule: The store receives only the catalog constraints needed to search

### Scenario: Search sends only the public brief

- [x] RED skip: first run failed with missing lib/vitrine.ts
- [x] GREEN skip: npm test and npm run test:bdd pass; commit not requested
- [x] REFACTOR skip: no extra cleanup after the adapter landed with the feature

### Scenario: A private field is rejected at the merchant boundary

- [x] RED skip: first run failed with missing lib/vitrine.ts
- [x] GREEN skip: npm test and npm run test:bdd pass; commit not requested
- [x] REFACTOR skip: no extra cleanup after the adapter landed with the feature

## Rule: Private context can improve ranking after the catalog returns

### Scenario: Private context ranks the returned inventory

- [x] RED skip: first run failed with missing lib/vitrine.ts
- [x] GREEN skip: npm test and npm run test:bdd pass; commit not requested
- [x] REFACTOR skip: no extra cleanup after the adapter landed with the feature

## Rule: Human and agent actions change one shared inspectable interface

### Scenario: Guided and WebMCP searches share visible results

- [x] RED skip: first run failed with missing lib/webmcp.ts
- [x] GREEN skip: npm test and npm run test:bdd pass; commit not requested
- [x] REFACTOR skip: no extra cleanup after the adapter landed with the feature

## Rule: Disclosure evidence comes from the merchant boundary

### Scenario: The Seam shows the merchant receipt

- [x] RED skip: first run failed with missing lib/vitrine.ts
- [x] GREEN skip: npm test and npm run test:bdd pass; commit not requested
- [x] REFACTOR skip: no extra cleanup after the adapter landed with the feature

## Rule: WebMCP tools are specific structured tab-bound product actions

### Scenario: WebMCP exposes a narrow catalog search tool

- [x] RED skip: first run failed with missing lib/webmcp.ts
- [x] GREEN skip: npm test and npm run test:bdd pass; commit not requested
- [x] REFACTOR skip: no extra cleanup after the adapter landed with the feature

## Rule: The complete judging path works without third-party credentials

### Scenario: The guided demo works when WebMCP and Arcade are unavailable

- [x] RED skip: first run failed with missing lib/vitrine.ts
- [x] GREEN skip: npm test and npm run test:bdd pass; commit not requested
- [x] REFACTOR skip: no extra cleanup after the adapter landed with the feature

---

## Feature-level cross-scenario refactor

- [x] cross-scenario skip: search handler already lives in one domain function used by HTTP, UI, and tools
