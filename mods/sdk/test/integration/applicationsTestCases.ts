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
          type: "PROGRAMMABLE_VOICE",
          appEndpoint: "localhost:3000",
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
          type: "PROGRAMMABLE_VOICE",
          appEndpoint: "localhost:3000"
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
          // FIXME: This is failing
          expect(response)
            .has.property("type")
            .to.be.equal("PROGRAMMABLE_VOICE");
          expect(response).has.property("appEndpoint").to.be.not.null;
          expect(response).has.property("textToSpeech").to.be.not.null;
          expect(response).has.property("speechToText").to.be.not.null;
          expect(response).does.not.have.property("intelligence");
          expect(response).has.property("createdAt").to.be.not.null;
          expect(response).has.property("updatedAt").to.be.not.null;
        }
      },
      {
        id: `${idBase}-03`,
        name: "should update the name of the application",
        method: "updateApplication",
        request: {
          ref: "{{ref}}",
          name: "My renamed Application",
          intelligence: {
            productRef: "nlu.dialogflowcx",
            credentials: "xxx",
            config: {
              agent: "yyy"
            }
          }
        },
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-04`,
        name: "should list at least one application (xxx needs fixing)",
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
          expect(response.items[0])
            .to.have.property("type")
            .to.be.equal("PROGRAMMABLE_VOICE");
          expect(response.items[0]).to.have.property("appEndpoint").to.not.be
            .null;
          expect(response.items[0]).to.have.property("textToSpeech").to.not.be
            .null;
          expect(response.items[0]).to.have.property("speechToText").to.not.be
            .null;
          expect(response.items[0]).to.not.have.property("intelligence");
          expect(response.items[0]).to.have.property("createdAt").to.not.be
            .null;
          expect(response.items[0]).to.have.property("updatedAt").to.not.be
            .null;
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
