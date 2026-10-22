# Proposal

## Why

Bringing the AppBridge QA area up to date (#1108) left two voice-session scenarios the product
can't satisfy as written:

- "Legacy gRPC voice apps are not dialed" describes an app record that has a gRPC endpoint and no
  WebSocket URL. There's no such app: the Applications API takes only a `url`, and it must be
  `ws://` or `wss://`. The scenario describes a thing that does not exist, and the rule that makes
  it not exist (the API refuses any other endpoint) was nowhere in the spec.
- "Room ends or node dies before the answer" says AppBridge watches an unanswered outbound call.
  Since redesign-roomr, an outbound call opens a control stream only when the callee answers, so
  no AppBridge ever hears of an unanswered one. The control plane records it from the node's
  `call.ended` (`mods/apiserver/src/webhooks/nodeCallEvents.ts`). A node that dies before the
  answer is a deployment concern (#1107), not specified here.

## What Changes

- voice-session "An app is a WebSocket URL, a protocol and speech defaults": an app's endpoint
  SHALL be a `ws://` or `wss://` URL; the Applications API MUST refuse anything else at create and
  at update with `INVALID_ARGUMENT` naming the field, and leave the app unchanged. Three scenarios.
- voice-session "Sessions are delivered over WebSocket only": the gRPC wording and the legacy
  scenario go.
- voice-session "Outbound sessions open at answer": the scenario "Room ends or node dies before the
  answer" goes.
- control-plane: new requirement "Unanswered outbound calls are recorded as failed".

No product change: the API already refuses non-WebSocket URLs, and the control plane already
records unanswered calls. The cases are APB-041 and API-071.
