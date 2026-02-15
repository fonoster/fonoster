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
import {
  Application,
  BaseApiObject,
  CreateApplicationRequest,
  EvaluateIntelligenceEvent,
  EvaluateIntelligenceRequest,
  ExpectedTextType,
  ListApplicationsRequest,
  ListApplicationsResponse,
  UpdateApplicationRequest
} from "@fonoster/types";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Struct } from "google-protobuf/google/protobuf/struct_pb";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  Application as ApplicationPB,
  ApplicationType,
  CreateApplicationRequest as CreateApplicationRequestPB,
  CreateApplicationResponse as CreateApplicationResponsePB,
  DeleteApplicationRequest as DeleteApplicationRequestPB,
  DeleteApplicationResponse as DeleteApplicationResponsePB,
  EvaluateIntelligenceRequest as EvaluateIntelligenceRequestPB,
  GetApplicationRequest as GetApplicationRequestPB,
  ListApplicationsRequest as ListApplicationsRequestPB,
  ListApplicationsResponse as ListApplicationsResponsePB,
  ProductContainer as ProductContainerPB,
  TestTokenResponse,
  UpdateApplicationRequest as UpdateApplicationRequestPB,
  UpdateApplicationResponse as UpdateApplicationResponsePB
} from "./generated/node/applications_pb";
import { buildStructOverride, buildStructOverrideReverse } from "./utils";

/**
 * @classdesc Fonoster Applications, part of the Fonoster Voice Subsystem,
 * allow you to create, update, retrieve, and delete Voice Applications.
 * Note that an active Fonoster deployment is required.
 *
 * @example
 *
 * const SDK = require("@fonoster/sdk");
 *
 * async function main(request) {
 *   const apiKey = "your-api-key";
 *   const apiSecret = "your-api-secret"
 *   const accessKeyId = "WO00000000000000000000000000000000";
 *
 *   try {
 *     const client = SDK.Client({ accessKeyId });
 *     await client.loginWithApiKey(apiKey, apiSecret);
 *
 *     const apps = new SDK.Applications(client);
 *     const response = await apps.createApplication(request);
 *
 *     console.log(response); // successful response
 *   } catch (e) {
 *     console.error(e); // an error occurred
 *   }
 * }
 *
 * const request = {
 *   name: "My application",
 *   type: "EXTERNAL",
 *   endpoint: "welcome.demo.fonoster.local", // Built-in demo application
 *   speechToText: {
 *     productRef: "stt.deepgram",
 *     config: {
 *       model: "nova-2",
 *       languageCode: "en-US"
 *     }
 *   },
 *   textToSpeech: {
 *     productRef: "tts.elevenlabs",
 *     config: {
 *       voice: "lrTWbMInQjSJ9q5ywFKP"
 *     }
 *   }
 * };
 *
 * main(request);
 */
class Applications {
  private readonly client: FonosterClient;
  /**
   * Constructs a new Applications object.
   *
   * @param {FonosterClient} client - Client object with underlying implementations to make requests to Fonoster's API
   * @see AbstractClient
   * @see FonosterClient
   */
  constructor(client: FonosterClient) {
    this.client = client;
  }

