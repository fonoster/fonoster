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
function createNumbersTestCases(expect) {
  const idBase = "numbers";

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
          country: "United States",
          countryIsoCode: "US",
          // FIXME: We should allow to pass the appRef
          appRef: "532fc622-e0f1-4be8-a6bc-8f7b40bf20be"
        },
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-01`,
        name: "should get the number by ref",
        method: "getNumber",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-02`,
        name: "should update the friendly name of the number",
        method: "updateNumber",
        request: {
          ref: "{{ref}}",
          name: "My New Number",
          appRef: "532fc622-e0f1-4be8-a6bc-8f7b40bf20be"
        },
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-03`,
        name: "should list at least ten numbers",
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
          expect(response.items[0]).to.have.property("name").to.not.be.null;
          expect(response.items[0]).to.have.property("telUrl").to.not.be.null;
          expect(response.items[0]).to.have.property("city").to.not.be.null;
          expect(response.items[0]).to.have.property("country").to.not.be.null;
          expect(response.items[0]).to.have.property("countryIsoCode").to.not.be.null;
          expect(response.items[0]).to.not.have.property("trunk");
        }
      },
      {
        id: `${idBase}-04`,
        name: "should delete the number",
        method: "deleteNumber",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      }
    ]
  };
}

export { createNumbersTestCases };
