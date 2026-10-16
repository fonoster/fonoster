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
import { mergeTrunkUpdate } from "../src/trunks/operations";

describe("@sipnet[trunks/updateTrunk]", function () {
  const current = {
    ref: "t-1",
    name: "Carrier",
    inboundUri: "carrier.example.com",
    sendRegister: true,
    outboundCredentialsRef: "c-1",
    uris: [
      {
        host: "sip.example.com",
        port: 5060,
        transport: "UDP",
        weight: 1,
        priority: 1
      }
    ]
  };

  it("keeps the current values of fields a partial update leaves blank", function () {
    const merged = mergeTrunkUpdate(
      { ref: "t-1", name: "Renamed", inboundUri: "", uris: [] } as never,
      current as never
    );
    expect(merged).to.deep.include({
      ref: "t-1",
      name: "Renamed",
      inboundUri: "carrier.example.com",
      outboundCredentialsRef: "c-1"
    });
    expect(merged.uris).to.deep.equal(current.uris);
  });

  it("uses the values the request sets", function () {
    const merged = mergeTrunkUpdate(
      {
        ref: "t-1",
        inboundUri: "new.example.com",
        sendRegister: false
      } as never,
      current as never
    );
    expect(merged).to.deep.include({
      name: "Carrier",
      inboundUri: "new.example.com",
      sendRegister: false
    });
  });
});
