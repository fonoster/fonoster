/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as path from "path";
import { expect } from "chai";
import { classifyCall, FarEnd, readCall } from "../../src/interop";

// QA catalog area IOP (mods/conformance/catalog/areas/interop.md): each case's
// fixture classifies as exactly that case, and a near miss built from the same
// records does not.
type Records = ReturnType<typeof readCall>;

const FIXTURES = path.join(__dirname, "fixtures");
const FAR_ENDS: FarEnd[] = [
  { name: "whatsapp", hosts: ["wa.meta.vc", "wa-*"] },
  { name: "provider", hosts: ["sip.provider.net", "trunk02.acme.com"] }
];

const load = (file: string): Records => readCall(path.join(FIXTURES, file));
const clone = (r: Records): Records => JSON.parse(JSON.stringify(r));
const msg = (r: Records[number]) => r.request.message as any;
const without = (r: Records, pick: (x: Records[number]) => boolean) =>
  r.filter((x) => !pick(x));

function check(
  id: string,
  farEnd: string,
  file: string,
  nearMiss: (r: Records) => Records
) {
  const records = load(file);
  expect(classifyCall(records, FAR_ENDS)).to.deep.include({ farEnd, case: id });
  expect(classifyCall(nearMiss(clone(records)), FAR_ENDS)?.case).to.not.equal(
    id
  );
}

describe("@common/interop cases", function () {
  it("[IOP-001] inbound call answered, the caller hangs up", function () {
    check(
      "IOP-001",
      "provider",
      "seet-provider_sc-1.3.2-did-invite_agent-1001_20261023.jsonl",
      (r) => without(r, (x) => x.kind === "response" && x.method === "BYE")
    );
  });

  it("[IOP-002] inbound call answered, Fonoster hangs up", function () {
    check(
      "IOP-002",
      "provider",
      "synthetic_did-invite-callee-bye_provider.jsonl",
      (r) => without(r, (x) => x.method === "ACK")
    );
  });

  it("[IOP-003] outbound call from an app answered", function () {
    check(
      "IOP-003",
      "provider",
      "sipp-peer-asterisk_dod-invite-route-by-alias_provider_20261030.jsonl",
      (r) =>
        without(
          r,
          (x) =>
            x.kind === "response" && x.method === "INVITE" && x.status === 200
        )
    );
  });

  it("[IOP-004] SIP agent outbound call answered", function () {
    check(
      "IOP-004",
      "whatsapp",
      "sipjs_wa-dod-invite_whatsapp_20261025.jsonl",
      (r) => without(r, (x) => x.kind === "response" && x.method === "BYE")
    );
  });

  it("[IOP-005] outbound call cancelled before answer", function () {
    check(
      "IOP-005",
      "whatsapp",
      "sipjs_wa-dod-invite-cancel_whatsapp_20261025.jsonl",
      (r) => {
        const ok = clone([r[r.length - 1]])[0];
        ok.status = 200;
        msg(ok).via[0].branch = "z9hG4bK-near-miss";
        return [...r, ok];
      }
    );
  });

  it("[IOP-006] inbound call cancelled by the caller", function () {
    check(
      "IOP-006",
      "provider",
      "synthetic_did-invite-cancel_provider.jsonl",
      (r) => {
        r.filter((x) => x.method === "CANCEL").forEach(
          (x) => (x.request.sender.host = "192.0.2.99")
        );
        return r;
      }
    );
  });

  it("[IOP-007] outbound call busy", function () {
    check(
      "IOP-007",
      "provider",
      "synthetic_dod-invite-busy_provider.jsonl",
      (r) => {
        r.filter((x) => x.status === 486).forEach((x) => (x.status = 480));
        return r;
      }
    );
  });

  it("[IOP-008] outbound call declined", function () {
    check(
      "IOP-008",
      "provider",
      "seet-agent-1001_rr-1.2.1-dod-declined_provider_20261023.jsonl",
      (r) => {
        r.filter((x) => x.status === 603).forEach((x) => (x.status = 604));
        return r;
      }
    );
  });

  it("[IOP-009] in-dialog re-INVITE with SDP answered", function () {
    check(
      "IOP-009",
      "provider",
      "seet-agent-1001_sc-12.2.1-dod-reinvite_provider_20261023.jsonl",
      (r) => {
        const reInvite = r.findIndex(
          (x) => x.kind === "request" && x.method === "INVITE" && msg(x).to.tag
        );
        return r.filter((_, i) => i !== reInvite + 1);
      }
    );
  });

  it("[IOP-010] in-dialog re-INVITE without SDP", function () {
    check(
      "IOP-010",
      "provider",
      "synthetic_dod-reinvite-no-sdp_provider.jsonl",
      (r) => {
        r.filter((x) => x.method === "ACK").forEach((x) => (msg(x).body = ""));
        return r;
      }
    );
  });

  it("[IOP-011] blind transfer by REFER", function () {
    check("IOP-011", "provider", "synthetic_dod-refer_provider.jsonl", (r) =>
      without(r, (x) => x.kind === "request" && x.method === "NOTIFY")
    );
  });
});
