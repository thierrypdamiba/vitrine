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

Pending JTBD confirmation.

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

Pending product-inspiration review.

## Outcomes

Pending Rules confirmation.

## Open Questions

None.
