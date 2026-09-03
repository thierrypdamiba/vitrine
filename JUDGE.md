# Judge path (60 seconds)

Vitrine is a jacket shop that never learns why you are shopping. The agent belongs to the person:
it reads the shopper's private gift notes and translates them into four neutral catalog fields on
the person's side. The shop publishes a schema with no room for the reason and prints a receipt of
what it received. No login, no credentials.

## Client

Either of:

- ChatGPT desktop app, in-app browser, model GPT-5.6 Sol or Terra (not Luna), Settings > Browser >
  Permissions > Enable site tools.
- Chrome 149 or newer with `chrome://flags/#enable-webmcp-testing` enabled and relaunched.

## The prompt

Click **Copy agent prompt** in the sidebar, or paste this exactly:

```text
I'm shopping on this jacket site. Call load_context to read my gift notes. Then call search_products with only what its schema allows, compare two of the results, and prepare the best one for me to open.
```

The prompt contains no private fact. If the agent declines `load_context`, use the fallback:
"He is XL, likes navy or olive, needs waterproof and packable." The receipt still shows four keys.

## Steps

1. **Open the live URL** from the Devpost entry (or `npm install && npm run dev`, port 3001, and
   open http://localhost:3001). The sidebar's **The seam** reads "Agent knows 0 facts / Shop received 0
   fields"; **Vault** reads "Sealed"; the grid shows the 12-jacket browse catalog. No search has run.
2. **Paste the prompt** into the agent.
3. **Look at three things** while it runs:
   - **Vault** fills with nine facts (recipient, relationship, destination, dates, weather, size,
     features, colors, budget), labeled "from Arcade Gmail" when Arcade is configured on the host
     or "demo fixture" when it is not. The count flips to "Agent knows 9 facts".
   - **Shop received** prints the literal request body the merchant adapter accepted, exactly four
     keys (`category`, `size`, `features`, `colors`), the line `200 · accepted by the merchant
adapter`, and the exact Arcade call the server made (`{"tool":"...","input":{"keywords":"XL
waterproof packable navy olive jacket"}}`). "Shop received 4 fields". Every number there
     comes from a response the server sent, not from client state.
   - **Agent can call now** grows as the page state advances: `compare_products` after a search
     returns, `prepare_selection` after two ids are compared. `prepare_selection` never navigates;
     opening the listing is a 700 ms press-and-hold on the page.
4. **Try to leak.** Click the button under **Shop received**. The sidebar shows the body it sent
   with `destination` and `budgetUsd` added on purpose and the adapter's literal
   `400 {"error":"Merchant rejected unexpected fields: destination, budgetUsd"}`. The grid and the
   receipt do not change.
5. **Chrome only: open DevTools > Application > WebMCP.** `search_products` shows an input schema
   with four enum properties and `additionalProperties: false`; there is no property for an
   occasion, a note, or a budget. The declarative `filter_jackets` form tool is listed here and
   not in ChatGPT, whose browser does not expose form tools.

## Optional: the over-parameterized tool

The **Leak demo (demonstration only)** checkbox at the bottom of the sidebar registers
`personalize_for_shopper`, the tool from WebMCP draft section 6.3.3 that asks for everything. Copy
the leak prompt beside it. Watch the same agent volunteer the facts the moment a schema asks, while
the strict receipt still shows four keys. ChatGPT's safety review may decline the tool; nothing it
receives leaves the page. It is off by default and is not product behavior.

## Verify from a terminal

```sh
npm test            # 109 unit tests, including "no private field in any tool schema"
npm run test:bdd    # 8 Gherkin scenarios
npm run check:ssr   # prints 0: no private value in the server-rendered HTML (dev server on :3001)
```

Details: [README.md](README.md), [docs/SUBMISSION.md](docs/SUBMISSION.md).
