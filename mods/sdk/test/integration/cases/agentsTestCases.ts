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
import { Privacy } from "@fonoster/types";

function createAgentsTestCases(expect) {
  const idBase = "agents";

  return {
    api: "Agents",
    cases: [
      {
        id: `${idBase}-00`,
        name: "should create an agent",
        method: "createAgent",
        request: {
          name: "John Doe",
          username: `john.doe.${Date.now()}`,
          privacy: Privacy.PRIVATE,
          enabled: true,
          maxContacts: 3
        },
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-01`,
        name: "should get the agent",
        method: "getAgent",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref").to.not.be.null;
          expect(response).has.property("name").to.not.be.null;
          expect(response).has.property("privacy").to.be.equal(Privacy.PRIVATE);
          expect(response).has.property("enabled").to.be.true;
          expect(response).has.property("maxContacts").to.be.equal(3);
          expect(response).has.property("username").to.not.be.null;
          expect(response).has.property("createdAt").to.be.a("date");
          expect(response).has.property("updatedAt").to.be.a("date");
        }
      },
      {
        id: `${idBase}-02`,
        name: "should update the name of the agent",
        method: "updateAgent",
        request: {
          ref: "{{ref}}",
          name: "Jane Doe",
          privacy: Privacy.NONE
        },
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-03`,
        name: "should list at least one agent",
        method: "listAgents",
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
          expect(response.items[0]).to.have.property("enabled").to.be.true;
          expect(response.items[0])
            .to.have.property("privacy")
            .to.be.equal(Privacy.NONE);
          expect(response.items[0])
            .to.have.property("maxContacts")
            .to.be.equal(3);
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
        name: "should delete the agent",
        method: "deleteAgent",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-05`,
        name: "should fail to delete the agent (not found)",
        method: "deleteAgent",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        grpcCode: 5
      }
    ]
  };
}

export { createAgentsTestCases };
