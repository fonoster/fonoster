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
function createTrunksTestCases(expect) {
  const idBase = "trunks";
  const exampleHost = "example.com";

  return {
    api: "Trunks",
    cases: [
      {
        id: `${idBase}-00`,
        name: "should create a trunk",
        method: "createTrunk",
        request: {
          name: "My Trunk",
          inboundUri: `${Math.floor(Math.random() * (999 + 1)) + 1}.test.pstn.fonoster.io`,
          sendRegister: true,
          uris: [
            {
              host: exampleHost,
              port: 5060,
              transport: "UDP",
              user: "1001",
              weight: 1,
              priority: 1,
              enabled: true
            }
          ]
        },
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-01`,
        name: "should get the trunk",
        method: "getTrunk",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string; uris: unknown[] }) => {
          expect(response).has.property("ref").to.be.not.null;
          expect(response).has.property("name").to.be.equal("My Trunk");
          expect(response).has.property("sendRegister").to.be.true;
          expect(response).has.property("inboundUri").to.be.not.null;
          expect(response)
            .has.property("uris")
            .to.be.an("array")
            .to.have.lengthOf(1);
          expect(response.uris[0])
            .has.property("host")
            .to.be.equal(exampleHost);
          expect(response.uris[0]).has.property("port").to.be.equal(5060);
          expect(response.uris[0]).has.property("transport").to.be.equal("UDP");
          expect(response.uris[0]).has.property("user").to.be.equal("1001");
          expect(response.uris[0]).has.property("weight").to.be.equal(1);
          expect(response.uris[0]).has.property("priority").to.be.equal(1);
          expect(response.uris[0]).has.property("enabled").to.be.true;
          expect(response).has.property("createdAt").to.be.a("date");
          expect(response).has.property("updatedAt").to.be.a("date");
        }
      },
      {
        id: `${idBase}-02`,
        name: "should update the name of the trunk",
        method: "updateTrunk",
        request: {
          ref: "{{ref}}",
          name: "My New Trunk",
          uris: [
            {
              host: exampleHost,
              port: 5060,
              transport: "TCP",
              user: "1001",
              weight: 1,
              priority: 1,
              enabled: true
            }
          ]
        },
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-03`,
        name: "should list at least one trunk",
        method: "listTrunks",
        request: {
          pageSize: 10,
          pageToken: null
        },
        responseValidator: (response: {
          items: { uris: unknown[] }[];
          nextPageToken: string;
        }) => {
          expect(response).has.property("items");
          expect(response).has.property("nextPageToken");
          expect(response.items.length).to.be.greaterThan(0);
          expect(response.items[0]).to.have.property("ref").to.not.be.null;
          expect(response.items[0]).to.have.property("name").to.not.be.null;
          expect(response.items[0]).to.have.property("inboundUri").to.not.be
            .null;
          expect(response.items[0]).to.have.property("sendRegister").to.be.true;
          expect(response.items[0])
            .to.have.property("uris")
            .to.be.an("array")
            .to.have.lengthOf(1);
          expect(response.items[0].uris[0])
            .has.property("host")
            .to.be.equal(exampleHost);
          expect(response.items[0].uris[0])
            .has.property("port")
            .to.be.equal(5060);
          expect(response.items[0].uris[0])
            .has.property("transport")
            .to.be.equal("TCP");
          expect(response.items[0].uris[0])
            .has.property("user")
            .to.be.equal("1001");
          expect(response.items[0].uris[0])
            .has.property("weight")
            .to.be.equal(1);
          expect(response.items[0].uris[0])
            .has.property("priority")
            .to.be.equal(1);
          expect(response.items[0].uris[0]).has.property("enabled").to.be.true;
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
        name: "should delete the trunk",
        method: "deleteTrunk",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-05`,
        name: "should fail to delete the trunk (not found)",
        method: "deleteTrunk",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        grpcCode: 5
      }
    ]
  };
}

export { createTrunksTestCases };
