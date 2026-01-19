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
function createApplicationsTestCases(expect) {
  const idBase = "applications";

  return {
    api: "Applications",
    cases: [
      {
        id: `${idBase}-00`,
        name: "should create an application",
        method: "createApplication",
        request: {
          name: "My Application",
          type: "EXTERNAL",
          endpoint: "localhost:3000",
          textToSpeech: {
            productRef: "tts.google",
            config: {
              voice: "en-US-Casual-K"
            }
          },
          speechToText: {
            productRef: "stt.google",
            config: {
              languageCode: "en-US"
            }
          }
        },
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-01`,
        name: "should failed to create an application (missing name)",
        method: "createApplication",
        request: {
          type: "EXTERNAL",
          endpoint: "localhost:3000"
        },
        grpcCode: 3
      },
      {
        id: `${idBase}-02`,
        name: "should find the application",
        method: "getApplication",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref").to.be.not.null;
          expect(response).has.property("name").to.be.not.null;
          expect(response).has.property("type").to.be.equal("EXTERNAL");
          expect(response).has.property("endpoint").to.be.not.null;
          expect(response).has.property("textToSpeech").to.be.a("object");
          expect(response).has.property("speechToText").to.be.a("object");
          expect(response).does.not.have.property("intelligence");
          expect(response).has.property("createdAt").to.be.a("date");
          expect(response).has.property("updatedAt").to.be.a("date");
        }
      },
      {
        id: `${idBase}-03`,
        name: "should fail with a bad request error",
        method: "updateApplication",
        request: {
          name: "My renamed Application",
          endpoint: "localhost:50061"
        },
        grpcCode: 3
      },
      {
        id: `${idBase}-03`,
        name: "should update the name of the application",
        method: "updateApplication",
        request: {
          ref: "{{ref}}",
          name: "My renamed Application",
          endpoint: "localhost:50061"
        },
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-04`,
        name: "should list at least one application",
        method: "listApplications",
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
          expect(response.items[0]).to.have.property("type");
          expect(response.items[0]).to.have.property("endpoint").to.not.be.null;
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
        name: "should delete the application",
        method: "deleteApplication",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-06`,
        name: "should failed to delete the application (not found)",
        method: "deleteApplication",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        grpcCode: 5
      }
    ]
  };
}

export { createApplicationsTestCases };
