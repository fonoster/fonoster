/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
function createCallsTestCases(expect) {
  const idBase = "calls";

  return {
    api: "Calls",
    cases: [
      {
        id: `${idBase}-00`,
        name: "should create a call",
        method: "createCall",
        request: {
          from: "8287854033",
          to: "+17853178070",
          appRef: "938235c9-ad8c-475a-ae8f-11b1c0a6ff67"
        },
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        },
        afterTestDelay: 2000
      },
      {
        id: `${idBase}-01`,
        name: "should get a call",
        method: "getCall",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref").to.not.be.null;
          expect(response).has.property("callId").to.not.be.null;
          expect(response).has.property("type").to.be.equal("PROGRAMMABLE");
          expect(response)
            .has.property("status")
            .to.be.oneOf(["UNKNOWN", "FAILED"]);
          expect(response).has.property("startedAt").to.be.a("date");
          expect(response).has.property("endedAt").to.be.a("date");
          expect(response).has.property("from").to.not.be.null;
          expect(response).has.property("to").to.not.be.null;
          expect(response).has.property("duration").to.be.a("number");
          expect(response).has.property("direction").to.be.equal("OUTBOUND");
        }
      },
      {
        id: `${idBase}-03`,
        name: "should list at least one call",
        method: "listCalls",
        request: {
          pageSize: 10,
          pageToken: null
        },
        responseValidator: (response: {
          items: unknown[];
          nextPageToken: string;
        }) => {
          expect(response).has.property("items");
          expect(response).has.property("nextPageToken");
          expect(response.items.length).to.be.greaterThan(0);
          expect(response.items[0]).to.have.property("ref").to.not.be.null;
          expect(response.items[0]).to.have.property("callId").to.not.be.null;
          expect(response.items[0])
            .to.have.property("type")
            .to.be.equal("PROGRAMMABLE");
          expect(response.items[0])
            .to.have.property("status")
            .to.be.oneOf(["UNKNOWN", "FAILED"]);
          expect(response.items[0])
            .to.have.property("startedAt")
            .to.be.a("date");
          expect(response.items[0]).to.have.property("endedAt").to.be.a("date");
          expect(response.items[0]).to.have.property("from").to.not.be.null;
          expect(response.items[0]).to.have.property("to").to.not.be.null;
          expect(response.items[0])
            .to.have.property("duration")
            .to.be.a("number");
          expect(response.items[0])
            .to.have.property("direction")
            .to.be.equal("OUTBOUND");
        }
      }
    ]
  };
}

export { createCallsTestCases };
