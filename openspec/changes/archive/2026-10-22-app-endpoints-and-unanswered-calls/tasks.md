## 1. Spec

- [x] 1.1 voice-session: an app's endpoint is a `ws://` or `wss://` URL, checked by the Applications API at create and update; the legacy gRPC scenario removed
- [x] 1.2 voice-session: the AppBridge watch of unanswered outbound calls removed
- [x] 1.3 control-plane: unanswered outbound calls are recorded as failed from the node's `call.ended`

## 2. Cases

- [x] 2.1 APB-041 proves the endpoint check (create and update, through the apiserver's handlers)
- [x] 2.2 API-071 proves the failed record and `call.failed` of an unanswered outbound call
