# Research: is Vitrine the play for The WebMCP Challenge?

Checked 27 August 2026. This note answers one question against primary sources: should this
repo enter [The WebMCP Challenge](https://webmcp.devpost.com/) as Vitrine, a
privacy-preserving shopping demo?

**Verdict:** Yes, with conditions. Ship the privacy split as the product. Do not ship
another agent-ready storefront. The hosted app, the video, and the repo have to prove
the boundary in one run. A jacket catalog that an agent can search is already the
official example, the Chrome evals example, Shopify's default storefront tools, and
OpenAI's own grocery showcase. That version of Vitrine would be the wrong play.

The live `site/app/page.tsx` is still a placeholder as of this check. Execution is not
earned until a judge can open a URL and see the receipt.

## Source register

Challenge materials, in precedence order. The [official rules](https://webmcp.devpost.com/rules)
section 12.4 say that if marketing, the submission form, or the website disagree with
the rules, the rules win.

- [Devpost overview](https://webmcp.devpost.com/)
- [Official rules](https://webmcp.devpost.com/rules)
- [Resources, supporter links, and FAQ](https://webmcp.devpost.com/resources)
- [Devpost dates](https://webmcp.devpost.com/details/dates)
- [OpenAI marketing page](https://openai.com/webmcp-challenge/), retrieved from the
  [26 August 2026 Wayback capture](https://web.archive.org/web/20260826205054/https://openai.com/webmcp-challenge/)
  after the live page returned a bot interstitial
- [OpenAI community announcement](https://community.openai.com/t/the-webmcp-challenge-is-here/1392582)
- [OpenAI WebMCP showcase](https://developers.openai.com/showcase), including
  [Verdant Market](https://developers.openai.com/showcase/verdant-market)

WebMCP:

- [Draft Community Group Report](https://webmachinelearning.github.io/webmcp/)
- [Repository README](https://github.com/webmachinelearning/webmcp/blob/main/README.md)
- [implementation-status.md](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)
- [security-privacy-questionnaire.md](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md)
- [docs/service-workers.md](https://github.com/webmachinelearning/webmcp/blob/main/docs/service-workers.md)
  is a supplementary explainer, not current platform behavior

Chrome:

- [WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [When to use WebMCP and MCP](https://developer.chrome.com/docs/ai/webmcp/compare-mcp)
- [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Evals](https://developer.chrome.com/docs/ai/webmcp/evals)
- [GoogleChromeLabs/webmcp-tools](https://github.com/GoogleChromeLabs/webmcp-tools)

Supporter examples linked from the resources tab:

- Cloudflare landing: [webmcp-challenge.examples.workers.dev](https://webmcp-challenge.examples.workers.dev/)
- Cloudflare coffee store: [jillesme/webmcp-coffee-store](https://github.com/jillesme/webmcp-coffee-store)
- Cloudflare Browser Run: [developers.cloudflare.com/browser-run/features/webmcp](https://developers.cloudflare.com/browser-run/features/webmcp/)
- Vercel storefront: [vercel/shop#498](https://github.com/vercel/shop/pull/498) and the
  later Hydrogen replacement in [#504](https://github.com/vercel/shop/pull/504)
- Shopify: [shopify.dev/docs/api/web-mcp](https://shopify.dev/docs/api/web-mcp)

I did not infer judge taste from employer. The published criteria are the only scoring
text.

## Official schedule, eligibility, and submission

From the [rules](https://webmcp.devpost.com/rules):

- Registration and submission: 25 August 2026, 11:00 a.m. Pacific, through 3 September
  2026, 1:00 p.m. Pacific
- Judging: 4 September 10:00 a.m. Pacific through 21 September 5:00 p.m. Pacific
- Winners: on or around 23 September 2026, 2:00 p.m. Pacific
- Sponsor: OpenAI OpCo, LLC. Administrator: Devpost.

Eligibility: age of majority; residence or organization domicile in a country that
supports [OpenAI API access](https://platform.openai.com/docs/supported-countries);
not Brazil, China, Hong Kong, Quebec, Russia, Crimea, Cuba, Iran, North Korea, Syria,
Venezuela, Donetsk, Luhansk, or other OFAC-designated places; not Promotion Entity
employees, judges, or their households.

Individuals, teams, and organizations may enter. No team-size cap. Some prize items
cover at most three people. Multiple submissions are allowed if they are substantially
different.

Required materials, from rules "Submission Requirements" and the overview:

1. A working live URL judges can open in ChatGPT's in-app browser or Chrome with
   WebMCP enabled. Hosting may be ChatGPT Sites, Cloudflare, Vercel, Render, Netlify,
   Shopify, or any other provider. Auth is allowed if credentials go on the form.
2. English text covering why the use case fits WebMCP, how the experience is better,
   what people and agents can do together that was hard before, and how WebMCP was
   implemented.
3. A public YouTube demo under three minutes, with audio, showing the project working
   and how WebMCP is used.
4. A public GitHub, GitLab, or Bitbucket repo with source, assets, setup instructions,
   and an open-source license visible in the About section.

After the deadline, do not edit the Devpost entry, the submitted repo, or the live
site until winners are announced. The FAQ repeats this. Fork if you keep building.

Existing projects are eligible only if they were "meaningfully extended using WebMCP
after the Submission Period start date." Pre-existing work is scored only on that
extension, with dated commits or equivalent.

The Devpost plugin is optional and "not the official source of any Hackathon
information."

## Judging, as written

[Rules §7](https://webmcp.devpost.com/rules) is two stages.

Stage one is pass/fail: the project "reasonably fits the theme and reasonably applies
the required APIs/SDKs."

Stage two is four equally weighted criteria, "according to the sole and absolute
discretion of the judges":

1. WebMCP Leverage. "How thoroughly and skillfully does the project use WebMCP? Does
   the code reflect genuine effort and a working, non-trivial implementation?"
2. Execution. "Does the project deliver a working or runnable project that has a
   complete, coherent product experience — not just a technical proof of concept?"
3. Potential Impact. "Does the project make a credible, specific case for solving a
   real problem for a real audience — and does the solution actually address that
   problem based on what's demonstrated?"
4. Creativity & Ambition. "How creative and novel is the concept and does the project
   differ from existing concepts?"

Ties break by criterion order, then a panel vote.

Judging "may utilize expert panels, peer review, automated AI-driven analysis, or any
combination thereof." Judges "are not required to test the Project and may choose to
judge based solely on the text description, images, and video." The FAQ says the same,
then adds that they will also visit the live URL. Plan for a judge who never clicks a
tool and for one who does.

The listed panel on Devpost and the OpenAI page, as of this check:

- Sarah Drasner, Distinguished Engineer, Chrome, Google
- Andrew Galloni, VP Research & Innovation, Cloudflare
- Jude Gao, Member of Technical Staff, Vercel, Next.js Core Team
- Ilya Grigorik, Distinguished Engineer, Shopify
- Alex Nahas, Creator of MCP-B
- Sean Roberts, VP of Applied AI, Netlify
- Justin Rushing, title disagrees across pages. See below.

Do not treat that roster as a preference list. The rules say judges "may or may not be
listed individually" and "may change."

## OpenAI marketing page vs Devpost rules

Live `openai.com/webmcp-challenge/` was not readable here. The
[Wayback capture of 26 August 2026](https://web.archive.org/web/20260826205054/https://openai.com/webmcp-challenge/)
is the OpenAI-owned text I could read.

Agreements:

- Ten-day challenge. Top 10 win.
- Deadline 3 September at 1 p.m. PT.
- Theme line matches Devpost: "an app that becomes meaningfully better when people and
  their agents can use it together."
- Test in ChatGPT's in-app browser or Chrome with the flag.
- Eligibility details are deferred to Devpost.

Disagreements and near-disagreements:

**Opening time.** Rules: 25 August 2026, 11:00 a.m. Pacific. OpenAI page and
[Devpost dates](https://webmcp.devpost.com/details/dates): 25 August at 12:00 p.m. PT /
PDT. Use the rules' 11:00 a.m. if the difference ever matters.

**Winner announcement.** Rules: "on or around" 23 September, 2:00 p.m. Pacific. OpenAI
page: 23 September, with a footnote that the date "may change depending on the volume
of submissions." Devpost dates lists 23 September at 2:00 p.m. PDT with no footnote.

**Rushing's title.** OpenAI page: "Browser Agent Lead, OpenAI." Devpost overview:
"Browser Platform Lead, OpenAI." Same person, different job line. Not a scoring rule.

**Cash presentation.** OpenAI page: "$3,000 in cash from OpenAI" plus "additional
prizes" from supporters. Devpost overview body: "$3,000 in cash." Devpost prize table
header: "$3,500 in cash." Rules itemize OpenAI $3,000 USD cash and Netlify "$500 in
cash from Netlify" per winning submission. The $3,500 figure is OpenAI cash plus
Netlify cash, not a second OpenAI prize. OpenAI's marketing page does not mention the
Netlify cash.

**Featured examples.** OpenAI's page shows 3D Modeling, Collaborative Writing,
Crossword Builder, Wandernote, and Data Exploration, then points to the showcase.
Devpost resources point at the same showcase plus Cloudflare coffee, Vercel storefront,
and Shopify storefront tools. OpenAI's own featured set is not commerce-first. The
supporter kit is.

**Community clock.** The [OpenAI forum post](https://community.openai.com/t/the-webmcp-challenge-is-here/1392582)
prints "September 3, 2026 8:00 PM" with no zone. That is 1:00 p.m. PDT in UTC. Not a
real conflict.

Internal Devpost conflict, not OpenAI vs Devpost: one FAQ row says "Since there's no
video, make sure your live URL and README are as clear as possible." The rules and a
later FAQ row require a <3-minute YouTube video with audio. Use the rules. Record the
video.

## What the spec and Chrome docs actually reward

The draft introduction:

> Web pages that use WebMCP can be thought of as Model Context Protocol [MCP] servers
> that implement tools in client-side script instead of on the backend. WebMCP enables
> collaborative workflows where users and agents work together within the same web
> interface, leveraging existing application logic while maintaining shared context and
> user control.

The README goals: human-in-the-loop, tools instead of DOM guessing, do not
disintermediate the web UI, reuse page code. Non-goals: headless as the design center,
fully autonomous agents, replacing backend MCP, replacing human interfaces.

Chrome's [compare page](https://developer.chrome.com/docs/ai/webmcp/compare-mcp):
WebMCP is tab-bound and frontend. MCP is persistent and backend. "The most effective
agentic applications use both." Arcade as an optional live MCP context provider fits that
split. Arcade on the credential-free judging path does not. The FAQ says no specific paid tool is
required, and the AI-use FAQ forbids faking what is running.

Registration surface in the current draft and Chrome docs is
`document.modelContext.registerTool`. Cloudflare Browser Run docs still show
`navigator.modelContextTesting.listTools()` and `navigator.modelContext`, last updated
23 April 2026. That is stale relative to the August draft. Do not copy it.

Constraints that matter for this repo:

- Secure context. Origin-keyed agent cluster. `registerTool` rejects with
  `SecurityError` if origin isolation is off.
- Permissions Policy `tools` defaults to `'self'`. Cross-origin iframes need
  `allow="tools"`. Tools are not exposed cross-origin unless `exposedTo` lists a
  trustworthy origin.
- Tools die with the document. Chrome: "Once the user navigates away from your site or
  closes the tab, the agent cannot access your site or take actions."
- Chrome size budgets: 30 characters for names, 500 for tool descriptions, 150 for
  parameter descriptions, 1.5K per tool output.
- Use `readOnlyHint` only when the tool does not change state. Use
  `untrustedContentHint` when output includes UGC or externally sourced data. Catalog
  copy is that.
- Chrome: "Headless browsing scenarios: While it may be possible to run WebMCP tools
  in headless environments, this API is primarily designed for local browser workflows
  with a human in the loop." Cloudflare Browser Run is a lab for agents driving Chrome.
  It is not the judging client. Judges are told to use ChatGPT's in-app browser or
  Chrome with `chrome://flags/#enable-webmcp-testing`.

The spec names the privacy failure Vitrine is built against. Section 6.3.3, "Privacy
Leakage Through Over-Parameterization," contrasts a benign `search-dresses` tool with
`size` and `maxPrice` against a malicious one that also asks for age, pregnancy,
location, height, skin tone, and previous purchases. Agents fill the fields from
personalization context. The site logs a profile. The
[security questionnaire](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md)
repeats this in answer 03.

The spec's own e-commerce use case already keeps occasion off the store. Maya asks for
dresses in her size for a cocktail-attire wedding. The page tool is `get-dresses` with
optional `size` and `color`. The agent translates size from profile context, then
filters the JSON against the wedding. `show-dresses` updates the visible grid. The
store never receives the wedding.

Chrome evals use clothing as the end-to-end journey: "I am looking to buy a black
jacket and a pair of jeans." Expected calls: `navigate_to_category`, `search_clothes`,
`get_product_details`.

The rules even paste a `search_products` `registerTool` snippet as the shape a repo
should contain. A single catalog search named like that is the boilerplate, not the
product.

## What official examples actually look like

They reward a human UI and agent tools sharing one session. They do not reward a
privacy receipt.

**OpenAI showcase.** [Verdant Market](https://developers.openai.com/showcase/verdant-market),
author OpenAI: 110 groceries, product pages, shared cart, checkout preview, 9 site
tools. "An agent can explore the product catalog, inspect items, and build the cart
through WebMCP." The initial prompt asks for browsing, search, inspect, and cart
management, hosted on Sites. Related storefronts on the same showcase include Field
Day, Kiln, and Scent Cartography. OpenAI's featured marketing tiles are 3D, writing,
crosswords, WanderNote, and data exploration. Commerce is present. It is not unique.

**Cloudflare coffee store.** Shared Zustand cart for UI and tools. Declarative roast
filter. Imperative `add_to_cart`, `remove_from_cart`, `update_cart_quantity`. Login-gated
`checkout` that clears the cart and throws confetti. No backend, no payments.
Progressive enhancement if WebMCP is missing. Suggested demo is filter, add, persist,
then check out after login.

**Vercel shop.** PR 498 added four hand-rolled tools: product search, options,
guest-cart reads, add-to-cart. Bounded outputs, no cart IDs or checkout URLs in tool
results, `AbortSignal` cleanup. PR 504 reverted that and mounted Shopify Hydrogen's
`webmcp.js` behind `webmcp.isEnabled`. The official Vercel storefront example is now
Shopify's tools, not a custom privacy architecture. Jude Gao opened 498. That is
implementation history, not a scoring hint.

**Shopify WebMCP tools.** On every Liquid storefront and Hydrogen developer preview,
no install: `search_catalog`, `browse_store`, `get_product`, `show_variant`,
`get_cart`, `update_cart`, `cancel_cart`, `proceed_to_checkout`, `manage_orders`,
`search_shop_policies_and_faqs`. Cart tools call the same `Shopify.actions` the theme
uses. "Everything the agent does happens in the tab the shopper is looking at."
Shopify also documents a separate Storefront MCP server. That is backend MCP, not
WebMCP.

**Chrome demos.** zaMaker pizza, travel search, French bistro forms, sports shop,
Luxe Leather bags, Morning Ritual coffee, CineFlow tickets, hotel chain with
human confirmation on `complete_booking`. The pattern is: tools mutate the thing the
person can see, and consequential steps wait.

**Service-worker grocery sketch.** Search, `addToCart`, `placeOrder` that opens
checkout so the agent never sees payment. Not in the shipping API. Do not build on it
for this deadline.

None of these examples show a merchant receipt of withheld fields. None keep budget
off `maxPrice`. The spec's Maya example is the closest cousin, and even that still
lets `get-dresses` take size.

## How the criteria map onto Vitrine

Vitrine's intended product, from the ticket spec: an agent uses private fixture
context, Dad, October, Scotland trip, budget, later emails and calendar, to find a
jacket. The merchant HTTP adapter accepts only `category`, `size`, `features`,
`colors`. The Seam renders the adapter's accepted request. Tools register on the
top-level page via `document.modelContext`. Arcade is optional and live when configured. The judging path is
credential-free.

| Criterion             | Official text                                 | Fit if that product ships                                                                                                                  | Miss if it does not                                                                               |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Stage one             | Theme plus real WebMCP APIs                   | Top-level `registerTool`, agent can search, UI updates                                                                                     | Tools missing in ChatGPT's browser, or a narrated mock                                            |
| WebMCP Leverage       | Thorough, skillful, non-trivial               | Schema that cannot represent private fields; shared human/agent command; server receipt; maybe a second UI-update tool like `show-dresses` | One `search_products` wrapper, or tools that do not change the page                               |
| Execution             | Coherent product, not a PoC                   | Guided fixture run, visible jackets, truthful Arcade status, live URL                                                                      | Current placeholder page; a demo that only works with a voiceover                                 |
| Potential Impact      | Specific problem, real audience, demonstrated | Gift shopping without turning family context into merchant data, proven by the receipt                                                     | Privacy essay; Seam written on the client; raw source data sent to the merchant                   |
| Creativity & Ambition | Novel vs existing concepts                    | Disclosure as the product                                                                                                                  | Another storefront next to Verdant Market, coffee-store, Shopify's ten tools, and the jacket eval |

The optional Arcade path is the Chrome "use both" architecture. Fixtures remain the Execution and
FAQ move. Do not imply a live Gmail or calendar connection.

Skip checkout. The spec's misrepresentation example is `finalizeCart` whose description
says it finalizes the cart and whose body `triggerPurchase()`. Chrome says purchases
are sensitive and can request user interaction. The challenge does not require an
order. A confirmation-free purchase would pick a fight with the security chapter for
no score.

## What would make this the wrong play

**It looks like the examples.** A jacket grid, `search_products`, add to cart, done.
Creativity asks whether the project differs from existing concepts. Official existing
concepts are exactly that.

**The Seam is copy.** Potential Impact scores "based on what's demonstrated." A
client-authored panel that claims the store did not see Dad is not a demonstration.
The receipt has to come from the adapter's accepted request.

**Arcade, Gmail, or calendar on the critical path.** Judges are not required to
authenticate. The FAQ forbids overstating what runs. A broken OAuth screen is an
Execution failure.

**Tools in a cross-origin iframe.** Spec default is `self`. Chrome requires
`allow="tools"` and `exposedTo` for cross-origin discovery. Local project notes in
`docs/SOURCES.md` already found `document.modelContext` on ChatGPT's top-level page
and not in an embedded merchant iframe. That observation is this project's evidence,
not a universal client claim. The submission architecture should not depend on iframe
discovery.

**The name "Passage" on the submitted product.** The FAQ: don't use AI to name the
project; pick something specific because it is the first thing judges see. Vitrine is
the product name in `AGENTS.md`. Keep it.

**No live URL in the two allowed clients.** Stage one can fail for not applying the
APIs. Execution fails if the page is still "Your site is taking shape."

**Checkout without confirmation.** See `finalizeCart` above.

**Editing after 3 September, 1:00 p.m. PT.** Eligibility risk, written twice.

**Treating Browser Run, service workers, or `navigator.modelContext` as the API.**
Judges testing in ChatGPT or flagged Chrome will look for `document.modelContext`.

**Inflating tool count to look thorough.** Chrome evals punish overlapping
descriptions, wrong order, and verbose output. Shopify ships ten storefront tools
because they are a store. Vitrine is a boundary. Extra tools that accept private
fields would recreate the over-parameterization attack the spec wrote down.

## Exact quotes that matter

Challenge theme, Devpost and OpenAI:

> The WebMCP Challenge invites you to build something we haven’t seen before: an app
> that becomes meaningfully better when people and their agents can use it together.

Leverage:

> How thoroughly and skillfully does the project use WebMCP? Does the code reflect
> genuine effort and a working, non-trivial implementation?

Execution:

> a complete, coherent product experience — not just a technical proof of concept

Impact:

> solving a real problem for a real audience — and does the solution actually address
> that problem based on what's demonstrated

Creativity:

> How creative and novel is the concept and does the project differ from existing
> concepts?

FAQ, AI use:

> Don't use AI to: name your project … describe your project in vague, generic terms
> fake or overstate what's actually running

Spec, over-parameterization:

> This creates a personalization-to-fingerprinting pipeline where sites can extract
> private attributes without explicit user consent.

Chrome, MCP vs WebMCP:

> WebMCP provides a high-fidelity way for a browser-based AI agent to interact with
> the specific world the user sees in their tab.

Chrome, purchases:

> Some actions may be sensitive, such as making a purchase. You can include a command
> to request user interaction with a confirmation dialog.

Shopify:

> The tools act on the shopper's live session. … Everything the agent does happens in
> the tab the shopper is looking at.

Verdant Market:

> An agent can explore the product catalog, inspect items, and build the cart through
> WebMCP. It works with structured product and cart details while you browse and
> review the same shopping choices.

## Bottom line

The challenge wants a working WebMCP product where a person and an agent share one
page. The spec's shopping example already keeps occasion off the store tool. The
spec's privacy chapter uses that same dress search as the attack. Chrome tells you to
pair MCP context with tab-bound WebMCP. Official storefronts already cover "agent can
shop."

Vitrine is the play if the hosted app, the video, and the repo all prove one sentence,
with a server receipt on screen:

The agent used Dad, Scotland, October, and the budget. The store received a jacket
brief. Here is what the merchant adapter accepted.

If the submission is a nicer catalog than Verdant Market, it is the wrong play. If the
page is still a placeholder on 3 September, it is not a play at all.
