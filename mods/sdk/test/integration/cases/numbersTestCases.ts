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
function createNumbersTestCases(expect) {
  const idBase = "numbers";
  const country = "United States";
  const agentAor = "sip:1001@sip.fonoster.local";

  return {
    api: "Numbers",
    cases: [
      {
        id: `${idBase}-00`,
        name: "should create a number",
        method: "createNumber",
        request: {
          name: "My Number",
          telUrl: `tel:+1${Math.floor(Math.random() * 10000000000)}`,
          city: "Asheville",
          country,
          countryIsoCode: "US",
          agentAor
        },
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-01`,
        name: "should failed to create a number (application not found)",
        method: "createNumber",
        request: {
          name: "My Number",
          telUrl: `tel:+1${Math.floor(Math.random() * 10000000000)}`,
          city: "Asheville",
          country,
          countryIsoCode: "US",
          appRef: "00000000-0000-0000-0000-000000000000"
        },
        grpcCode: 3
      },
      {
        id: `${idBase}-02`,
        name: "should get the number by ref",
        method: "getNumber",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref").to.not.be.null;
          expect(response).has.property("name").to.be.equal("My Number");
          expect(response).has.property("telUrl").to.be.a("string");
          expect(response).has.property("city").to.be.equal("Asheville");
          expect(response).has.property("country").to.be.equal(country);
          expect(response).has.property("countryIsoCode").to.be.equal("US");
          expect(response).has.property("agentAor").to.be.equal(agentAor);
          expect(response).has.property("trunk");
          expect(response).to.not.have.property("appRef");
          expect(response).has.property("createdAt").to.be.a("date");
          expect(response).has.property("updatedAt").to.be.a("date");
        }
      },
      {
        id: `${idBase}-03`,
        name: "should update the friendly name of the number",
        method: "updateNumber",
        request: {
          ref: "{{ref}}",
          name: "My New Number"
        },
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-04`,
        name: "should list at least one number",
        method: "listNumbers",
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
          expect(response.items[0])
            .to.have.property("name")
            .to.be.equal("My New Number");
          expect(response.items[0]).to.have.property("telUrl").to.not.be.null;
          expect(response.items[0])
            .to.have.property("city")
            .to.be.equal("Asheville");
          expect(response.items[0])
            .to.have.property("country")
            .to.be.equal(country);
          expect(response.items[0])
            .to.have.property("countryIsoCode")
            .to.be.equal("US");
          expect(response.items[0])
            .to.have.property("agentAor")
            .to.be.equal(agentAor);
          expect(response.items[0]).to.not.have.property("trunk");
          expect(response.items[0]).to.not.have.property("appRef");
          expect(response.items[0])
            .to.have.property("createdAt")
            .to.be.a("date");
          expect(response.items[0])
            .to.have.property("updatedAt")
            .to.be.a("date");
        }
      },
      {
        id: `${idBase}-05`,
        name: "should delete the number",
        method: "deleteNumber",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-06`,
        name: "should fail to delete the number (not found)",
        method: "deleteNumber",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        grpcCode: 5
      }
    ]
  };
}

export { createNumbersTestCases };
