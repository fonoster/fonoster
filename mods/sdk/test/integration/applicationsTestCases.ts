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
import { getChai } from "./envUtils";

const idBase = "applications";

const applicationsTestCases = {
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
      responseValidator: async (response: { ref: string }) => {
        const { expect } = await getChai();
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
      name: "should failed to find the application",
      method: "getApplication",
      request: "{{ref}}",
      dependsOn: `${idBase}-00`,
      responseValidator: async (response: { ref: string }) => {
        const { expect } = await getChai();
        expect(response).has.property("ref");
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
      responseValidator: async (response: { ref: string }) => {
        const { expect } = await getChai();
        expect(response).has.property("ref");
      }
    },
    {
      id: `${idBase}-04`,
      name: "should list at least ten applications",
      method: "listApplications",
      request: {
        pageSize: 10,
        pageToken: null
      },
      responseValidator: async (response: {
        items: unknown[];
        nextPageToken: string;
      }) => {
        const { expect } = await getChai();
        expect(response).has.property("items");
        expect(response).has.property("nextPageToken");
        expect(response.items.length).to.be.greaterThan(0);
        expect(response.items[0]).to.have.property("ref").to.not.be.null;
        expect(response.items[0]).to.have.property("name").to.not.be.null;
        expect(response.items[0]).to.have.property("type").to.not.be.null;
      }
    },
    {
      id: `${idBase}-05`,
      name: "should delete the application",
      method: "deleteApplication",
      request: "{{ref}}",
      dependsOn: `${idBase}-00`,
      responseValidator: async (response: { ref: string }) => {
        const { expect } = await getChai();
        expect(response).has.property("ref");
      }
    }
  ]
};

export { applicationsTestCases };
