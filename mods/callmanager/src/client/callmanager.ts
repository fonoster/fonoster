/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { CallManagerClient } from "../service/protos/callmanager_grpc_pb";
import CallManagerPB from "../service/protos/callmanager_pb";
import { promisifyAll } from "grpc-promise";
import { CallRequest, CallResponse, ICallManagerClient } from "./types";

/**
 * @classdesc Use Fonoster CallManager, a capability of Fonoster CallManager,
 * to initiate and monitor automated calls. Fonoster CallManager requires of a
 * running Fonoster deployment.
 *
 * @extends APIClient
 * @example
 *
 * const Fonoster = require("@fonoster/sdk")
 * const callManager = new Fonoster.CallManager()
 *
 * callManager.call({
 *   from: "9102104343",
 *   to: "17853178070",
 *   webhook: "https://https://071e-47-132-137-75.ngrok.io/voiceapp",
 * })
 * .then(console.log)        // successful response
 * .catch(console.error)   // an error occurred
 */
export default class CallManager
  extends APIClient
  implements ICallManagerClient
{
  /**
   * Constructs a new CallManager Object.
   *
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(CallManagerClient, options);
    super.init();
    promisifyAll(super.getService(), { metadata: super.getMeta() });
  }

  /**
   * Call method.
   *
   * @param {CallRequest} request - Call request options
   * @param {string} request.from - Number you are calling from. You must have this Number configured in your account
   * @param {string} request.to - The callee
   * @param {string} request.webhook - Url of the application that will handle the call
   * If none is provided it will use the webook setup in the Number
   * @param {object} request.metadata - Arbitrary payload to send to the Voice Application
   * @param {boolean} request.ignoreE164Validation - If enabled it will accept any input in the from and to
   * @return {Promise<CallResponse>} - call results
   * @throws if the from number doesn't exist
   * @throws if could not connect to the underline services
   * @example
   *
   * callManager.call({
   *   from: "+19102104343",
   *   to: "+17853178070",
   *   webhook: "https://voiceapps.acme.com/myvoiceapp",
   *   metadata?: {}
   * })
   * .then(console.log)         // successful response
   * .catch(console.error);     // an error occurred
   */
  async call(request: CallRequest): Promise<CallResponse> {
    const r = new CallManagerPB.CallRequest();
    const metadata = JSON.stringify(request.metadata);
    r.setFrom(request.from);
    r.setTo(request.to);
    r.setWebhook(request.webhook);
    r.setAppRef(request.appRef);
    r.setIgnoreE164Validation(request.ignoreE164Validation);
    r.setMetadata(metadata);

    const p = await super.getService().call().sendMessage(r);

    return {
      ref: p.getRef()
    };
  }
}

export { CallManagerPB, ICallManagerClient };

// WARNING: Workaround for support to commonjs clients
module.exports = CallManager;
module.exports.CallManagerPB = CallManagerPB;
