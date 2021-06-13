/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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

import {FonosService, ServiceOptions} from "@fonos/common";
import {CallManagerClient} from "../service/protos/callmanager_grpc_pb";
import CallManagerPB from "../service/protos/callmanager_pb";
import {promisifyAll} from "grpc-promise";
import {CallRequest, CallResponse} from "./types";
import grpc from "grpc";

/**
 * @classdesc Use Fonos CallManager, a capability of Fonos Systems Manager,
 * to initiate and monitor automated calls. Fonos CallManager requires of a
 * running Fonos deployment.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require("@fonos/sdk")
 * const callManager = new Fonos.CallManager()
 *
 * callManager.call({
 *   from: "9102104343",
 *   to: "17853178070"
 *   app: "default"
 * })
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
export default class CallManager extends FonosService {
  /**
   * Constructs a new CallManager Object.
   *
   * @see module:core:FonosService
   */
  constructor(options?: ServiceOptions) {
    super(CallManagerClient, options);
    super.init(grpc);
    promisifyAll(super.getService(), {metadata: super.getMeta()});
  }

  /**
   * Calls method.
   *
   * @param {CallRequest} request - call options.
   * @return {Promise<CallResponse>} call results
   * @throws if the from number doesn't exist
   * @throws if could not connect to the underline services
   * @example
   *
   * callManager.call({
   *   from: "9102104343",
   *   to: "17853178070",
   *   app: "default"
   * })
   * .then(result => {
   *   console.log(result);             // successful response
   * }).catch(e => console.error(e));   // an error occurred
   *
   */
  async call(request: CallRequest): Promise<CallResponse> {
    const r = new CallManagerPB.CallRequest();
    r.setFrom(request.from);
    r.setTo(request.to);
    r.setApp(request.app);

    const p = await super.getService().call().sendMessage(r);

    return {
      from: p.getFrom(),
      to: p.getTo(),
      app: p.getApp(),
      duration: p.getDuration()
    };
  }
}

export {CallManagerPB};
