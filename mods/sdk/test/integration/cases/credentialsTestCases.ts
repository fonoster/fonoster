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
function createCredentialsTestCases(expect) {
  const idBase = "credentials";

  return {
    api: "Credentials",
    cases: [
      {
        id: `${idBase}-00`,
        name: "should create a set of credentials",
        method: "createCredentials",
        request: {
          name: "My Credentials",
          username: "myusername",
          password: "mysecret"
        },
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-01`,
        name: "should get the credential",
        method: "getCredentials",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref").to.not.be.null;
          expect(response).has.property("name").to.not.be.null;
          expect(response).has.property("username").to.not.be.null;
          expect(response).to.not.have.property("password");
          expect(response).has.property("createdAt").to.be.a("date");
          expect(response).has.property("updatedAt").to.be.a("date");
        }
      },
      {
        id: `${idBase}-02`,
        name: "should update the name of the credential",
        method: "updateCredentials",
        request: {
          ref: "{{ref}}",
          name: "My New Credentials",
          password: "changed"
        },
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-03`,
        name: "should list at least one set of credentials",
        method: "listCredentials",
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
          expect(response.items[0]).to.have.property("name").to.not.be.null;
          expect(response.items[0]).to.have.property("username").to.not.be.null;
          expect(response.items[0]).to.not.have.property("password");
          expect(response.items[0])
            .to.have.property("createdAt")
            .to.be.a("date");
          expect(response.items[0])
            .to.have.property("updatedAt")
            .to.be.a("date");
        }
      },
      {
        id: `${idBase}-04`,
        name: "should delete the credential",
        method: "deleteCredentials",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-05`,
        name: "should fail to delete the credentials (not found)",
        method: "deleteCredentials",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        grpcCode: 5
      }
    ]
  };
}

export { createCredentialsTestCases };
