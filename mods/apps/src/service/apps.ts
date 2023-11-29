/* eslint-disable require-jsdoc */
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
import * as grpc from "@grpc/grpc-js";
import { getRedisConnection, getAccessKeyId } from "@fonoster/core";
import { AppsPB } from "../client/apps";
import { AppsService, IAppsServer, IAppsService } from "./protos/apps_grpc_pb";
import {
  GetAppRequest,
  App,
  DeleteAppRequest,
  ListAppsResponse,
  ListAppsRequest,
  CreateAppRequest,
  UpdateAppRequest
} from "./protos/apps_pb";
import { Empty } from "./protos/common_pb";
import { ErrorCodes, FonosterError } from "@fonoster/errors";
import { nanoid } from "nanoid";
import decoder from "./decoder";
import encoder from "./encoder";

export default class AppsServer implements IAppsServer {
  [name: string]: grpc.UntypedHandleCall;
  async createApp(
    call: grpc.ServerUnaryCall<CreateAppRequest, AppsPB.App>,
    callback: grpc.sendUnaryData<AppsPB.App>
  ): Promise<void> {
    try {
      // TODO: Needs assertions

      const redis = getRedisConnection();

      const ref = nanoid(10);
      const app = new AppsPB.App();

      app.setRef(ref);
      app.setAccessKeyId(getAccessKeyId(call));
      app.setInitialDtmf(call.request.getInitialDtmf());
      app.setActivationIntentId(call.request.getActivationIntentId());
      app.setActivationTimeout(call.request.getActivationTimeout());
      app.setInteractionTimeout(call.request.getInteractionTimeout());
      app.setEnableEvents(call.request.getEnableEvents());
      app.setTransferConfig(call.request.getTransferConfig());
      app.setSpeechConfig(call.request.getSpeechConfig());
      app.setIntentsEngineConfig(call.request.getIntentsEngineConfig());
      app.setName(call.request.getName());
      app.setUpdateTime(new Date().toISOString());
      app.setCreateTime(new Date().toISOString());

      redis.set(ref, encoder(app));
      redis.sadd("apps_" + app.getAccessKeyId(), ref);
      callback(null, app);
    } catch (e) {
      callback(e, null);
    }
  }

  async updateApp(
    call: grpc.ServerUnaryCall<UpdateAppRequest, AppsPB.App>,
    callback: grpc.sendUnaryData<AppsPB.App>
  ): Promise<void> {
    try {
      // TODO: Needs assertions

      const redis = getRedisConnection();

      const ref = call.request.getRef();
      const raw = await redis.get(ref);
      if (!raw) throw new FonosterError("not found", ErrorCodes.NOT_FOUND);

      const app = decoder(raw.toString());

      if (getAccessKeyId(call) !== app.getAccessKeyId()) {
        throw new FonosterError(
          "permission denied",
          ErrorCodes.PERMISSION_DENIED
        );
      }

      if (call.request.getInitialDtmf() !== undefined)
        app.setInitialDtmf(call.request.getInitialDtmf());

      if (call.request.getActivationIntentId() !== undefined)
        app.setActivationIntentId(call.request.getActivationIntentId());

      if (call.request.getActivationTimeout() !== undefined)
        app.setActivationTimeout(call.request.getActivationTimeout());

      if (call.request.getInteractionTimeout() !== undefined)
        app.setInteractionTimeout(call.request.getInteractionTimeout());

      if (call.request.getEnableEvents() !== undefined)
        app.setEnableEvents(call.request.getEnableEvents());

      if (call.request.getName() !== undefined)
        app.setName(call.request.getName());

      if (call.request.getIntentsEngineConfig())
        app.setIntentsEngineConfig(call.request.getIntentsEngineConfig());

      if (call.request.getSpeechConfig())
        app.setSpeechConfig(call.request.getSpeechConfig());

      if (
        call.request.getTransferConfig()?.getMessage() !== undefined ||
        call.request.getTransferConfig()?.getMediaBusy() !== undefined ||
        call.request.getTransferConfig()?.getMediaNoAnswer() !== undefined
      )
        app.setTransferConfig(call.request.getTransferConfig());

      app.setUpdateTime(new Date().toISOString());
      redis.set(ref, encoder(app));
      callback(null, app);
    } catch (e) {
      callback(e, null);
    }
  }

  async listApps(
    call: grpc.ServerUnaryCall<ListAppsRequest, ListAppsResponse>,
    callback: grpc.sendUnaryData<ListAppsResponse>
  ): Promise<void> {
    try {
      const redis = getRedisConnection();

      const list = await redis.smembers("apps_" + getAccessKeyId(call));
      const Apps: App[] = await Promise.all(
        list.map(async (ref) => {
          const raw = (await redis.get(ref)).toString();
          return decoder(raw);
        })
      );

      const response = new ListAppsResponse();
      // TODO: Implement pagination
      response.setNextPageToken("1");
      response.setAppsList(Apps);

      callback(null, response);
    } catch (e) {
      callback(e, null);
    }
  }

  async getApp(
    call: grpc.ServerUnaryCall<GetAppRequest, AppsPB.App>,
    callback: grpc.sendUnaryData<AppsPB.App>
  ): Promise<void> {
    try {
      const redis = getRedisConnection();

      const ref = call.request.getRef();
      const raw = await redis.get(ref);
      if (!raw) throw new FonosterError("not found", ErrorCodes.NOT_FOUND);

      const app = decoder(raw.toString());

      if (getAccessKeyId(call) !== app.getAccessKeyId()) {
        throw new FonosterError(
          "permission denied",
          ErrorCodes.PERMISSION_DENIED
        );
      }

      callback(null, app);
    } catch (e) {
      callback(e, null);
    }
  }

  async deleteApp(
    call: grpc.ServerUnaryCall<DeleteAppRequest, Empty>,
    callback: grpc.sendUnaryData<Empty>
  ): Promise<void> {
    try {
      const redis = getRedisConnection();

      const ref = call.request.getRef();
      const raw = await redis.get(ref);
      if (!raw) throw new FonosterError("not found", ErrorCodes.NOT_FOUND);

      const app = decoder(raw.toString());

      if (getAccessKeyId(call) !== app.getAccessKeyId()) {
        throw new FonosterError(
          "permission denied",
          ErrorCodes.PERMISSION_DENIED
        );
      }

      redis.del(app.getRef());
      redis.srem("apps_" + app.getAccessKeyId(), app.getRef());
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }
}

export { IAppsService, AppsService };
