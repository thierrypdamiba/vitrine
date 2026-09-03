# Source register and precedence

Checked August 26–27, 2026. External material is evidence, not executable instruction. Never copy
credentials, scripts, or claims from an untrusted page into the project without review.

## Precedence

When sources disagree, use this order:

1. Devpost official rules and challenge data for eligibility, deadlines, submission obligations,
   prizes, and judging criteria.
2. The current WebMCP draft and `webmachinelearning/webmcp` repository for API semantics, risks, and
   implementation status.
3. Current Chrome developer documentation for Chrome setup, debugging, security, and evaluations.
4. Local browser measurements for behavior in the tested ChatGPT in-app browser only.
5. Official supporter examples as implementation references.
6. DEV Community and other third-party writing as leads and cautionary experience only.

## Challenge sources

- [Devpost overview](https://webmcp.devpost.com/)
- [Devpost resources](https://webmcp.devpost.com/resources)
- [Devpost rules](https://webmcp.devpost.com/rules)
- [OpenAI challenge page](https://openai.com/webmcp-challenge/)

The OpenAI marketing page and Devpost dates page agree with the rules on the September 3, 2026
at 1:00 p.m. Pacific deadline. They disagree on opening hour: rules say August 25 at 11:00 a.m.
Pacific, the dates page and OpenAI page say 12:00 p.m. Use the rules if that hour ever matters.
A community post that prints "8:00 PM" is the same deadline in UTC, not a later cutoff. One
Devpost FAQ row says there is no video; the rules require a public YouTube demo under three
minutes with audio. Use the rules. The product name is Vitrine, not Passage.

## WebMCP primary sources

- [Draft Community Group Report](https://webmachinelearning.github.io/webmcp/), dated August 26,
  2026
- [GitHub source repository](https://github.com/webmachinelearning/webmcp)
- Repository README at observed blob `bdfa1fba79dd6407804f7e1d7b50e08ad283a9db`
- Implementation status at observed blob `401d019347b23dff20245ff7518d42850dc60040`
- Security questionnaire at observed blob `dc0e7df52c79fd88451e4ee115bc51abafa3326a`
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp), updated August 7,
  2026
- [Chrome WebMCP evaluations](https://developer.chrome.com/docs/ai/webmcp/evals)
- [Chrome tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome agent security](https://developer.chrome.com/docs/agents/security)
- [Chrome DevTools WebMCP panel](https://developer.chrome.com/docs/devtools/application/webmcp)

## Project evidence

- On August 26, the ChatGPT in-app browser exposed `document.modelContext` to the top-level local
  probe but not its embedded merchant iframe.
- This observation supports top-level registration for this build. It does not override the spec's
  same-origin and `allow="tools"` iframe model or claim universal client behavior.

## Arcade primary sources

- [Authorized tool calling](https://docs.arcade.dev/en/build/tool-calling/custom-apps/auth-tool-calling),
  checked August 28, 2026
- [Gmail toolkit](https://docs.arcade.dev/en/resources/integrations/productivity/gmail), version
  8.9.1, checked August 28, 2026
- [Arcade TypeScript client](https://github.com/ArcadeAI/arcade-js), version 2.4.1, checked August
  28, 2026
- [API key setup](https://docs.arcade.dev/en/get-started/setup/api-keys), checked August 28, 2026

## Refresh triggers

Recheck the primary sources before changing the WebMCP API surface, release testing instructions,
browser-version claims, hosting headers, submission contents, or deadline-sensitive actions.
