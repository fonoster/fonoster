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
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { permissionDeniedError, unauthenticatedError } from "./errors";
import { getAccessKeyIdFromCall } from "./getAccessKeyIdFromCall";
import { getTokenFromCall } from "./getTokenFromCall";
import { hasAccess } from "./hasAccess";
import { TokenVerifyOptions } from "./isValidToken";
import { verifyAccessToken } from "./verifyAccessToken";

const logger = getLogger({ service: "common", filePath: __filename });

/**
 * This function is a gRPC interceptor that checks if the request is valid
 * and if the user has the right permissions to access the resource. When
 * validating the request, the function will check if the request is in the
 * skip list, if the token is a valid access token (RS256, unexpired,
 * `tokenUse: "access"`, and the pinned issuer and audience when given) and if
 * the caller's role in the target workspace is allowed by the RBAC.
 *
 * It fails closed: any error while checking a request answers
 * UNAUTHENTICATED instead of reaching the handler or throwing.
 *
 * @param {string} identityPublicKey - The public key to validate the token
 * @param {string[]} publicPath - The list of public paths
 * @param {TokenVerifyOptions} options - Issuer and audience to pin
 * @return {Function} - The gRPC interceptor
 */
function createAuthInterceptor(
  identityPublicKey: string,
  publicPath: string[],
  options: TokenVerifyOptions = {}
) {
  /**
   * Inner function that will be called by the gRPC server.
   *
   * @param {object} methodDefinition - The method definition
   * @param {string} methodDefinition.path - The path of the gRPC method
   * @param {ServerInterceptingCall} call - The call object
   * @return {ServerInterceptingCall} - The modified call object
   */
  return (methodDefinition: { path: string }, call: ServerInterceptingCall) => {
    try {
      const { path } = methodDefinition;

      const accessKeyId = getAccessKeyIdFromCall(call);

      logger.verbose("intercepting api call to path", { accessKeyId, path });

      if (publicPath.includes(path)) {
        logger.verbose("passing auth control to edge function", { path });
        return call;
      }

      logger.verbose("validating token", { accessKeyId, path });

      const decodedToken = verifyAccessToken(
        getTokenFromCall(call),
        identityPublicKey,
        options
      );

      if (!decodedToken) {
        return unauthenticatedError(call);
      }

      const allowed = hasAccess(decodedToken, path, accessKeyId);

      logger.verbose("checking access for accessKeyId", {
        accessKeyId,
        path,
        hasAccess: allowed
      });

      if (!allowed) {
        return permissionDeniedError(call);
      }

      return call;
    } catch (error) {
      logger.warn("refusing a call that failed the auth check", {
        path: methodDefinition?.path,
        error: (error as Error)?.message
      });
      return unauthenticatedError(call);
    }
  };
}

export { createAuthInterceptor };
