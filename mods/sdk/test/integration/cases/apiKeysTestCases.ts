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
function createApiKeysTestCases(expect) {
  const idBase = "keys";

  return {
    api: "ApiKeys",
    cases: [
      {
        id: `${idBase}-00`,
        name: "should create an api key",
        method: "createApiKey",
        request: {
          role: "WORKSPACE_ADMIN"
        },
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-01`,
        name: "should regenerate an api key",
        method: "regenerateApiKey",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
          expect(response).has.property("accessKeyId");
          expect(response).has.property("accessKeySecret");
        }
      },
      {
        id: `${idBase}-02`,
        name: "should list at least one key",
        method: "listApiKeys",
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
          expect(response.items[0]).to.have.property("accessKeyId").to.not.be
            .null;
          expect(response.items[0])
            .to.have.property("role")
            .to.be.equal("WORKSPACE_ADMIN");
          expect(response.items[0])
            .to.have.property("createdAt")
            .to.be.a("date");
          expect(response.items[0])
            .to.have.property("updatedAt")
            .to.be.a("date");
        }
      },
      {
        id: `${idBase}-03`,
        name: "should delete the key",
        method: "deleteApiKey",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-04`,
        name: "should fail to delete the key (not found)",
        method: "deleteApiKey",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        grpcCode: 5
      }
    ]
  };
}

export { createApiKeysTestCases };
