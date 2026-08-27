# The WebMCP Challenge context

Passage is being built for [The WebMCP Challenge](https://webmcp.devpost.com/), hosted by OpenAI on
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

Judging has a pass/fail viability stage before the scored stage. Passage must first be recognizably
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

## Passage response to the brief

Passage turns a private shopping problem into an inspectable WebMCP workflow:

1. The top-level Passage page gives the agent structured private-context tools.
2. The agent asks Vitrine for inventory through a narrow merchant request.
3. Vitrine receives only size and garment length.
4. Passage applies budget and event rules on the shopper's side.
5. The Seam shows what Passage knew beside what Vitrine actually received.
6. A labeled leaky-mode simulation makes the disclosure difference visible.

The critical path uses deterministic event and inventory data. Arcade, Google, Shopify, checkout, and
account creation remain outside the first submission-ready build.

## Judge-facing story

The product claim should be legible in one short sequence:

1. A shopper supplies Passage with private event context.
2. An agent invokes Passage's WebMCP tools and produces relevant dresses.
3. The Seam reveals that Vitrine received only size and length.
4. A labeled leaky simulation shows the disclosure the private path avoided.

This sequence must be visible in the hosted app, reproducible from the README, and clear in a demo
video under three minutes. The interface should establish the privacy problem and the WebMCP benefit
before explaining implementation details.

## Definition of submission-ready

- The private path works without credentials in both supported browser environments.
- At least one agent-facing tool registers and returns a structured result.
- No merchant request contains private event fields or a budget ceiling.
- The Seam is derived from the merchant adapter's received request.
- The production build, SafeWord checks, and behavior scenarios pass.
- The public repository has a license, setup instructions, and dated commits.
- The deployed URL and demo video match the repository behavior.
