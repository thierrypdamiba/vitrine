Feature: Vitrine private shopping

  Vitrine lets an agent use private context to find a relevant gift while the merchant receives only
  ordinary catalog constraints. Private values stay in the vault. The exact accepted request remains
  visible to the shopper.

  @vitrine-private-shopping.PCS1.R1
  Rule: vitrine-private-shopping.PCS1.R1 — The store receives only the catalog constraints needed to search

    @surface.web-app @surface.hosted-site
    Scenario: Search sends only the public brief
      Given the deterministic private context for Dad's Scotland trip
      When the shopper runs the Vitrine search
      Then the merchant receives only category, size, features, and colors

    @rejection @surface.web-app @surface.hosted-site
    Scenario: A private field is rejected at the merchant boundary
      Given a catalog request that includes the private destination
      When the request reaches the merchant adapter
      Then the merchant rejects it without searching inventory

  @vitrine-private-shopping.PCS1.R2
  Rule: vitrine-private-shopping.PCS1.R2 — Private context can improve ranking after the catalog returns

    @surface.web-app @surface.hosted-site
    Scenario: Private context ranks the returned inventory
      Given catalog results with relevant jackets above and below the private budget
      When Vitrine ranks the results for Dad's trip
      Then the shortlist leads with an under-budget waterproof packable jacket

  @vitrine-private-shopping.PCS1.R3
  Rule: vitrine-private-shopping.PCS1.R3 — Human and agent actions change one shared inspectable interface

    @surface.web-app @surface.chatgpt-in-app-browser @surface.chrome-webmcp-testing
    Scenario: Guided and WebMCP searches share visible results
      Given Vitrine can search its deterministic catalog
      When the same public brief is submitted through each entry point
      Then each entry point presents the same products and merchant receipt

  @vitrine-private-shopping.HJ1.R1
  Rule: vitrine-private-shopping.HJ1.R1 — Disclosure evidence comes from the merchant boundary

    @surface.web-app @surface.hosted-site
    Scenario: The Seam shows the merchant receipt
      Given the merchant accepted a public brief
      When Vitrine presents the disclosure Seam
      Then the vault names the withheld private facts and the merchant receipt does not contain them

  @vitrine-private-shopping.HJ1.R2
  Rule: vitrine-private-shopping.HJ1.R2 — WebMCP tools are specific structured tab-bound product actions

    @surface.chatgpt-in-app-browser @surface.chrome-webmcp-testing @surface.hosted-site
    Scenario: WebMCP exposes a narrow product search tool
      Given the browser supports the imperative WebMCP API
      When Vitrine registers its page tools
      Then the catalog search schema excludes every private-context field

  @vitrine-private-shopping.HJ1.R3
  Rule: vitrine-private-shopping.HJ1.R3 — The complete judging path works without third-party credentials

    @rejection @surface.web-app @surface.hosted-site
    Scenario: The guided demo works when WebMCP and Arcade are unavailable
      Given the browser has no WebMCP API and no external context connection
      When the shopper runs the guided demo
      Then Vitrine still presents a relevant shortlist and merchant receipt
