# Spec: Build the Passage privacy demo

<!-- safeword:inspiration-contract:v1 -->

## Intent

Build a working WebMCP shopping experience that lets an agent use private event context while the
merchant receives only the inventory constraints needed to return products.

## Intake Brief

- **Requested by:** Project owner entering the OpenAI WebMCP Challenge
- **Cost of inaction:** The submission remains an architecture document and cannot score on execution
- **Reversibility:** Two-way door; the deterministic demo can later be replaced by live Arcade and Shopify integrations

## References

- [The WebMCP Challenge](https://webmcp.devpost.com/)
- [ArcadeAI SafeWord](https://github.com/ArcadeAI/safeword)
- [Local hackathon operating context](../../../docs/HACKATHON.md)
- [Local WebMCP implementation context](../../../docs/WEBMCP.md)
- [Local ecosystem and judge context](../../../docs/ECOSYSTEM.md)
- [Source register and precedence](../../../docs/SOURCES.md)
- [Community research notes](../../../docs/RESEARCH.md)
- [Current WebMCP draft](https://webmachinelearning.github.io/webmcp/)
- [WebMCP source repository](https://github.com/webmachinelearning/webmcp)
- Existing Passage and Vitrine architecture notes in the parent project

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

Passage, Vitrine, Seam, Private mode, Leaky mode, and Merchant request use the definitions in the
project glossary.

## Product Inspiration

<!-- prettier-ignore -->
| Reference | Checked on | Source version / edition | Customer-value evidence | Principle to borrow | Non-copy boundary | Decision impact |
| --- | --- | --- | --- | --- | --- | --- |
| [Apple App Privacy Report](https://support.apple.com/en-us/102188) | 2026-08-26 | Apple Support, published 2025-12-19 | The report shows when apps accessed privacy-sensitive data and which domains they contacted, turning a privacy claim into inspectable activity | Show observed disclosure with concrete fields and destinations | Do not copy a device-wide settings report or seven-day history | Build the Seam from Vitrine's received merchant request and show absent private fields explicitly |

**Gate:** Approved by the project owner on 2026-08-27.

## Jobs To Be Done

### passage-privacy-demo.PCS1 — Shop with private context

**Persona:** Privacy-conscious shopper (PCS)

> When my agent helps me shop for an event, I want it to use the details that matter without sending
> those details to the merchant, so I can get relevant results without turning my personal life into
> merchant data.

### passage-privacy-demo.HJ1 — Verify the privacy claim

**Persona:** Hackathon judge (HJ)

> When I evaluate the project, I want to see the exact facts known by Passage and fields received by
> Vitrine, so I can verify that WebMCP creates a real product benefit rather than a scripted claim.

## Rave Moment

The agent returns dresses that fit the private occasion, then the Seam reveals that Vitrine received
only `size` and `length`. Switching to the labeled leaky simulation makes the avoided disclosure
immediately visible without asking the shopper or judge to trust a privacy slogan.

## Rules

### passage-privacy-demo.PCS1 — Shop with private context

- **PCS1.R1 — Minimal merchant request:** In Private mode, the Vitrine request contains `size` and
  `length` only. Occasion, event date, venue, dress code, reserved colors, free text, and budget are
  absent rather than blank or hidden.
- **PCS1.R2 — Relevant private-side selection:** Passage uses the shopper's private event context and
  budget after inventory returns, so the displayed dresses remain relevant without expanding the
  merchant request.
- **PCS1.R3 — Shared control:** An agent-driven search updates the same visible state a shopper can
  inspect, change, or rerun through the human interface.
- **PCS1.R4 — Reliable access:** The complete private demonstration works without third-party
  credentials, checkout, or account creation.

### passage-privacy-demo.HJ1 — Verify the privacy claim

- **HJ1.R1 — Boundary-derived evidence:** The Seam renders the exact payload received by the Vitrine
  adapter and separately lists the private facts Passage knew.
- **HJ1.R2 — Inspectable WebMCP:** At least one useful top-level WebMCP tool has a specific schema,
  returns structured data, drives visible product behavior, and can be invoked in a supported
  judging client.
- **HJ1.R3 — Honest comparison:** Private mode is the real product path. Leaky mode is visibly and
  persistently labeled as a simulation and cannot be mistaken for the privacy-preserving behavior.
- **HJ1.R4 — Reproducible proof:** The hosted app and repository provide a short, credential-free
  path to inspect tool inputs, outputs, UI effects, and the received merchant request.

**Gate:** Approved by the project owner on 2026-08-27.

## Outcomes

- A shopper gets at least one event-appropriate option under budget while Vitrine receives no event
  context or budget ceiling.
- A judge can reproduce the private path, inspect the WebMCP call, and match the Seam to Vitrine's
  received payload without credentials.

## Open Questions

- Should Arcade run as the agent's connected MCP service or behind Passage's application backend?
