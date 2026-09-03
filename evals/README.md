# Evals

`evals/*.json` are in the [webmcp-evals](https://www.npmjs.com/package/webmcp-evals) format that
Chrome's demos ship: `messages` plus an ordered `expectedCall` list. `lib/evals.test.ts`
validates every case offline (first expected call is `load_context`; every
`search_products` call has exactly the four public-brief keys; no argument contains a private
value).

## Smoke run on 2026-09-03 12:13 PDT

`webmcp-evals` 0.0.4 `smoke` executes the `expectedCall` list against a live page in Puppeteer
Chrome with no LLM. It ran at integration against the local dev server (`http://localhost:3001`,
merged main with the owner's `.env.local`, so `load_context` read Gmail through Arcade and the
search ran through `Walmart.SearchProducts`).

```sh
npx -y webmcp-evals --chrome-channel chrome smoke -u http://localhost:3001 -e evals/private-shopping.json -v
```

Captured output (product rows are live Walmart results through Arcade and change between runs;
the shortlist is elided here):

```text
[Smoke] Opening fresh page for "private-shopping-brief" at http://localhost:3001...
[Smoke] Case "private-shopping-brief" Step 1/2: Calling tool "load_context" with args: {}
  └─ PASS: Output: {"recipient":"Dad","relationship":"father","destination":"Scotland","dates":"October","weather":"rainy","budgetUsd":250,"size":"XL","features":["waterproof","packable"],"colors":["navy","olive"],"calendarSummary":null,"source":"arcade","arcadeTool":"Gmail.SearchEmailsByQuery"}
[Smoke] Case "private-shopping-brief" Step 2/2: Calling tool "search_products" with args: {"category":"jacket","size":"XL","features":["waterproof","packable"],"colors":["navy","olive"]}
  └─ PASS: Output: {"receipt":{"category":"jacket","size":"XL","features":["waterproof","packable"],"colors":["navy","olive"]},"merchantQuery":"XL waterproof packable navy olive jacket","merchant":"walmart","arcadeRequest":{"tool":"Walmart.SearchProducts","keywords":"XL waterproof packable navy olive jacket"},"shortlist":[ ... ],"truncated":true}

Smoke Test Summary for http://localhost:3001

┌────────────────────────┬──────┬────────┬─────────────────┬───────┐
│ Case                   │ Step │ Status │ Tool            │ Error │
├────────────────────────┼──────┼────────┼─────────────────┼───────┤
│ private-shopping-brief │ 1    │ PASS   │ load_context    │ -     │
├────────────────────────┼──────┼────────┼─────────────────┼───────┤
│ private-shopping-brief │ 2    │ PASS   │ search_products │ -     │
└────────────────────────┴──────┴────────┴─────────────────┴───────┘

Passed steps: 2/2 across 1 case(s).
```

Two things the runs established:

- webmcp-evals 0.0.4 requires the suite file to be a top-level JSON array of cases. A bare case
  object is rejected with `Smoke eval file must contain at least one eval case.` Both files in
  this directory are arrays and `lib/evals.test.ts` asserts that shape.
- The `local` and `browser` commands need a model backend (`--backend vercel|gemini|ollama`) and an
  API key. They were not run; only `smoke` was. `evals/leaky-merchant.json` was validated offline
  only (its `personalize_for_shopper` step needs the Leak demo checkbox on, which `smoke` cannot
  toggle).

`npm run test:evals` runs the command above. Chrome (stable channel) must be installed and the dev
server must be running.
