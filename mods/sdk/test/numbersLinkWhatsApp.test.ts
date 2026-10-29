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
import { FonosterClient } from "../src/client/types";
import {
  LinkWhatsAppRequest,
  LinkWhatsAppResponse
} from "../src/generated/node/numbers_pb";
import { Numbers } from "../src/Numbers";

const HOSTNAME =
  "wa-wo7d2kq9x4m1c8b3n6p0r5t2v9y4z7a1e3-525512345678.pstn.fonoster.ai";

function fakeClient(
  sent: { request?: LinkWhatsAppRequest },
  sipPasswordSet: boolean
) {
  const response = new LinkWhatsAppResponse();
  response.setRef("number-1");
  response.setTrunkRef("trunk-1");
  response.setSipServerHostname(HOSTNAME);
  response.setSipServerPort(5061);
  response.setSipPasswordSet(sipPasswordSet);
  return {
    getMetadata: () => ({}),
    getNumbersClient: () => ({
      linkWhatsApp: (
        req: LinkWhatsAppRequest,
        _metadata: unknown,
        callback: (e: Error | null, r: LinkWhatsAppResponse) => void
      ) => {
        // Through the wire format, as the server would read it
        sent.request = LinkWhatsAppRequest.deserializeBinary(
          req.serializeBinary()
        );
        callback(
          null,
          LinkWhatsAppResponse.deserializeBinary(response.serializeBinary())
        );
      }
    })
  } as unknown as FonosterClient;
}

describe("@sdk[numbers/linkWhatsApp]", function () {
  it("sends every field and maps the response", async function () {
    // Arrange
    const sent: { request?: LinkWhatsAppRequest } = {};
    const numbers = new Numbers(fakeClient(sent, true));

    // Act
    const response = await numbers.linkWhatsApp({
      phoneNumber: "+525512345678",
      sipPassword: "meta-issued-password",
      name: "Front desk",
      appRef: "4a2f8c1e-0b7d-4a51-9e3c-2f6d7a1b9c00"
    });

    // Assert
    expect(sent.request?.getPhoneNumber()).to.equal("+525512345678");
    expect(sent.request?.getSipPassword()).to.equal("meta-issued-password");
    expect(sent.request?.getName()).to.equal("Front desk");
    expect(sent.request?.getAppRef()).to.equal(
      "4a2f8c1e-0b7d-4a51-9e3c-2f6d7a1b9c00"
    );
    expect(sent.request?.getAgentAor()).to.equal("");
    expect(response).to.deep.equal({
      ref: "number-1",
      trunkRef: "trunk-1",
      sipServerHostname: HOSTNAME,
      sipServerPort: 5061,
      sipPasswordSet: true
    });
  });

  it("sends an agentAor without a password, and maps sipPasswordSet false", async function () {
    // Arrange
    const sent: { request?: LinkWhatsAppRequest } = {};
    const numbers = new Numbers(fakeClient(sent, false));

    // Act
    const response = await numbers.linkWhatsApp({
      phoneNumber: "+525512345678",
      agentAor: "sip:maria@acme.sip.fonoster.local"
    });

    // Assert
    expect(sent.request?.getAgentAor()).to.equal(
      "sip:maria@acme.sip.fonoster.local"
    );
    expect(sent.request?.getAppRef()).to.equal("");
    expect(sent.request?.getSipPassword()).to.equal("");
    expect(response.sipPasswordSet).to.equal(false);
    expect(response.sipServerPort).to.equal(5061);
  });
});
