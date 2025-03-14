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
  getServerCredentials,
  GRPC_SERVING_STATUS,
  statusMap,
  VoiceRequest
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import merge from "deepmerge";
import { HealthImplementation } from "grpc-health-check";
import { struct } from "pb-util";
import { serviceDefinition } from "../serviceDefinition";
import { 
  AddBillingMeterEventRequest,
  AuthzHandler, 
  CheckMethodAuthorizedRequest, 
  ServerConfig 
} from "../types";
import { defaultServerConfig } from "./defaultServerConfig";

interface AuthorizedResponse {
  authorized: boolean;
}

interface BillingResponse {}

const logger = getLogger({ service: "authz", filePath: __filename });

class AuthzServer {
  config: ServerConfig;

  constructor(config: ServerConfig = defaultServerConfig) {
    this.config = merge(defaultServerConfig, config);
  }

  async listen(handler: AuthzHandler) {
    try {
      const healthImpl = new HealthImplementation(statusMap);
      const credentials = await getServerCredentials({});

      const server: grpc.Server = new grpc.Server();

      server.addService(serviceDefinition, {
        checkSessionAuthorized: async (
          call: grpc.ServerUnaryCall<VoiceRequest, AuthorizedResponse>,
          callback: grpc.sendUnaryData<AuthorizedResponse>
        ) => {
          logger.verbose("checkSessionAuthorized called", call.request);

          try {
            const authorized = await handler.checkSessionAuthorized(
              call.request
            );
            callback(null, { authorized });
          } catch (error) {
            logger.error("checkSessionAuthorized error", { error });
            callback(
              {
                code: grpc.status.INTERNAL,
                message: `${error}`
              },
              null
            );
          }
        },
        checkMethodAuthorized: async (
          call: grpc.ServerUnaryCall<CheckMethodAuthorizedRequest, AuthorizedResponse>,
          callback: grpc.sendUnaryData<AuthorizedResponse>
        ) => {
          logger.verbose("checkMethodAuthorized called", call.request);

          try {
            const authorized = await handler.checkMethodAuthorized(
              call.request
            );
            callback(null, { authorized });
          } catch (error) {
            logger.error("checkMethodAuthorized error", { error });
            callback(
              {
                code: grpc.status.INTERNAL,
                message: `${error}`
              },
              null
            );
          }
        },
        addBillingMeterEvent: async (
          call: grpc.ServerUnaryCall<AddBillingMeterEventRequest, BillingResponse>,
          callback: grpc.sendUnaryData<BillingResponse>
        ) => {
          logger.verbose("addBillingMeterEvent called", call.request);

          try {
            await handler.addBillingMeterEvent(call.request);
            callback(null, {});
          } catch (error) {
            logger.error("addBillingMeterEvent error", { error });
            callback(
              {
                code: grpc.status.INTERNAL,
                message: `${error}`
              },
              null
            );
          }
        }
      });

      server.bindAsync(
        `${this.config.bind}:${this.config.port}`,
        credentials,
        (error, port) => {
          if (error) {
            logger.error("server bind error", { error });
            throw error;
          }

          healthImpl.setStatus("fonoster.authz.v3alpha1", GRPC_SERVING_STATUS);
          server.start();
          logger.info("authz server started", { port });
        }
      );
    } catch (error) {
      logger.error("server initialization error", { error });
      throw error;
    }
  }
}

export { AuthzServer };