  /**
   * Creates a new Application in Fonoster. The only required fields are the name and type of the application.
   *
   * @param {CreateApplicationRequest} request - The request object that contains the necessary information to create a new application
   * @param {string} request.name - The name of the application
   * @param {ApplicationType} request.type - The type of application (e.g., EXTERNAL)
   * @param {string} request.endpoint - The endpoint where the application is hosted
   * @param {SpeechToText} request.speechToText - The speech-to-text configuration
   * @param {string} request.speechToText.productRef - The product reference of the speech-to-text engine (e.g., stt.deepgram)
   * @param {object} request.speechToText.config - The configuration object for the speech-to-text engine (e.g., { model: "nova-2", languageCode: "en-US" })
   * @param {TextToSpeech} request.textToSpeech - The text-to-speech configuration
   * @param {string} request.textToSpeech.productRef - The product reference of the text-to-speech engine (e.g., tts.elevenlabs)
   * @param {object} request.textToSpeech.config - The configuration object for the text-to-speech engine (e.g., { voice: "lrTWbMInQjSJ9q5ywFKP" })
   * @param {Intelligence} request.intelligence - The intelligence configuration
   * @param {string} request.intelligence.productRef - The product reference of the intelligence engine (e.g., llm.groq)
   * @param {object} request.intelligence.config - The configuration object for the intelligence engine
   * @return {Promise<CreateAppResponse>} - The response object that contains the reference to the newly created application
   * @example
   * const apps = new SDK.Applications(client); // Existing client object
   *
   * const request = {
   *   name: "My application",
   *   type: "EXTERNAL",
   *   endpoint: "welcome.demo.fonoster.local", // Built-in demo application
   *   speechToText: {
   *     productRef: "stt.deepgram",
   *     config: {
   *       languageCode: "en-US"
   *     }
   *   },
   *   textToSpeech: {
   *     productRef: "tts.elevenlabs",
   *     config: {
   *       voice: "lrTWbMInQjSJ9q5ywFKP"
   *     }
   *   }
   * };
   *
   * apps
   *   .createApplication(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async createApplication(
    request: CreateApplicationRequest
  ): Promise<BaseApiObject> {
    const reqWithStructOverride = buildStructOverride(request);
    const applicationsClient = this.client.getApplicationsClient();

    return await makeRpcRequest<
      CreateApplicationRequestPB,
      CreateApplicationResponsePB,
      CreateApplicationRequest,
      BaseApiObject
    >({
      method: applicationsClient.createApplication.bind(applicationsClient),
      requestPBObjectConstructor: CreateApplicationRequestPB,
      metadata: this.client.getMetadata(),
      request: reqWithStructOverride,
      enumMapping: [["type", ApplicationType]],
      objectMapping: [
        ["textToSpeech", ProductContainerPB],
        ["speechToText", ProductContainerPB],
        ["intelligence", ProductContainerPB]
      ]
    });
  }

  /**
   * Retrieves an existing Application in the Workspace.
   *
   * @param {string} ref - The reference of the Application to retrieve
   * @return {Promise<Application>} - The response object that contains the Application information
   * @example
   * const apps = new SDK.Applications(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * apps
   *   .getApplication(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async getApplication(ref: string): Promise<Application> {
    const applicationsClient = this.client.getApplicationsClient();

    const response = await makeRpcRequest<
      GetApplicationRequestPB,
      ApplicationPB,
      BaseApiObject,
      Application
    >({
      method: applicationsClient.getApplication.bind(applicationsClient),
      requestPBObjectConstructor: GetApplicationRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref },
      enumMapping: [["type", ApplicationType]],
      objectMapping: [
        ["textToSpeech", ProductContainerPB],
        ["speechToText", ProductContainerPB],
        ["intelligence", ProductContainerPB]
      ]
    });

    return buildStructOverrideReverse(response);
  }

  /**
   * Updates an existing application in Fonoster.
   *
   * @param {UpdateApplicationRequest} request - The request object that contains the necessary information to update an application
   * @param {string} request.ref - The reference of the application to update
   * @param {string} request.name - The name of the application
   * @param {string} request.endpoint - The endpoint where the application is hosted
   * @param {SpeechToText} request.speechToText - The speech-to-text configuration
   * @param {string} request.speechToText.productRef - The product reference of the speech-to-text engine (e.g., stt.deepgram)
   * @param {object} request.speechToText.config - The configuration object for the speech-to-text engine (e.g., { model: "nova-2", languageCode: "en-US" })
   * @param {TextToSpeech} request.textToSpeech - The text-to-speech configuration
   * @param {string} request.textToSpeech.productRef - The product reference of the text-to-speech engine (e.g., tts.elevenlabs)
   * @param {object} request.textToSpeech.config - The configuration object for the text-to-speech engine (e.g., { voice: "lrTWbMInQjSJ9q5ywFKP" })
   * @param {Intelligence} request.intelligence - The intelligence configuration
   * @param {string} request.intelligence.productRef - The product reference of the intelligence engine (e.g., llm.groq)
   * @param {object} request.intelligence.config - The configuration object for the intelligence engine
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the updated application
   * @example
   * const apps = new SDK.Applications(client); // Existing client object
   *
   * const request = {
   *   ref: "00000000-0000-0000-0000-000000000000",
   *   name: "My application",
   *   endpoint: "welcome.demo.fonoster.local", // Built-in demo application
   * };
   *
   * apps
   *   .updateApplication(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async updateApplication(
    request: UpdateApplicationRequest
  ): Promise<BaseApiObject> {
    const reqWithStructOverride = buildStructOverride(request);
    const applicationsClient = this.client.getApplicationsClient();

    return await makeRpcRequest<
      UpdateApplicationRequestPB,
      UpdateApplicationResponsePB,
      UpdateApplicationRequest,
      BaseApiObject
    >({
      method: applicationsClient.updateApplication.bind(applicationsClient),
      requestPBObjectConstructor: UpdateApplicationRequestPB,
      metadata: this.client.getMetadata(),
      request: reqWithStructOverride,
      enumMapping: [["type", ApplicationType]],
      objectMapping: [
        ["textToSpeech", ProductContainerPB],
        ["speechToText", ProductContainerPB],
        ["intelligence", ProductContainerPB]
      ]
    });
  }

  /**
   * Retrieves a list of Applications from Fonoster.
   *
   * @param {ListApplicationsRequest} request - The request object that contains the necessary information to retrieve a list of Applications
   * @param {number} request.pageSize - The number of Applications to retrieve
   * @param {string} request.pageToken - The token to retrieve the next page of Applications
   * @return {Promise<ListApplicationsResponse>} - The response object that contains the list of Applications
   * @example
   * const apps = new SDK.Applications(client); // Existing client object
   *
   * const request = {
   *   pageSize: 10,
   *   pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * apps
   *   .listApplications(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async listApplications(
    request: ListApplicationsRequest
  ): Promise<ListApplicationsResponse> {
    const applicationsClient = this.client.getApplicationsClient();
    const response = await makeRpcRequest<
      ListApplicationsRequestPB,
      ListApplicationsResponsePB,
      ListApplicationsRequest,
      ListApplicationsResponse
    >({
      method: applicationsClient.listApplications.bind(applicationsClient),
      requestPBObjectConstructor: ListApplicationsRequestPB,
      metadata: this.client.getMetadata(),
      request,
      enumMapping: [["type", ApplicationType]],
      objectMapping: [
        ["speechToText", ProductContainerPB],
        ["textToSpeech", ProductContainerPB],
        ["intelligence", ProductContainerPB]
      ],
      repeatableObjectMapping: [["itemsList", ApplicationPB]]
    });

    return {
      items: response.items.map(buildStructOverrideReverse),
      nextPageToken: response.nextPageToken
    };
  }

  /**
   * Deletes an existing Application from Fonoster.
   * Note that this operation is irreversible.
   *
   * @param {string} ref - The reference of the Application to delete
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the deleted application
   * @example
   * const apps = new SDK.Applications(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * apps
   *   .deleteApplication(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async deleteApplication(ref: string): Promise<BaseApiObject> {
    const applicationsClient = this.client.getApplicationsClient();
    return await makeRpcRequest<
      DeleteApplicationRequestPB,
      DeleteApplicationResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: applicationsClient.deleteApplication.bind(applicationsClient),
      requestPBObjectConstructor: DeleteApplicationRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }

  /**
   * Evaluates the intelligence of an application.
   *
   * @param {EvaluateIntelligenceRequest} request - The request object that contains the necessary information to evaluate the intelligence of an application
   * @param {string} request.intelligence.productRef - The product reference of the intelligence engine (e.g., llm.groq)
   * @param {object} request.intelligence.config - The configuration object for the intelligence engine
   * @return {AsyncGenerator<EvaluateIntelligenceEvent>} - Stream of evaluation events (step results, scenario summaries, or errors)
   * @example
   * const apps = new SDK.Applications(client);
   * for await (const event of apps.evaluateIntelligence(request)) {
   *   if (event.type === "stepResult") console.log(event.stepResult);
   *   if (event.type === "scenarioSummary") console.log(event.scenarioRef, event.overallPassed);
   *   if (event.type === "evalError") console.error(event.message);
   * }
   */
  evaluateIntelligence(
    request: EvaluateIntelligenceRequest
  ): AsyncGenerator<EvaluateIntelligenceEvent> {
    const applicationsClient = this.client.getApplicationsClient();
    const requestPB = new EvaluateIntelligenceRequestPB();
    const productContainer = new ProductContainerPB();
    productContainer.setProductRef(request.intelligence.productRef);
    productContainer.setConfig(
      Struct.fromJavaScript(
        request.intelligence.config as Record<string, unknown>
      ) as any
    );
    requestPB.setIntelligence(productContainer);

    const metadata = this.client.getMetadata() as
      | Record<string, string>
      | null
      | undefined;
    const call = applicationsClient.evaluateIntelligence(requestPB, metadata);

    return this.evaluateIntelligenceStreamGenerator(
      call as { on: (event: string, fn: (...args: unknown[]) => void) => void }
    );
  }

