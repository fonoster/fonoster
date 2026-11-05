# Interop evidence

Which interop cases (QA catalog area IOP, `mods/conformance/catalog/areas/interop.md`) each
well-known far end has been seen to pass, with the recording that shows it.

This repository is public. Link only sanitized recordings committed to fonoster/routr
(`interop/<far-end>/`). Never put a production recording's file name, a Call-ID, a phone number
or a host name here.

These are evidence records, not test results: test results go only in the release QA report.
Evidence is `Recorded` (the recording shows the whole case), `Partial: <what is missing>`, or
`None`.

## whatsapp (WhatsApp Business Calling)

| Case | Evidence | Date | Routr version | Recording |
| --- | --- | --- | --- | --- |
| IOP-001 Inbound call to a Number answered, caller hangs up | None | | | |
| IOP-002 Inbound call answered, Fonoster hangs up | None | | | |
| IOP-003 Outbound call from an app answered | None | | | |
| IOP-004 SIP agent outbound call answered | Recorded | 2026-10-25 | v2.28.0 | [sipjs_wa-dod-invite_whatsapp_20261025.jsonl](https://github.com/fonoster/routr/blob/main/interop/whatsapp/sipjs_wa-dod-invite_whatsapp_20261025.jsonl) |
| IOP-005 Outbound call cancelled before answer | Partial: the CANCEL's 200, the 487 and the ACK are not in the recording | 2026-10-25 | v2.28.0 | [sipjs_wa-dod-invite-cancel_whatsapp_20261025.jsonl](https://github.com/fonoster/routr/blob/main/interop/whatsapp/sipjs_wa-dod-invite-cancel_whatsapp_20261025.jsonl) |
| IOP-006 Inbound call cancelled by the caller | None | | | |
| IOP-007 Outbound call busy | None | | | |
| IOP-008 Outbound call declined | None | | | |
| IOP-009 In-dialog re-INVITE with SDP answered | None | | | |
| IOP-010 In-dialog re-INVITE without SDP | None | | | |
| IOP-011 Blind transfer by REFER | None | | | |

The recording `sipjs_register-before-wa-dod-invite_routr_20261025.jsonl` in the same folder is the
SIP agent's registration before its calls: setup, not a case.
