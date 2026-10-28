# Twilio link baseline, 2026-10

Recorded by `mods/common/scripts/twilio-baseline.ts` (#1172). Requests are in
`baseline-2026-10.jsonl`. `old` is today's `linkTwilioNumberToApplication`; `new` is
`provisionTwilioTrunk` then `assignTwilioNumberToTrunk`.

Label: `wo0utfvf1jnlort935eh6e3xk5ltja3o46` (a dev stack workspace made for the run).
Account back to its pre-run state at the end: **yes**.

| Step | Run | Outcome | Left in Twilio and Fonoster before cleanup |
| :--- | :--- | :--- | :--- |
| a | old | ok | trunk Trunk-wo0utfvf1jnlort935eh6e3xk5ltja3o46 (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com): 1 ACL, 1 origination URL, 0 credential list<br>ACL ACL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 192.168.1.50/32<br>number on trunk of this run<br>Fonoster number tel:+18559473625<br>Fonoster trunk Twilio Trunk (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.fonoster.local) |
| a | new | ok {"twilioTrunkSid":"TK6855c4a4b01b63ed6b49f03aac73cec7","terminationHost":"wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com"} | trunk Trunk-wo0utfvf1jnlort935eh6e3xk5ltja3o46 (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com): 1 ACL, 1 origination URL, 1 credential list<br>ACL ACL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 192.168.1.50/32<br>credential list CL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 1 credential<br>number on trunk of this run |
| b | old | ok | trunk Trunk-wo0utfvf1jnlort935eh6e3xk5ltja3o46 (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com): 1 ACL, 1 origination URL, 0 credential list<br>ACL ACL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 192.168.1.50/32<br>number on trunk of this run<br>Fonoster number tel:+18559473625<br>Fonoster trunk Twilio Trunk (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.fonoster.local) |
| b | new | ok {"twilioTrunkSid":"TK69474794325730251975a1e0178e7f64","terminationHost":"wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com"} | trunk Trunk-wo0utfvf1jnlort935eh6e3xk5ltja3o46 (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com): 1 ACL, 1 origination URL, 1 credential list<br>ACL ACL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 192.168.1.50/32<br>credential list CL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 1 credential<br>number on trunk of this run<br>Fonoster number tel:+18559473625<br>Fonoster trunk Twilio Trunk (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.fonoster.local) |
| b | new-again | ok {"twilioTrunkSid":"TK69474794325730251975a1e0178e7f64","terminationHost":"wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com"} | trunk Trunk-wo0utfvf1jnlort935eh6e3xk5ltja3o46 (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com): 1 ACL, 1 origination URL, 1 credential list<br>ACL ACL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 192.168.1.50/32<br>credential list CL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 2 credential<br>number on trunk of this run<br>Fonoster number tel:+18559473625<br>Fonoster trunk Twilio Trunk (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.fonoster.local) |
| c | old | ok | trunk Trunk-wo0utfvf1jnlort935eh6e3xk5ltja3o46 (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com): 1 ACL, 1 origination URL, 0 credential list<br>ACL ACL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 192.168.1.50/32<br>number on trunk of this run<br>Fonoster number tel:+18559473625<br>Fonoster trunk Twilio Trunk (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.fonoster.local) |
| c | new | ok {"twilioTrunkSid":"TK47fbad09be73c9518d7d52f6c238e3f0","terminationHost":"wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com"} | trunk Trunk-wo0utfvf1jnlort935eh6e3xk5ltja3o46 (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com): 1 ACL, 1 origination URL, 1 credential list<br>ACL ACL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 192.168.1.50/32<br>credential list CL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 1 credential<br>number on trunk of this run |
| d | old | error: Failed to create resources: Authorization Error: no requested permission | trunk Trunk-wo0utfvf1jnlort935eh6e3xk5ltja3o46 (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com): 0 ACL, 0 origination URL, 0 credential list<br>ACL ACL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 192.168.1.50/32<br>number on trunk unchanged (original) |
| d | new | PERMISSION_MISSING at trunking.trunks.ipAccessControlLists.list: Twilio answered 401 (code 70051): Authorization Error: no requested permission | trunk Trunk-wo0utfvf1jnlort935eh6e3xk5ltja3o46 (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com): 0 ACL, 0 origination URL, 0 credential list<br>ACL ACL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 192.168.1.50/32<br>number on trunk unchanged (original) |
| e | old | error: Error checking SIP trunk existence: Authorization Error: required permission twilio/voice/sip.trunks/list is missing | number on trunk unchanged (original) |
| e | new | PERMISSION_MISSING at trunking.trunks.list: Twilio answered 401 (code 70051): Authorization Error: required permission twilio/voice/sip.trunks/list is missing | number on trunk unchanged (original) |
| f | old | error: The number +18005550199 was not found in your account. | number on trunk unchanged (original) |
| f | new | NUMBER_NOT_FOUND at incomingPhoneNumbers.list: The number +18005550199 is not in this Twilio account | number on trunk unchanged (original) |
| g | old | error: Error checking ownership of phone number: authentication failed, auth token is not valid for account AC00000000000000000000000000000001 | number on trunk unchanged (original) |
| g | new | CREDENTIALS_REFUSED at incomingPhoneNumbers.list: Twilio answered 401 (code 20003): authentication failed, auth token is not valid for account AC00000000000000000000000000000001 | number on trunk unchanged (original) |
| i | parent | ok {"twilioTrunkSid":"TK6526717aa22897f18280ea4528ffa63d","terminationHost":"wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com"} | trunk Trunk-wo0utfvf1jnlort935eh6e3xk5ltja3o46 (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com): 1 ACL, 1 origination URL, 1 credential list<br>ACL ACL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 192.168.1.50/32<br>credential list CL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 1 credential<br>number on trunk of this run |
| i | subaccount | error 400 code 400: Bad Request | trunk Trunk-wo0utfvf1jnlort935eh6e3xk5ltja3o46 (wo0utfvf1jnlort935eh6e3xk5ltja3o46.pstn.twilio.com): 1 ACL, 1 origination URL, 1 credential list<br>ACL ACL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 192.168.1.50/32<br>credential list CL-wo0utfvf1jnlort935eh6e3xk5ltja3o46: 1 credential<br>number on trunk of this run |
## Findings

- **Restricted keys can't complete the link.** Step d's key had every permission the console
  offers for this flow: Phone-numbers `active-numbers` list and update; Voice `sip.ip-acls`,
  `sip.ip-acls.ip-addresses`, `sip.credential-lists`, `sip.credential-lists.credentials`; and the
  trunking permissions the console lists under Voice (`sip.trunks`,
  `sip.trunks.auth.calls.credential-list-mappings`, `sip.trunks.auth.calls.ip-acl-mappings`,
  `sip.trunks.origination-urls`). Twilio still refuses the trunk's IP ACL association
  (`GET`/`POST /v1/Trunks/{sid}/IpAccessControlLists`) with "no requested permission": no
  grantable permission covers it. The new code stops there with `PERMISSION_MISSING` at
  `trunking.trunks.ipAccessControlLists.list`; the old code fails one call later, at the `POST`.
  Use a Standard key, or the Auth Token.

  A follow-up probe (2026-10-28) with the same Restricted key, call by call on a throwaway trunk:
  `trunks` create, fetch, update and delete work, and so do the trunk's origination URLs (list,
  create). The trunk's IP ACLs, credential lists and phone numbers (list and create) all answer
  "no requested permission". Twilio's Restricted-key permission list for Voice
  ([PDF](https://docs-resources.prod.twilio.com/documents/Twilio_Restricted_API_Keys_Permissions_-_Voice_Permissions.pdf))
  lists no `trunking.twilio.com` endpoint at all. The console's
  `sip.trunks.auth.calls.ip-acl-mappings` and `...credential-list-mappings` don't grant these
  calls. A Restricted key can create a trunk but can't secure it, so it can't link a number.
- **A missing permission is 401 with code 70051, not 403.** Steps d and e. The new code maps
  code 70051 to `PERMISSION_MISSING` and 401/20003 to `CREDENTIALS_REFUSED`.
- **A taken trunk domain is a bare 400.** Step i: `POST /v1/Trunks` from the subaccount with the
  parent's domain answers `{"code": 400, "message": "Bad Request", "status": 400}`. That is what
  `DOMAIN_TAKEN` matches, on `trunking.trunks.create` only.
- **A wrong secret is 401 with code 20003** (step g), on the first call.
- **The old CLI leaves partial state when a step fails.** Step d/old left a trunk with no ACL
  attached and a separate ACL; it creates the ACL before the trunk and never looks the ACL up, so
  each retry adds another `ACL-<label>`. The new code re-runs onto it (step b).
- **The new code converges on an old link.** Step b/new found the old CLI's trunk, ACL and
  origination URL and only added the credential list; step b/new-again, with a new SIP
  credential, only added that credential.
- **Twilio accepts private addresses in an IP ACL** (the dev stack's `HOST_IP`).

## Step h: one real inbound call (not automated)

Needs the owner: on api.fonoster.ai, link the number with today's
`fonoster sipnet:numbers:linkTwilioNumber`, call it from a phone, check the app answers, then put
the number back on its original trunk and delete the trunk, ACL and Fonoster number.

Outcome: _pending_.

## Recording

Account and key SIDs are replaced with placeholders (`AC…01` parent, `AC…02` subaccount,
`SK…01` Standard, `SK…02` Restricted, `SK…03` Restricted without trunking). SIP passwords are
`<redacted>`. Account-wide lists keep only this run's items and the test number; their paging
fields are as Twilio sent them.