  private async *evaluateIntelligenceStreamGenerator(call: {
    on: (event: string, fn: (...args: unknown[]) => void) => void;
  }): AsyncGenerator<EvaluateIntelligenceEvent> {
    const queue: EvaluateIntelligenceEvent[] = [];
    let done = false;
    let streamError: Error | null = null;

    call.on("data", (chunk: unknown) => {
      const event = this.mapEvalEventFromPb(chunk as never);
      if (event) queue.push(event);
    });
    call.on("end", () => {
      done = true;
    });
    call.on("error", (err: unknown) => {
      streamError = err instanceof Error ? err : new Error(String(err));
      done = true;
    });

    while (!done || queue.length > 0) {
      if (streamError) throw streamError;
      if (queue.length > 0) {
        const next = queue.shift()!;
        yield next;
      } else {
        await new Promise<void>((r) => setTimeout(r, 50));
      }
    }
  }

  private mapEvalEventFromPb(msg: {
    getStepResult?: () => {
      getScenarioRef: () => string;
      getReport: () => {
        getHumanInput: () => string;
        getExpectedResponse: () => string;
        getAiResponse: () => string;
        getEvaluationType: () => number;
        getPassed: () => boolean;
        getErrorMessage: () => string;
        getToolEvaluationsList: () => Array<{
          getExpectedTool: () => string;
          getActualTool: () => string;
          getPassed: () => boolean;
          getExpectedParameters: () =>
            | { toJavaScript: () => Record<string, unknown> }
            | undefined;
          getActualParameters: () =>
            | { toJavaScript: () => Record<string, unknown> }
            | undefined;
          getErrorMessage: () => string;
        }>;
      };
    };
    getScenarioSummary?: () => {
      getScenarioRef: () => string;
      getOverallPassed: () => boolean;
    };
    getEvalError?: () => { getMessage: () => string };
  }): EvaluateIntelligenceEvent | null {
    if (msg.getStepResult?.()) {
      const sr = msg.getStepResult()!;
      const report = sr.getReport();
      const toolList = report.getToolEvaluationsList?.() ?? [];
      return {
        type: "stepResult",
        scenarioRef: sr.getScenarioRef(),
        stepResult: {
          humanInput: report.getHumanInput(),
          expectedResponse: report.getExpectedResponse(),
          aiResponse: report.getAiResponse(),
          evaluationType:
            report.getEvaluationType() === 0
              ? ExpectedTextType.EXACT
              : ExpectedTextType.SIMILAR,
          passed: report.getPassed(),
          errorMessage: report.getErrorMessage() || undefined,
          toolEvaluations: toolList.map((t) => ({
            expectedTool: t.getExpectedTool(),
            actualTool: t.getActualTool(),
            passed: t.getPassed(),
            expectedParameters:
              t.getExpectedParameters?.()?.toJavaScript() ?? undefined,
            actualParameters:
              t.getActualParameters?.()?.toJavaScript() ?? undefined,
            errorMessage: t.getErrorMessage?.() || undefined
          }))
        }
      };
    }
    if (msg.getScenarioSummary?.()) {
      const ss = msg.getScenarioSummary()!;
      return {
        type: "scenarioSummary",
        scenarioRef: ss.getScenarioRef(),
        overallPassed: ss.getOverallPassed()
      };
    }
    if (msg.getEvalError?.()) {
      const e = msg.getEvalError()!;
      return { type: "evalError", message: e.getMessage() };
    }
    return null;
  }

  /**
   * Creates an Ephemeral Agent token for test calls.
   *
   * @return {Promise<TestTokenResponse>} - The response object containing the ephemeral agent token and related info
   * @example
   * const apps = new SDK.Applications(client);
   * const response = await apps.createTestToken();
   * console.log(response.token); // JWT token for test call
   */
  async createTestToken(): Promise<TestTokenResponse.AsObject> {
    const applicationsClient = this.client.getApplicationsClient();
    const response = await makeRpcRequest<
      Empty,
      TestTokenResponse,
      Record<string, never>,
      TestTokenResponse.AsObject
    >({
      method: applicationsClient.createTestToken.bind(applicationsClient),
      requestPBObjectConstructor: Empty,
      metadata: this.client.getMetadata(),
      request: {}
    });
    return response;
  }
}

export { Applications };
