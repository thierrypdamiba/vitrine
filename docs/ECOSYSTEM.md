# Hackathon ecosystem and strategy

This file maps the official challenge ecosystem to Vitrine. It is a decision aid, not a requirement
to integrate every sponsor.

## Challenge supporters

| Organization  | Official resources                                                            | Relevance to Vitrine now                                                       |
| ------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| OpenAI        | ChatGPT in-app browser, WebMCP showcase, ChatGPT Sites                        | Primary agent runtime, examples, and hosting path                              |
| Google Chrome | Specification work, origin trial, React and Angular helpers, evals, DevTools  | Primary implementation, debugging, and evaluation guidance                     |
| Cloudflare    | WebMCP overview, Browser Run, coffee-store demo, Workers template and hosting | Reference architecture or alternate deployment; not a core dependency          |
| Vercel        | Open storefront, WebMCP implementation, live demo and hosting                 | Commerce implementation reference; not required for Vitrine                    |
| Shopify       | Storefront WebMCP tools and agentic commerce resources                        | Future merchant adapter inspiration; outside the credential-free critical path |
| Render        | Workflows, templates, hosting and participant credits                         | Alternate deployment; no required integration                                  |
| Netlify       | WebMCP starter, hosting and participant credits                               | Alternate deployment; no required integration                                  |

The project should use a supporter resource only when it improves the product or reduces delivery
risk. Sponsor count is not a judging criterion.

## What the panel must be able to establish

| Published criterion   | Vitrine evidence                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| WebMCP Leverage       | Stage tools with titles and annotations, a per-tool registry, and a schema that cannot represent private fields |
| Execution             | A public hosted flow loads the vault, prints the accepted receipt, and shows real or honestly labeled products  |
| Potential Impact      | The demo makes a specific privacy problem understandable and shows the merchant receipt                         |
| Creativity & Ambition | Vitrine treats WebMCP as a selective-disclosure workflow, not a search button                                   |

## Strategic guardrails

- Optimize for a complete two-minute proof before adding checkout.
- Make the first screen understandable without a spoken explanation.
- Keep the WebMCP tools inspectable and the README test path short because judges may not build the
  project.
- Preserve dated commits that distinguish the new WebMCP work.
- Freeze the submitted repository, live site, and Devpost entry after the official deadline until
  judging ends.
- Do not infer special treatment from a judge's employer or add a sponsor integration solely for
  name recognition.
- The hosted URL must be public. Owner-only Sites hosting fails judging.
