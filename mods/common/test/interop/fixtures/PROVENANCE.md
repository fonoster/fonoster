# Interop fixtures

Real calls, copied unchanged from fonoster/routr at commit a37b2bf8a (already sanitized there):

| File | Routr path |
| --- | --- |
| seet-provider_sc-1.3.2-did-invite_agent-1001_20261023.jsonl | etc/corpus/ |
| sipp-peer-asterisk_dod-invite-route-by-alias_provider_20261030.jsonl | etc/corpus/ |
| seet-agent-1001_rr-1.2.1-dod-declined_provider_20261023.jsonl | etc/corpus/ |
| seet-agent-1001_sc-12.2.1-dod-reinvite_provider_20261023.jsonl | etc/corpus/ |
| seet-agent-1001_register-before-sc-12.2.1-dod-reinvite_routr_20261023.jsonl | etc/corpus/ |
| sipjs_wa-dod-invite_whatsapp_20261025.jsonl | interop/whatsapp/ |
| sipjs_wa-dod-invite-cancel_whatsapp_20261025.jsonl | interop/whatsapp/ |

`synthetic_*` files are hand-written for cases no recording covers yet, derived from the real calls
above, with addresses moved to documentation ranges (198.51.100.0/24, 203.0.113.0/24). They are
never evidence: evidence is a real call in fonoster/routr `interop/<far-end>/`.

| File | Built from | Case |
| --- | --- | --- |
| synthetic_did-invite-callee-bye_provider.jsonl | the inbound call, BYE from the callee | IOP-002 |
| synthetic_did-invite-cancel_provider.jsonl | the inbound call, cancelled before the answer | IOP-006 |
| synthetic_dod-invite-busy_provider.jsonl | the declined call, answered 486 | IOP-007 |
| synthetic_dod-reinvite-no-sdp_provider.jsonl | the re-INVITE call, offer in the 200 | IOP-010 |
| synthetic_dod-refer_provider.jsonl | the re-INVITE call, a REFER, 202 and NOTIFY | IOP-011 |
