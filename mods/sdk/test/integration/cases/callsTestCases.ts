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
function createCallsTestCases(expect) {
  const idBase = "calls";

  return {
    api: "Calls",
    cases: [
      {
        id: `${idBase}-00`,
        name: "should create a call (test manually)",
        method: "createCall",
        request: {
          from: "8287854033",
          to: "+17853178070",
          appRef: "8860be90-c781-4193-b801-6d8b3824a5c8"
        },
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        },
        skip: true
      },
      {
        id: `${idBase}-01`,
        name: "should get a call (test manually)",
        method: "getCall",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref").to.not.be.null;
          expect(response).has.property("callId").to.not.be.null;
          expect(response).has.property("type").to.be.equal("API_ORIGINATED");
          expect(response)
            .has.property("status")
            .to.be.oneOf([
              "UNKNOWN",
              "NORMAL_CLEARING",
              "CALL_REJECTED",
              "UNALLOCATED",
              "NO_USER_RESPONSE",
              "NO_ROUTE_DESTINATION",
              "NO_ANSWER",
              "USER_BUSY",
              "NOT_ACCEPTABLE_HERE",
              "SERVICE_UNAVAILABLE",
              "INVALID_NUMBER_FORMAT"
            ]);
          expect(response).has.property("startedAt").to.be.a("date");
          expect(response).has.property("endedAt").to.be.a("date");
          expect(response).has.property("from").to.not.be.null;
          expect(response).has.property("to").to.not.be.null;
          expect(response).has.property("duration").to.be.a("number");
          expect(response).has.property("direction").to.be.equal("TO_PSTN");
        },
        skip: true
      },
      {
        id: `${idBase}-02`,
        name: "should list at least one call (test manually)",
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
            .to.be.equal("API_ORIGINATED");
          expect(response.items[0])
            .to.have.property("status")
            .to.be.oneOf([
              "UNKNOWN",
              "NORMAL_CLEARING",
              "CALL_REJECTED",
              "UNALLOCATED",
              "NO_USER_RESPONSE",
              "NO_ROUTE_DESTINATION",
              "NO_ANSWER",
              "USER_BUSY",
              "NOT_ACCEPTABLE_HERE",
              "SERVICE_UNAVAILABLE",
              "INVALID_NUMBER_FORMAT"
            ]);
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
            .to.be.equal("TO_PSTN");
        },
        skip: true
      }
    ]
  };
}

export { createCallsTestCases };
