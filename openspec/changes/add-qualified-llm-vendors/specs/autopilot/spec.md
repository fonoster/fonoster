# Spec Delta

## ADDED Requirements

### Requirement: Language models run at their lowest reasoning level

Autopilot SHALL run every language model at the lowest reasoning level its catalog entry declares, and
agents SHALL NOT be able to raise it. A model with the feature `reasoning` SHALL be sent effort
`none`, a model with the feature `reasoning-low` SHALL be sent effort `low` with reasoning left out
of the response, and an Anthropic model SHALL be sent with thinking disabled.

#### Scenario: A model that can turn reasoning off

- **WHEN** an agent names a model with the feature `reasoning`
- **THEN** each request carries `reasoning_effort` `none` and `max_completion_tokens`, not `max_tokens`

#### Scenario: A model that can only lower reasoning

- **WHEN** an agent names a model with the feature `reasoning-low`
- **THEN** each request carries `reasoning_effort` `low` and `include_reasoning` `false`

#### Scenario: An Anthropic model

- **WHEN** an agent names a model served by the `anthropic` adapter
- **THEN** each request carries `thinking` of type `disabled`

### Requirement: Temperature only reaches models that take it

Autopilot SHALL leave temperature out of the request for a model with the feature `fixed-sampling`,
whatever the agent config holds, and the call SHALL go on normally.

#### Scenario: Stored temperature on a model that does not take it

- **WHEN** an agent with `temperature` 0.4 names a model with the feature `fixed-sampling`
- **THEN** the request has no `temperature` field
- **AND** the agent config still holds `temperature` 0.4

#### Scenario: A model that takes temperature

- **WHEN** an agent with `temperature` 0.4 names a model without the feature `fixed-sampling`
- **THEN** the request has `temperature` 0.4

### Requirement: Anthropic models through a native adapter

The `anthropic` adapter SHALL stream replies and tool calls from the Messages API with the same
behavior as other language models: a rejected key fails the call at once, 429 and 5xx map to
`provider_unavailable`, and 400 and 422 map to `bad_message`. It SHALL ask for prompt caching, and it
SHALL report token usage so that cached tokens are part of the input tokens.

#### Scenario: A tool round

- **WHEN** the stand-in vendor streams a `tool_use` block for `getHours` and the tool returns `{"open":"9"}`
- **THEN** the next request has the assistant's `tool_use` block followed by a user message with a `tool_result` block for that call
- **AND** no assistant text block is empty

#### Scenario: A call the agent opens

- **WHEN** the agent spoke a first message and the caller answers
- **THEN** the request is accepted by the stand-in vendor's message-order checks and the reply streams

#### Scenario: Caching and usage

- **WHEN** the stand-in vendor reports 10 input tokens, 100 cache read tokens, 5 cache creation tokens and 20 output tokens
- **THEN** the request carried a top-level `cache_control` of type `ephemeral`
- **AND** the reported usage has 115 input tokens, 100 cached tokens and 20 output tokens

#### Scenario: A refusal

- **WHEN** the stand-in vendor ends the stream with `stop_reason` `refusal`
- **THEN** the reply fails and the caller hears the agent's system error message

### Requirement: Google models through a native adapter

The `google` adapter SHALL stream replies and tool calls from the native API with the same behavior as
other language models. It SHALL send back each function call's thought signature unchanged, and SHALL
treat Google's HTTP 400 with `API_KEY_INVALID` as a rejected key.

#### Scenario: A thought signature

- **WHEN** the stand-in vendor returns a function call with `thoughtSignature` `abc`
- **THEN** the next request's replayed function call has the same `thoughtSignature`

#### Scenario: A bad key

- **WHEN** the stand-in vendor answers HTTP 400 with reason `API_KEY_INVALID`
- **THEN** the call fails at once as a rejected key

### Requirement: Evals run models the way calls do

An eval SHALL resolve the agent's model through the catalog, with the same adapter and features as a
live call.

#### Scenario: Eval on a reasoning model

- **WHEN** an eval runs an agent whose model has the feature `reasoning`
- **THEN** the requests carry `max_completion_tokens` and `reasoning_effort` `none`, not `max_tokens`

#### Scenario: A model the catalog does not have

- **WHEN** an eval names a language model that isn't in the catalog
- **THEN** the eval reports an error and the vendor is not called

### Requirement: Evals report time to first token

Each eval step SHALL report the time from the end of the turn to the first token of the reply.

#### Scenario: A reply

- **WHEN** the fake LLM answers a step after 100 ms
- **THEN** the step's report has `first_token_ms` of about 100

### Requirement: Evals can check that no tool is called

An empty `tools` list on a step SHALL mean the model must not call a tool on it. Leaving `tools` out
SHALL skip the check.

#### Scenario: A tool call where none is expected

- **WHEN** a step has `tools: []` and the fake LLM calls a tool
- **THEN** the step fails with a tool count mismatch

### Requirement: Evals can use canned tool results

A step MAY give a `result` for an expected tool, and the test cases MAY give `toolResults` for any step.
The eval SHALL return the step's result first, then the test cases', and `{status: "ok"}` for any other
call. Evals SHALL NOT call tool endpoints.

#### Scenario: A canned result

- **WHEN** a step expects `getHours` with `result` `{"open":"9"}` and the fake LLM calls `getHours`
- **THEN** the next request's tool message holds `{"open":"9"}`

#### Scenario: A tool call with no canned result

- **WHEN** the fake LLM calls a tool the step gives no `result` for
- **THEN** the next request's tool message holds `{"status":"ok"}`
