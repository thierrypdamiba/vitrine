# The WebMCP Challenge context

Vitrine is being built for [The WebMCP Challenge](https://webmcp.devpost.com/), hosted by OpenAI on
Devpost. This document is the operating context for development. The official rules and challenge
website prevail if they disagree with this summary.

## Schedule

- Submission period opened August 25, 2026 at 11:00 a.m. Pacific Time.
- Submissions close September 3, 2026 at 1:00 p.m. Pacific Time.
- Judging runs September 4 through September 21, 2026.
- Winners are expected around September 23, 2026.
- Do not change the submitted repository, live site, or Devpost entry after the submission deadline
  until judging ends.

## What the challenge asks for

Build a WebMCP-powered web app where people and agents can interact, collaborate, and create
together. The app must make a credible case that WebMCP improves the user experience.

## Judging criteria

The four criteria are equally weighted:

1. **WebMCP Leverage:** The implementation must use WebMCP thoroughly and skillfully. The code must
   show genuine effort and a working, non-trivial implementation.
2. **Execution:** The submission must be a coherent, runnable product rather than a technical proof.
3. **Potential Impact:** The product must solve a specific problem for a real audience and demonstrate
   that it addresses the problem.
4. **Creativity and Ambition:** The concept should be novel and meaningfully different from existing
   projects.

Judging has a pass/fail viability stage before the scored stage. Vitrine must first be recognizably
on-theme and use WebMCP in a real, working path. The four criteria above then carry equal weight.

## Public judge roster

The official OpenAI challenge page and Devpost page list:

- Sarah Drasner — Distinguished Engineer, Chrome, Google
- Andrew Galloni — VP Research & Innovation, Cloudflare
- Jude Gao — Member of Technical Staff, Vercel; Next.js Core Team
- Ilya Grigorik — Distinguished Engineer, Shopify
- Alex Nahas — Creator of MCP-B
- Sean Roberts — VP of Applied AI, Netlify
- Justin Rushing — Browser Platform Lead, OpenAI

Do not invent individual preferences. Design and submission choices must answer the published
criteria, while assuming the panel can scrutinize browser behavior, commerce boundaries, hosting
reliability, and whether the experience is genuinely agent-native.

## Required submission material

- A working live URL accessible in ChatGPT's in-app browser or Google Chrome with WebMCP enabled.
- A text description explaining why the use case fits WebMCP, how it improves the experience, what
  people and agents can now do together, and how WebMCP was implemented.
- A public YouTube demo under three minutes. It must have audio and show the working project.
- A public GitHub, GitLab, or Bitbucket repository with all source, assets, and setup instructions.
- A recognized open-source license visible at the repository root.
- Testing instructions, including the agents or clients used to test the WebMCP tools.

Judges may rely on the description, repository, and video without building or deeply testing the app.
The hosted URL and first seconds of the video therefore need to communicate the product immediately.

## Existing-project rule

Projects created before August 25 are eligible only when they receive a meaningful WebMCP extension
during the submission period. The submission must distinguish earlier work from new work with dated
commit history or equivalent evidence. Preserve the Git history from this build onward.

## Vitrine response to the brief

Vitrine turns a private shopping problem into an inspectable WebMCP workflow:

1. The vault loads private context from a fixture or Arcade Gmail/Calendar.
2. The agent proposes a public brief. The shopper submits `share_brief`.
3. `search_products` sends only category, size, features, and colors.
4. The merchant adapter searches Google Shopping or a labeled recorded sample and returns a receipt.
5. Budget ranking stays in the vault. Compare and prepare follow. The shopper opens the listing.

The critical path uses deterministic vault and recorded product data. Live Arcade shopping is
optional and labeled when it is missing. Google authorization, checkout, and account creation remain
outside the credential-free judging path.

## Judge-facing story

The product claim should be legible in one short sequence:

1. Run the private shopping demo.
2. Read Dad, Scotland, and the budget in the vault.
3. Share the public brief.
4. Confirm the merchant receipt has only jacket, XL, waterproof, packable, navy, and olive.
5. Open a product card. Private values are absent there.

This sequence must be visible in the hosted app, reproducible from the README, and clear in a demo
video under three minutes. The hosted URL must be public. Owner-only Sites hosting fails judging.

## Definition of submission-ready

- The private path works without credentials in both supported browser environments.
- At least one agent-facing tool registers and returns a structured result.
- No merchant request contains private event fields or a budget ceiling.
- The Seam is derived from the merchant adapter's received request.
- The production build, SafeWord checks, and behavior scenarios pass.
- The public repository has a license, setup instructions, and dated commits.
- The deployed URL and demo video match the repository behavior.
