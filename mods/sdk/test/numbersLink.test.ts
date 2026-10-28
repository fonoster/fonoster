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
  LinkTwilioNumberRequest,
  LinkTwilioNumberResponse
} from "../src/generated/node/numbers_pb";
import { Numbers } from "../src/Numbers";

const ACCOUNT_SID = "AC0123456789abcdef0123456789abcdef";
const API_KEY_SID = "SK0123456789abcdef0123456789abcdef";

function fakeClient(sent: { request?: LinkTwilioNumberRequest }) {
  const response = new LinkTwilioNumberResponse();
  response.setRef("number-1");
  response.setTrunkRef("trunk-1");
  return {
    getMetadata: () => ({}),
    getNumbersClient: () => ({
      linkTwilioNumber: (
        req: LinkTwilioNumberRequest,
        _metadata: unknown,
        callback: (e: Error | null, r: LinkTwilioNumberResponse) => void
      ) => {
        // Through the wire format, as the server would read it
        sent.request = LinkTwilioNumberRequest.deserializeBinary(
          req.serializeBinary()
        );
        callback(
          null,
          LinkTwilioNumberResponse.deserializeBinary(response.serializeBinary())
        );
      }
    })
  } as unknown as FonosterClient;
}

describe("@sdk[numbers/linkTwilioNumber]", function () {
  it("sends the nested API-key credentials and returns { ref, trunkRef }", async function () {
    // Arrange
    const sent: { request?: LinkTwilioNumberRequest } = {};
    const numbers = new Numbers(fakeClient(sent));

    // Act
    const response = await numbers.linkTwilioNumber({
      phoneNumber: "+18095550123",
      name: "Front desk",
      appRef: "4a2f8c1e-0b7d-4a51-9e3c-2f6d7a1b9c00",
      credentials: {
        accountSid: ACCOUNT_SID,
        apiKeySid: API_KEY_SID,
        apiKeySecret: "api-key-secret"
      }
    });

    // Assert
    const request = sent.request!;
    expect(request.getPhoneNumber()).to.equal("+18095550123");
    expect(request.getName()).to.equal("Front desk");
    expect(request.getAppRef()).to.equal(
      "4a2f8c1e-0b7d-4a51-9e3c-2f6d7a1b9c00"
    );
    expect(request.getCredentials()?.toObject()).to.deep.equal({
      accountSid: ACCOUNT_SID,
      authToken: "",
      apiKeySid: API_KEY_SID,
      apiKeySecret: "api-key-secret"
    });
    expect(response).to.deep.equal({ ref: "number-1", trunkRef: "trunk-1" });
  });

  it("sends Auth Token credentials and an agent", async function () {
    // Arrange
    const sent: { request?: LinkTwilioNumberRequest } = {};
    const numbers = new Numbers(fakeClient(sent));

    // Act
    await numbers.linkTwilioNumber({
      phoneNumber: "+18095550123",
      agentAor: "sip:frontdesk@acme.sip.fonoster.io",
      credentials: { accountSid: ACCOUNT_SID, authToken: "auth-token" }
    });

    // Assert
    const request = sent.request!;
    expect(request.getAgentAor()).to.equal(
      "sip:frontdesk@acme.sip.fonoster.io"
    );
    expect(request.getCredentials()?.getAccountSid()).to.equal(ACCOUNT_SID);
    expect(request.getCredentials()?.getAuthToken()).to.equal("auth-token");
    expect(request.getCredentials()?.getApiKeySecret()).to.equal("");
  });
});
