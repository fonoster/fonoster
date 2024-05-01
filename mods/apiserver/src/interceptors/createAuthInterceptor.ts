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
  Access,
  TokenUseEnum,
  decodeToken,
  getRoleForAccessKeyId,
  getTokenFromCall,
  hasAccess,
  isValidToken
} from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { permissionDeniedError, unauthenticatedError } from "./errors";
import { IDENTITY_PUBLIC_KEY } from "../envs";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/**
 * This function is a gRPC interceptor that checks if the request is valid
 * and if the user has the right permissions to access the resource. When
 * validating the request, the function will check if the request is in the
 * skip list, if the token is valid and if the role is allowed by the RBAC.
 *
 * @param {string[]} publicPath - The list of public paths
 * @return {Function} - The gRPC interceptor
 */
function createAuthInterceptor(publicPath: string[] = []) {
  /**
   * Inner function that will be called by the gRPC server.
   *
   * @param {object} methodDefinition - The method definition
   * @param {string} methodDefinition.path - The path of the gRPC method
   * @param {grpc.ServerInterceptingCall} call - The call object
   * @return {grpc.ServerInterceptingCall} - The modified call object
   */
  return (
    methodDefinition: { path: string },
    call: grpc.ServerInterceptingCall
  ) => {
    const { path } = methodDefinition;

    logger.verbose("intercepting api call", { path });

    if (publicPath.includes(methodDefinition.path)) {
      logger.verbose("skipping auth for public path", { path });
      return call;
    }

    const token = getTokenFromCall(call);

    if (!isValidToken(token, IDENTITY_PUBLIC_KEY)) {
      return unauthenticatedError(call);
    }

    const decodedToken = decodeToken<TokenUseEnum.ACCESS>(token) as {
      access: Access[];
      accessKeyId: string;
    };

    const role = getRoleForAccessKeyId(
      decodedToken.access,
      decodedToken.accessKeyId
    );

    if (!hasAccess(role, path)) {
      return permissionDeniedError(call);
    }

    return call;
  };
}

export default createAuthInterceptor;
