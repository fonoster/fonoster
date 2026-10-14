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
import { createTrunkRequestSchema } from "../../src/validators/sipnet/trunks";

describe("@common[validators/sipnet/trunks]", function () {
  const trunk = {
    name: "Claro",
    inboundUri: "claro.fonoster.local",
    uris: [{ host: "sip.claro.example.com", port: 5060, transport: "UDP", weight: 10, priority: 1 }]
  };

  it("accepts a trunk whose false booleans were dropped on the wire", function () {
    // sendRegister: false and enabled: false arrive as missing fields.
    expect(createTrunkRequestSchema.safeParse(trunk).success).to.equal(true);
  });

  it("still rejects an invalid host", function () {
    const bad = { ...trunk, uris: [{ ...trunk.uris[0], host: "not a host" }] };
    expect(createTrunkRequestSchema.safeParse(bad).success).to.equal(false);
  });
});
