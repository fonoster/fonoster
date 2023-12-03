/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import { APIClient, ClientOptions } from "@fonoster/common";
import { promisifyAll } from "grpc-promise";
import { AppsClient } from "../service/protos/apps_grpc_pb";
import { Struct } from "google-protobuf/google/protobuf/struct_pb";
import {
  App,
  CreateAppRequest,
  CreateAppResponse,
  DeleteAppResponse,
  GetAppResponse,
  IAppsClient,
  ListAppsRequest,
  ListAppsResponse,
  UpdateAppRequest,
  UpdateAppResponse
} from "./types";
import AppsPB from "../service/protos/apps_pb";
import CommonPB from "../service/protos/common_pb";

/**
 * @classdesc Use Fonoster Apps, a capability of Fonoster Voice Subsystem,
 * to create, update, get and delete Voice Applications. Apps requires of a
 * running Fonoster deployment.
 *
 * @extends APIClient
 * @example
 *
 * const Fonoster = require("@fonoster/sdk")
 * const apps = new Fonoster.Apps()
 *
 * const request = {
 *   name: "My application",
 *   initialDtmf: "1234",
 *   speechConfig: {
 *     secretName: "my-secret",
 *     voice: "en-US-Wavenet-F"
 *   },
 *   intentsEngineConfig: {
 *     secretName: "my-secret",
 *     projectId: "my-project"
 *   }
 * }
 *
 * apps.createApp(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
export default class Apps extends APIClient implements IAppsClient {
  /**
   * Constructs a new Apps object.
   *
   * @param {ClientOptions} options - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(AppsClient, options);
    super.init();
    promisifyAll(super.getService(), { metadata: super.getMeta() });
  }

  /**
   * Creates a new Agent on the SIP Proxy subsystem.
   *
   * @param {CreateAppRequest} request -  Request to create a new Voice Application
   * @param {string} request.name - The name of the application
   * @param {string} request.initialDtmf - Optional DTMF code to be sent at after answer the call
   * @param {string} request.activationIntentId - Optional intent id to "wake" the application. Similar to "Alexa!"
   * @param {number} request.activationTimeout - Time in seconds for the duration of the `AWAKE_ACTIVE` state,
   * set for the activation command. After this time the bot will return to `AWAKE_PASSIVE` and new intents will be ignored. Defaults to 15000
   * @param {number} request.interactionTimeout - Timeout, in seconds, to ask again for user input. Use -1 for no timeout. Defaults to -1
   * @param {boolean} request.enableEvents - If set to true it will send events to WS clients subscribed to events. Defaults to false
   * @param {TransferConfig} request.transferConfig - Transfer configuration object
   * @param {string} request.transferConfig.message - Optional message to play while transfering
   * @param {string} request.transferConfig.messageBusy - Optional message to play if callee is busy
   * @param {string} request.transferConfig.messageBusy - Optional message to play if callee does not answer
   * @param {SpeechConfig} request.speechConfig - Speech configuration. Value varies based on implementation
   * @param {IntentsEngineConfig} request.intentsEngineConfig - Intents Engine. Value varies based on implementation
   * @return {Promise<CreateAppResponse>}
   * @see GoogleSpeechConfig
   * @see DialogflowES
   * @see DialogflowCX
   * @example
   *
   * const request = {
   *   name: "My application",
   *   initialDtmf: "1234",
   *   speechConfig: {
   *     secretName: "my-secret",
   *     voice: "en-US-Wavenet-F"
   *   },
   *   intentsEngineConfig: {
   *     secretName: "my-secret",
   *     projectId: "my-project"
   *   }
   * }
   *
   * apps.createApp(request)
   * .then(result => {
   *   console.log(result)            // returns the CreateAppResponse interface
   * }).catch(e => console.error(e))  // an error occurred
   */
  async createApp(request: CreateAppRequest): Promise<CreateAppResponse> {
    const transferConfig = new AppsPB.TransferConfig();
    transferConfig.setMessage(request?.transferConfig?.message);
    transferConfig.setMessageBusy(request?.transferConfig?.messageBusy);
    transferConfig.setMessageNoAnswer(request?.transferConfig?.messageNoAnswer);

    const outRequest = new AppsPB.CreateAppRequest();
    outRequest.setName(request.name);
    outRequest.setInitialDtmf(request.initialDtmf);
    outRequest.setActivationIntentId(request.activationIntentId);
    outRequest.setActivationTimeout(request.activationTimeout);
    outRequest.setInteractionTimeout(request.interactionTimeout);
    outRequest.setEnableEvents(request.enableEvents);
    outRequest.setTransferConfig(transferConfig);
    outRequest.setIntentsEngineConfig(
      Struct.fromJavaScript(
        request.intentsEngineConfig as unknown as Record<string, unknown>
      ) as unknown as Struct
    );
    outRequest.setSpeechConfig(
      Struct.fromJavaScript(
        request.speechConfig as unknown as Record<string, unknown>
      ) as unknown as Struct
    );

    const res = await super.getService().createApp().sendMessage(outRequest);

    return {
      ref: res.getRef(),
      name: res.getName(),
      initialDtmf: res.getInitialDtmf(),
      activationIntentId: res.getActivationIntentId(),
      activationTimeout: res.getActivationTimeout(),
      interactionTimeout: res.getInteractionTimeout(),
      enableEvents: res.getEnableEvents(),
      transferConfig: {
        message: res?.getTransferConfig()?.getMessage(),
        messageBusy: res?.getTransferConfig()?.getMessageBusy(),
        messageNoAnswer: res?.getTransferConfig()?.getMessageNoAnswer()
      },
      speechConfig: res.getSpeechConfig().toJavaScript(),
      intentsEngineConfig: res.getIntentsEngineConfig().toJavaScript(),
      createTime: res.getCreateTime(),
      updateTime: res.getUpdateTime()
    };
  }

  /**
   * Retrives a Voice Application by reference.
   *
   * @param {string} ref - Reference to Application
   * @return {Promise<GetAppResponse>} The Application
   * @throws if ref is null or App does not exist
   * @example
   *
   * const ref = "aynB1z0tzd";
   *
   * apps.getApp(ref)
   * .then(result => {
   *   console.log(result)             // returns the GetAppResponse interface
   * }).catch(e => console.error(e))   // an error occurred
   */
  async getApp(ref: string): Promise<GetAppResponse> {
    const request = new AppsPB.GetAppRequest();
    request.setRef(ref);
    const res = await super.getService().getApp().sendMessage(request);

    return {
      ref: res.getRef(),
      name: res.getName(),
      initialDtmf: res.getInitialDtmf(),
      activationIntentId: res.getActivationIntentId(),
      activationTimeout: res.getActivationTimeout(),
      interactionTimeout: res.getInteractionTimeout(),
      enableEvents: res.getEnableEvents(),
      transferConfig: {
        message: res?.getTransferConfig()?.getMessage(),
        messageBusy: res?.getTransferConfig()?.getMessageBusy(),
        messageNoAnswer: res?.getTransferConfig()?.getMessageNoAnswer()
      },
      speechConfig: res.getSpeechConfig().toJavaScript(),
      intentsEngineConfig: res.getIntentsEngineConfig().toJavaScript(),
      createTime: res.getCreateTime(),
      updateTime: res.getUpdateTime()
    };
  }

  /**
   * Update a Voice Application.
   *
   * @param {UpdateAppRequest} request -  Request to update an existing Voice Application
   * @param {string} request.ref - The reference of the application
   * @param {string} request.name - The name of the application
   * @param {string} request.initialDtmf - Optional DTMF code to be sent at after answer the call
   * @param {string} request.activationIntentId - Optional intent id to "wake" the application. Similar to "Alexa!"
   * @param {number} request.activationTimeout - Time in seconds for the duration of the `AWAKE_ACTIVE` state,
   * set for the activation command. After this time the bot will return to `AWAKE_PASSIVE` and new intents will be ignored. Defaults to 15000
   * @param {number} request.interactionTimeout - Timeout, in seconds, to ask again for user input. Use -1 for no timeout. Defaults to -1
   * @param {boolean} request.enableEvents - If set to true it will send events to WS clients subscribed to events. Defaults to false
   * @param {TransferConfig} request.transferConfig - Transfer configuration object
   * @param {string} request.transferConfig.message - Optional message to play while transfering
   * @param {string} request.transferConfig.messageBusy - Optional message to play if callee is busy
   * @param {string} request.transferConfig.messageBusy - Optional message to play if callee does not answer
   * @param {SpeechConfig} request.speechConfig - Speech configuration. Value varies based on implementation
   * @param {IntentsEngineConfig} request.intentsEngineConfig - Intents Engine configuration. Value varies based on implementation
   * @return {Promise<CreateAppResponse>}
   * @see GoogleSpeechConfig
   * @see DialogflowES
   * @see DialogflowCX
   * @example
   *
   * const request = {
   *   ref: "aynB1z0tzd",
   *   name: "My new application name",
   *   speechConfig: {
   *     secretName: "my-secret",
   *     voice: "en-US-Wavenet-F"
   *   },
   *   intentsEngineConfig: {
   *     secretName: "my-secret"
   *   }
   * }
   *
   * apps.updateApp(request)
   * .then(result => {
   *   console.log(result)            // returns the CreateAppResponse interface
   * }).catch(e => console.error(e))  // an error occurred
   */
  async updateApp(request: UpdateAppRequest): Promise<UpdateAppResponse> {
    const transferConfig = new AppsPB.TransferConfig();
    transferConfig.setMessage(request?.transferConfig?.message);
    transferConfig.setMessageBusy(request?.transferConfig?.messageBusy);
    transferConfig.setMessageNoAnswer(request?.transferConfig?.messageNoAnswer);

    const outRequest = new AppsPB.UpdateAppRequest();
    outRequest.setRef(request.ref);

    Object.keys(request)
      .filter(
        (key) =>
          !["speechConfig", "intentsEngineConfig", "transferConfig"].includes(
            key
          )
      )
      .forEach((key) => {
        if (request[key]) {
          const capitalKey = key.charAt(0).toUpperCase() + key.slice(1);
          outRequest[`set${capitalKey}`](request[key]);
        }
      });

    if (
      transferConfig.getMessage() ||
      transferConfig.getMediaBusy() ||
      transferConfig.getMediaNoAnswer()
    )
      outRequest.setTransferConfig(transferConfig);

    if (request.intentsEngineConfig)
      outRequest.setIntentsEngineConfig(
        Struct.fromJavaScript(
          request.intentsEngineConfig as unknown as Record<string, unknown>
        ) as unknown as Struct
      );

    if (request.speechConfig)
      outRequest.setSpeechConfig(
        Struct.fromJavaScript(
          request.speechConfig as unknown as Record<string, unknown>
        ) as unknown as Struct
      );

    const res = await super.getService().updateApp().sendMessage(outRequest);

    return {
      ref: res.getRef()
    };
  }

  /**
   * List of Voice Applications in your Project.
   *
   * @param {ListAgentsRequest} request - Optional parameter with size and
   * token for the request
   * @param {number} request.pageSize - Elements per page
   * (defaults to 20)
   * @param {string} request.pageToken - The next_page_token value returned from
   * a previous List request, if any
   * @return {Promise<ListAppsResponse>} Paginated List of Applications
   * @example
   *
   * const request = {
   *    pageSize: 20,
   *    pageToken: 2
   * }
   *
   * apps.listApps(request)
   * .then(() => {
   *   console.log(result)            // returns a ListAppsResponse interface
   * }).catch(e => console.error(e))  // an error occurred
   */
  async listApps(request: ListAppsRequest): Promise<ListAppsResponse> {
    const r = new AppsPB.ListAppsRequest();
    r.setPageSize(request.pageSize);
    r.setPageToken(request.pageToken);
    r.setView(request.view);
    const paginatedList = await super.getService().listApps().sendMessage(r);

    return {
      nextPageToken: paginatedList.getNextPageToken(),
      apps: paginatedList.getAppsList().map((a: AppsPB.App) => {
        return {
          ref: a.getRef(),
          name: a.getName(),
          initialDtmf: a.getInitialDtmf(),
          activationIntentId: a.getActivationIntentId(),
          activationTimeout: a.getActivationTimeout(),
          interactionTimeout: a.getInteractionTimeout(),
          enableEvents: a.getEnableEvents(),
          transferConfig: {
            message: a?.getTransferConfig()?.getMessage(),
            messageBusy: a?.getTransferConfig()?.getMessageBusy(),
            messageNoAnswer: a?.getTransferConfig()?.getMessageNoAnswer()
          },
          speechConfig: a.getSpeechConfig().toJavaScript(),
          intentsEngineConfig: a.getIntentsEngineConfig().toJavaScript(),
          createTime: a.getCreateTime(),
          updateTime: a.getUpdateTime()
        };
      })
    };
  }

  /**
   * Deletes a Voice Application in your Project.
   *
   * @param {string} ref - Apps's reference
   * @example
   *
   * const ref = "aynB1z0tzd"
   *
   * apps.deleteApp(ref)
   * .then(() => {
   *   console.log("done")            // returns a reference of the Application
   * }).catch(e => console.error(e))  // an error occurred
   */
  async deleteApp(ref: string): Promise<DeleteAppResponse> {
    const req = new AppsPB.DeleteAppRequest();
    req.setRef(ref);
    await super.getService().deleteApp().sendMessage(req);
    return { ref };
  }
}

export { App, AppsPB, CommonPB, IAppsClient };

// WARNING: Workaround for support to commonjs clients
module.exports = Apps;
module.exports.AppsPB = AppsPB;
module.exports.CommonPB = CommonPB;
