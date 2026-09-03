# Spec: Vitrine private shopping

<!-- safeword:inspiration-contract:v1 -->

## Intent

Build a working WebMCP shopping experience where an agent can use private information to find a
good gift while the store receives only ordinary catalog filters.

## Intake Brief

- **Requested by:** Project owner entering the OpenAI WebMCP Challenge
- **Cost of inaction:** The submission remains an explanation and scripted mock instead of a product
  a judge can run and inspect
- **Reversibility:** Two-way door; deterministic fixtures can later be replaced by live Arcade and
  retailer integrations without changing the merchant disclosure contract

## References

- [The WebMCP Challenge](https://webmcp.devpost.com/)
- [ArcadeAI SafeWord](https://github.com/ArcadeAI/safeword)
- [Local hackathon operating context](../../../docs/HACKATHON.md)
- [Local WebMCP implementation context](../../../docs/WEBMCP.md)
- [Local ecosystem and judge context](../../../docs/ECOSYSTEM.md)
- [Current WebMCP draft](https://webmachinelearning.github.io/webmcp/)
- [Chrome comparison of WebMCP and MCP](https://developer.chrome.com/docs/ai/webmcp/compare-mcp)

## Personas

- Privacy-conscious shopper (PCS)
- Hackathon judge (HJ)

## Surfaces

Affected:

- Web app
- ChatGPT in-app browser
- Chrome WebMCP testing
- Hosted Site

## Vocabulary

Vitrine, Private context, Public brief, Merchant adapter, Merchant receipt, Seam, Guided demo, and
Arcade context provider use the definitions in the project glossary.

## Product Inspiration

<!-- prettier-ignore -->
| Reference | Checked on | Source version / edition | Customer-value evidence | Principle to borrow | Non-copy boundary | Decision impact |
| --- | --- | --- | --- | --- | --- | --- |
| [Apple App Privacy Report](https://support.apple.com/en-us/102188) | 2026-08-27 | Apple Support, published 2025-12-19 | The report makes privacy concrete by showing observed access and contacted domains | Show the store's observed fields and the private facts withheld from it | Do not copy a device-wide settings report or long-term activity history | Retained: build the Seam from the merchant adapter's accepted request, not from explanatory copy |

**Gate:** Approved by the project owner's instruction to build the Vitrine concept on 2026-08-27.

## Jobs To Be Done

### vitrine-private-shopping.PCS1 — Shop for someone without exposing their life

**Persona:** Privacy-conscious shopper (PCS)

> When my agent shops for someone I care about, I want it to use the facts that make the gift right
> without passing those facts to the store, so I can get a useful result without making my personal
> life merchant data.

#### vitrine-private-shopping.PCS1.R1 — The store receives only the catalog constraints needed to search

#### vitrine-private-shopping.PCS1.R2 — Private context can improve ranking after the catalog returns

#### vitrine-private-shopping.PCS1.R3 — Human and agent actions change one shared, inspectable interface

### vitrine-private-shopping.HJ1 — Verify the privacy and WebMCP claims

**Persona:** Hackathon judge (HJ)

> When I evaluate Vitrine, I want to call its tools and inspect the exact request received by the
> store, so I can distinguish a working privacy boundary from a narrated simulation.

#### vitrine-private-shopping.HJ1.R1 — Disclosure evidence comes from the merchant boundary

#### vitrine-private-shopping.HJ1.R2 — WebMCP tools are specific, structured, tab-bound product actions

#### vitrine-private-shopping.HJ1.R3 — The complete judging path works without third-party credentials

## Rave Moment

Vitrine finds a jacket for Dad's rainy Scotland trip, then the store receipt shows only `jacket`,
`XL`, `waterproof`, `packable`, `navy`, and `olive`—not Dad, Scotland, the dates, the budget, an email,
or a calendar event.

## Outcomes

- A shopper gets at least one waterproof, packable, under-budget jacket using the private fixture.
- The merchant receipt contains only `category`, `size`, `features`, and `colors`.
- A judge can invoke the WebMCP search tool, see the same results update, and inspect its structured
  input, output, and merchant receipt.
- The interface accurately distinguishes deterministic demo context from a future live Arcade MCP
  connection.

## Open Questions

None.
