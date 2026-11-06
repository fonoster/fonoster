# Spec Delta

## MODIFIED Requirements

### Requirement: Token counts come only from the vendor

LLM and embedding token counts SHALL come from what the vendor reports for each request, never an
estimate. `llm.tokens.in` SHALL hold the input tokens not served from cache, and `llm.tokens.cached`
those that were, so that each token is billed once. A turn the caller interrupts SHALL still be
metered with the vendor's counts for the whole request.

#### Scenario: Vendor reports usage

- **WHEN** the LLM vendor reports 1,200 input tokens, 800 of them cached, and 340 output tokens for a turn
- **THEN** the call's `llm.tokens.in` includes 400, `llm.tokens.cached` includes 800 and `llm.tokens.out` includes 340

#### Scenario: Interrupted turn

- **WHEN** the caller interrupts a reply after two seconds and the vendor's request totals 1,200
  input and 180 output tokens, none cached
- **THEN** the call's token lines include 1,200 input and 180 output tokens for that turn
