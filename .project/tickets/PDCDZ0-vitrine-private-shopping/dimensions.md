# Behavioral Dimensions: Vitrine private shopping

| Dimension | Partitions and boundaries | Coverage |
| --- | --- | --- |
| Merchant disclosure | exact public fields; one forbidden private field; missing required field | acceptance rejection plus lower-level schema matrix |
| Private-side usefulness | relevant under-budget match; returned item over private budget | private ranking scenario |
| Invocation path | guided human run; WebMCP tool call; WebMCP unavailable | shared-interface and fallback scenarios |
| Evidence source | server-accepted request; client explanatory state | merchant-receipt scenario requires the server value |
| Runtime surface | web app; ChatGPT in-app browser; Chrome WebMCP testing; hosted Site | surface tags on shared UI and tool-schema scenarios |
| External dependencies | deterministic fixtures; unavailable third-party credentials | fallback scenario and build verification |

The exhaustive malformed-payload matrix belongs in lower-level contract tests. Acceptance scenarios
retain the meaningful privacy rejection: a merchant request containing a private field.
