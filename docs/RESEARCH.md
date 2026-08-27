# Community research notes

Community writing is useful for identifying failure modes and implementation patterns, but it is
secondary evidence. When an article conflicts with the current specification or Chrome docs, follow
the primary source.

## DEV Community findings

- [WebMCP: A Browser-Native Execution Model for AI Agents](https://dev.to/astrodevil/webmcp-a-browser-native-execution-model-for-ai-agents-125n)
  gives a clear account of the architectural benefit: structured browser tools avoid brittle DOM
  actuation while retaining the page session and visible UI.
- [WebMCP Reality Check: Where the Spec Actually Stands](https://dev.to/studiomeyer_io/webmcp-reality-check-where-the-spec-actually-stands-4gh1)
  usefully warns that WebMCP is a Community Group draft and that browser support is still
  experimental. Compatibility claims in the article age quickly and must be checked against the
  repository's implementation-status file.
- [Implementing WebMCP on a Recruitment Website](https://dev.to/richardbaxter/implementing-webmcp-on-a-recruitment-website-19a)
  reinforces feature detection, concise registered tools, and testing with the inspector.
- [I Defend Networks for a Living. Google I/O 2026 Just Changed My Threat Model](https://dev.to/byron_lainez/i-defend-networks-for-a-living-google-io-2026-just-changed-my-threat-model-3bkm)
  is a useful reminder that structured tools reduce UI ambiguity but do not remove prompt-injection
  or data-exfiltration risk.

## Decisions informed by the community scan

- Ship a fully usable non-WebMCP interface and register tools as progressive enhancement.
- Prefer a few high-value capabilities to a large catalog of thin tools.
- Keep merchant content out of tool metadata and treat returned catalog text as untrusted.
- Use `document.modelContext`, the current specification surface. Many older articles demonstrate
  `navigator.modelContext`; their code is not the project's API authority.
- Recheck implementation status before release instead of freezing browser-version claims in UI
  copy.
