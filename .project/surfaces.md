# Surfaces

## Web app

**Kind:** UI client
**Audience:** Privacy-conscious shopper (PCS)
**Examples:** Passage dashboard, privacy seam, dress results

## ChatGPT in-app browser

**Kind:** Agent runtime
**Audience:** Privacy-conscious shopper (PCS), Hackathon judge (HJ)
**Examples:** Top-level `document.modelContext` tools
**Coverage notes:** Agent-facing tools must register without relying on iframe WebMCP.

## Chrome WebMCP testing

**Kind:** Agent runtime
**Audience:** Hackathon judge (HJ)
**Examples:** Chrome 149 origin trial or local Chrome with the WebMCP testing flag enabled
**Coverage notes:** Use the DevTools Application → WebMCP panel to inspect registered tools, schemas,
inputs, outputs, errors, and invocation history.

## Hosted Site

**Kind:** Deployment mode
**Audience:** Hackathon judge (HJ)
**Examples:** Public HTTPS deployment with no required credentials
**Coverage notes:** Must preserve origin isolation and expose the same product behavior to humans and
WebMCP agents.
