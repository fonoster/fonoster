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
import { expect } from "chai";
import { endpointsHash, resolveEndpoints } from "../src/endpoints";

// add-private-regions task 3.6: the cell's public connection details.

describe("@region-agent endpoints", function () {
  it("derives them from the settings the cell's Routr, RTPEngine and media node use", function () {
    expect(
      resolveEndpoints(
        {},
        {
          EXTERNAL_ADDRS: "203.0.113.10",
          RB_SIP_PORT: "5060",
          RTPENGINE_PUBLIC_IP: "203.0.113.11",
          RTPENGINE_PORT_MIN: "10000",
          RTPENGINE_PORT_MAX: "10100"
        }
      )
    ).to.deep.equal({
      sip: [
        { host: "203.0.113.10", port: 5060, transport: "udp" },
        { host: "203.0.113.10", port: 5060, transport: "tcp" }
      ],
      signalingAddresses: ["203.0.113.10"],
      mediaAddresses: ["203.0.113.11"],
      rtpPorts: { min: 10000, max: 10100 }
    });
    expect(resolveEndpoints({}, {})).to.equal(undefined);
  });

  it("lets the agent config override any field", function () {
    const e = resolveEndpoints(
      {
        sip: [{ host: "sip.acme.example", port: 5061, transport: "tls" }],
        mediaAddresses: ["198.51.100.7"]
      },
      {
        EXTERNAL_ADDRS: "203.0.113.10",
        ROOMR_RTP_PORT_MIN: "30000",
        ROOMR_RTP_PORT_MAX: "30199"
      }
    )!;
    expect(e.sip).to.deep.equal([
      { host: "sip.acme.example", port: 5061, transport: "tls" }
    ]);
    expect(e.signalingAddresses).to.deep.equal(["203.0.113.10"]);
    expect(e.mediaAddresses).to.deep.equal(["198.51.100.7"]);
    expect(e.rtpPorts).to.deep.equal({ min: 30000, max: 30199 });
  });

  it("hashes stably and changes when an address changes", function () {
    const a = resolveEndpoints({}, { EXTERNAL_ADDRS: "203.0.113.10" })!;
    const b = resolveEndpoints({}, { EXTERNAL_ADDRS: "203.0.113.10" })!;
    const c = resolveEndpoints({}, { EXTERNAL_ADDRS: "203.0.113.11" })!;
    expect(endpointsHash(a)).to.equal(endpointsHash(b));
    expect(endpointsHash(a)).to.not.equal(endpointsHash(c));
  });
});
