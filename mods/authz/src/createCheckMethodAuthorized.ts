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
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";

const logger = getLogger({ service: "authz", filePath: __filename });

/**
 * This function is a gRPC interceptor that checks if the request a method is authorized
 * to be called by the user.
 *
 * @param {string} authzServer - The public key to validate the token
 * @return {Function} - The gRPC interceptor
 */
function createCheckMethodAuthorized(authzServer: string, methods: string[]) {
  logger.verbose("creating check method authorized interceptor", {
    authzServer,
    methods
  });

  /**
   * Inner function that will be called by the gRPC server.
   *
   * @param {object} methodDefinition - The method definition
   * @param {string} methodDefinition.path - The path of the gRPC method
   * @param {ServerInterceptingCall} call - The call object
   * @return {ServerInterceptingCall} - The modified call object
   */
  return (methodDefinition: { path: string }, call: ServerInterceptingCall) => {
    const { path } = methodDefinition;

    if (!methods.includes(path)) {
      // Ignore the check if the method is not in the list
      logger.silly("method is not in the list", { path });
      return call;
    }

    logger.verbose("checking if method is authorized", { path });

    // TODO: Call the authz service to check if the user is authorized to call the method

    return call;
  };
}

export { createCheckMethodAuthorized };
