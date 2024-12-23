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
import {
  GRPC_SERVING_STATUS,
  getServerCredentials,
  statusMap
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import merge from "deepmerge";
import { HealthImplementation } from "grpc-health-check";
import { defaultServerConfig } from "./defaultServerConfig";
import { serviceDefinition } from "../serviceDefinition";
import { ServerConfig, AuthzHandler } from "../types";
import { struct } from "pb-util";

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
          call: grpc.ServerUnaryCall<any, any>,
          callback: grpc.sendUnaryData<any>
        ) => {
          logger.verbose("checkSessionAuthorized called");
          logger.verbose(JSON.stringify(call.request));

          try {
            const isAuthorized = await handler.checkSessionAuthorized(
              call.request
            );
            if (isAuthorized) {
              callback(null, { authorized: true });
            } else {
              callback({
                code: grpc.status.PERMISSION_DENIED,
                message: "Session is not authorized."
              });
            }
          } catch (error) {
            logger.error("Error in checkSessionAuthorized:", error);
            callback({
              code: grpc.status.INTERNAL,
              message: "Internal server error."
            });
          }
        },
        checkMethodAuthorized: async (
          call: grpc.ServerUnaryCall<any, any>,
          callback: grpc.sendUnaryData<any>
        ) => {
          logger.verbose("checkMethodAuthorized called");
          logger.verbose(JSON.stringify(call.request));

          try {
            const isAuthorized = await handler.checkMethodAuthorized(
              call.request
            );
            if (isAuthorized) {
              callback(null, { authorized: true });
            } else {
              callback({
                code: grpc.status.PERMISSION_DENIED,
                message: "Method is not authorized."
              });
            }
          } catch (error) {
            logger.error("Error in checkMethodAuthorized:", error);
            callback({
              code: grpc.status.INTERNAL,
              message: "Internal server error."
            });
          }
        },
        addBillingMeterEvent: async (
          call: grpc.ServerUnaryCall<any, any>,
          callback: grpc.sendUnaryData<any>
        ) => {
          logger.verbose("addBillingMeterEvent called");
          logger.verbose(JSON.stringify(call.request));

          try {
            const request = {
              accessKeyId: call.request.accessKeyId,
              payload: struct.decode(call.request.payload)
            };
            await handler.addBillingMeterEvent(request);
            callback(null, {});
          } catch (error) {
            logger.error("Error in while adding billing meter event:", error);
            callback({
              code: grpc.status.INTERNAL,
              message: "Internal server error."
            });
          }
        }
      });

      healthImpl.addToServer(server);

      const bindAddr = `${this.config.bind}:${this.config.port}`;

      server.bindAsync(bindAddr, credentials, async (err, port) => {
        if (err) {
          logger.error("Failed to bind server:", err);
          return;
        }
        healthImpl.setStatus("", GRPC_SERVING_STATUS);
        logger.info(`Authz server started at ${this.config.bind}:${port}`);
      });
    } catch (err) {
      logger.error("Error starting AuthzServer:", err);
    }
  }
}

export { AuthzServer };