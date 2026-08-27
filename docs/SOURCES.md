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
4. Local browser measurements for behavior in the tested Passage environment only.
5. Official supporter examples as implementation references.
6. DEV Community and other third-party writing as leads and cautionary experience only.

## Challenge sources

- [Devpost overview](https://webmcp.devpost.com/)
- [Devpost resources](https://webmcp.devpost.com/resources)
- [Devpost rules](https://webmcp.devpost.com/rules)
- [OpenAI challenge page](https://openai.com/webmcp-challenge/)

The OpenAI marketing page currently shows opening and deadline times that differ from the Devpost
official rules. Passage uses the rules' September 3, 2026 at 1:00 p.m. Pacific deadline and treats
the earlier cutoff as final.

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
  Passage probe but not its embedded Vitrine iframe.
- This observation supports top-level registration for this build. It does not override the spec's
  same-origin and `allow="tools"` iframe model or claim universal client behavior.

## Refresh triggers

Recheck the primary sources before changing the WebMCP API surface, release testing instructions,
browser-version claims, hosting headers, submission contents, or deadline-sensitive actions.
