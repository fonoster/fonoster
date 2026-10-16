# Build log: add-talk-in-browser

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-15

### TB-B1. Read Routr 2.15.1 instead of trusting the legacy flow

- Extracted `@routr/connect` and `@routr/rtprelay` from `fonoster/routr-one:2.15.1`. A connect
  token makes the caller an anonymous agent and the callee the Peer whose `aor` is the token's
  `aorLink` (AGENT_TO_PEER, normal location lookup). The relay already maps WebRTC to `RTP/AVP`
  through RTPEngine. So no Routr change is needed: only config (ws transport, verifier key).
- The token's `domain` (`internal`) doesn't exist in Routr; for AGENT_TO_PEER it isn't used.
