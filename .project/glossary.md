# Glossary

## Vitrine

**Definition:** The private vault and WebMCP demo. It is not the store.

## Private context

**Definition:** Personal facts available to the shopper or agent but not needed by the merchant, such
as the recipient, relationship, destination, dates, budget, emails, calendar events, and purchase
history.

## Public brief

**Definition:** The smallest structured set of ordinary catalog constraints that Vitrine permits to
cross the merchant boundary: category, size, features, and colors.

## Merchant adapter

**Definition:** The HTTP boundary that validates a public brief, searches Google Shopping, Walmart,
or a recorded sample, and reports the request it accepted.

## Merchant receipt

**Definition:** The exact accepted public brief returned by the merchant adapter as disclosure
evidence.

## Seam

**Definition:** The visible split between vault facts and the merchant receipt. Private values appear
only in the vault.

## Credential-free path

**Definition:** The run that works without Arcade: `load_context` (or the shopper's "Load gift
notes" button) fills the vault from the labeled demo fixture, and `search_products` (or the filter
form) searches the labeled recorded sample through the same `runVitrineSearch` command. Superseded
on 2026-09-03: the earlier "Guided demo" button and shopper-submitted sharing step.

## Arcade context provider

**Definition:** The optional MCP path that reads authorized Gmail and Calendar into the vault, and
searches live merchant catalogs. It is not required for the judging path.
