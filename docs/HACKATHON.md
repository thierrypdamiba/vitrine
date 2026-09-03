# The WebMCP Challenge context

Vitrine is being built for [The WebMCP Challenge](https://webmcp.devpost.com/), hosted by OpenAI on
Devpost. This document is the operating context for development. The official rules and challenge
website prevail if they disagree with this summary.

## Schedule

- Submission period opened August 25, 2026 at 11:00 a.m. Pacific Time.
- Submissions were to close September 3, 2026 at 1:00 p.m. Pacific Time; Devpost extended the
  deadline by 12 hours on September 3 (ChatGPT outage) to September 4, 2026 at 1:00 a.m. PT.
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

1. The page starts sealed: "Agent knows 0 facts / Shop received 0 fields", no search has run.
2. The agent calls `load_context`; the vault fills from Gmail through Arcade on the server, or from
   a labeled demo fixture.
3. `search_products` sends only category, size, features, and colors. The schema has no other
   field; the server returns 400 for any extra key.
4. The merchant adapter searches Walmart or Google Shopping through Arcade with `{ keywords }`, or
   a labeled recorded sample, and echoes the accepted brief back as the receipt. The sidebar prints
   the receipt, the exact Arcade call, and the counter "9 / 4".
5. Budget ranking stays on the page. Compare and prepare follow. The shopper opens the listing with
   a separate gesture.

The credential-free path uses the fixture and the recorded sample. Live Arcade is labeled when it
is active and when it is missing. Google authorization, checkout, and account creation remain
outside the judging path.

(Superseded on 2026-09-03: the earlier shopper-submitted brief-sharing step between the vault and
the search. The schema and the server's 400 are the boundary now.)

## Judge-facing story

The product claim should be legible in one short sequence:

1. Paste the agent prompt. It contains nothing private.
2. Watch the vault fill from Gmail via Arcade: Dad, Scotland, October, $250, nine facts.
3. Watch the grid narrow and the receipt print four keys with "200 · accepted".
4. Click "Try to leak" and read the 400.
5. Compare, prepare, open. Private values are absent from every merchant request.

This sequence must be visible in the hosted app, reproducible from the README, and clear in a demo
video under three minutes. The hosted URL must be public. Owner-only Sites hosting fails judging.

## Definition of submission-ready

- The credential-free path works in both supported browser environments.
- `load_context`, `search_products`, `compare_products`, and `prepare_selection` register with
  titles and annotations and return structured results.
- No merchant request contains private event fields or a budget ceiling; the Arcade shopping
  input has exactly one key.
- The Seam is derived from the merchant adapter's accepted request.
- The SSR HTML contains no private value.
- The production build, lint, format, unit tests, and behavior scenarios pass.
- The public repository has a license, setup instructions, and dated commits.
- The deployed URL and demo video match the repository behavior.
