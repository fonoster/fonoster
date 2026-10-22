# Docs checkpoint: telephony-link-telnyx

Started: 2026-10-22
Current stage: 7, Wire (docs.json edited, lead may rewire)

**Purpose:** Link a Telnyx number (`telephony/link-telnyx`). Reader: Developers with a Telnyx number who want it ringing an agent fast.

**Diátaxis type:** how-to
**Placement:** new · `docs-site/telephony/link-telnyx.mdx` · nav group `Telephony`

**Sources:**
- mods/ctl/src/commands/sipnet/numbers/linkTelnyxNumber.ts
- mods/ctl/src/utils/{linkTelnyxNumberToApplication,telnyxClient}.ts
- mods/ctl/src/constants.ts
- docs-site/telephony/link-twilio.mdx (the flow it mirrors)
- Telnyx docs: SIP Trunking get-started, Authentication Methods, tech-prefix page, OpenAPI spec (team-telnyx/openapi)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | how-to spine, mirrored from link-twilio |
| 4 | Assets | skipped | no images yet; the Twilio page's diagrams have no Telnyx twin |
| 5 | Draft | done | |
| 6 | Proof | done | |
| 7 | Wire | done | docs.json + MENU.md edited |

## Decision log

- 2026-10-22: CLI only; mirrors the Twilio flow (no dashboard flow exists for either).
- 2026-10-22: No access control list: Telnyx FQDN connections authenticate outbound calls by SIP
  credentials (a `407` digest challenge), not by source IP, so the Twilio flow's ACL flag has no
  Telnyx counterpart.
- 2026-10-22: Outbound voice profile created for the caller (the connection routes outbound calls
  through one). Named after the workspace's access key ID; profile names are unique in the Telnyx
  account.
- 2026-10-22: Credentials stored as a Fonoster Credential with the same username/password the
  connection carries, so outbound digest auth works through the trunk.

## Unverified

- Whether Telnyx issues a `407` for the first INVITE when the source IP matches no IP connection
  on the account (expected for a credentials-only account; see LiveKit's note on the same
  behavior).
