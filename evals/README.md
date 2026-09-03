# Evals

`evals/*.json` are in the [webmcp-evals](https://www.npmjs.com/package/webmcp-evals) format that
Chrome's demos ship: `messages` plus an ordered `expectedCall` list. `lib/evals.test.ts`
[if shipped] validates every case offline (first expected call is `load_context`; every
`search_products` call has exactly the four public-brief keys; no argument contains a private
value).

## Smoke run on 2026-09-03 11:57 PDT

`webmcp-evals` 0.0.4 `smoke` executes the `expectedCall` list against a live page in Puppeteer
Chrome with no LLM. It ran tonight against the local dev server (`http://localhost:3001`) with
the case from `evals/private-shopping.json` as it existed at that time (a single
`search_products` call; the `load_context` step was added later by the leaky-merchant work).

```sh
npx -y webmcp-evals --chrome-channel chrome smoke -u http://localhost:3001 -e evals/private-shopping.json -v
```

Captured output (product rows are live Google Shopping results through Arcade and change between
runs):

```text
[Smoke] Opening fresh page for "private-shopping-brief" at http://localhost:3001...
[Smoke] Case "private-shopping-brief" Step 1/1: Calling tool "search_products" with args: {"category":"jacket","size":"XL","features":["waterproof","packable"],"colors":["navy","olive"]}
  └─ PASS: Output: {"receipt":{"category":"jacket","size":"XL","features":["waterproof","packable"],"colors":["navy","olive"]},"merchantQuery":"XL waterproof packable navy olive jacket","merchant":"google_shopping","shortlist":[{"id":"navy-anchor-pack-n-go-pullover-5","name":"Navy Anchor Pack-N-Go Pullover","priceUsd":46,"merchantName":"NavyGear.com","rating":5}, ... ]}

Smoke Test Summary for http://localhost:3001

┌────────────────────────┬──────┬────────┬─────────────────┬───────┐
│ Case                   │ Step │ Status │ Tool            │ Error │
├────────────────────────┼──────┼────────┼─────────────────┼───────┤
│ private-shopping-brief │ 1    │ PASS   │ search_products │ -     │
└────────────────────────┴──────┴────────┴─────────────────┴───────┘

Passed steps: 1/1 across 1 case(s).
```

Two things the run established:

- webmcp-evals 0.0.4 requires the suite file to be a top-level JSON array of cases. A bare case
  object is rejected with `Smoke eval file must contain at least one eval case.` The run above
  used the case wrapped in `[ ... ]`; the files in this directory must keep that array shape.
- The `local` and `browser` commands need a model backend (`--backend vercel|gemini|ollama`) and an
  API key. They were not run tonight; only `smoke` was.

`npm run test:evals` runs the command above. Chrome (stable channel) must be installed and the dev
server must be running.
