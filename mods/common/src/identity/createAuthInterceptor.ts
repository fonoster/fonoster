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
import { decodeToken } from "./decodeToken";
import { permissionDeniedError, unauthenticatedError } from "./errors";
import { getAccessKeyIdFromCall } from "./getAccessKeyIdFromCall";
import { getTokenFromCall } from "./getTokenFromCall";
import { hasAccess } from "./hasAccess";
import { isValidToken } from "./isValidToken";
import {
  workspaceResourceAccess,
  workspaceResourceOwnerOrAdminAccess
} from "./roles";
import { tokenHasAccessKeyId } from "./tokenHasAccessKeyId";
import { Access, TokenUseEnum } from "./types";

const logger = getLogger({ service: "common", filePath: __filename });

/**
 * This function is a gRPC interceptor that checks if the request is valid
 * and if the user has the right permissions to access the resource. When
 * validating the request, the function will check if the request is in the
 * skip list, if the token is valid and if the role is allowed by the RBAC.
 *
 * @param {string} identityPublicKey - The public key to validate the token
 * @param {string[]} publicPath - The list of public paths
 * @return {Function} - The gRPC interceptor
 */
function createAuthInterceptor(
  identityPublicKey: string,
  publicPath: string[]
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
    const { path } = methodDefinition;

    const accessKeyId = getAccessKeyIdFromCall(call);

    logger.verbose("intercepting api call to path", { accessKeyId, path });

    if (publicPath.includes(methodDefinition.path)) {
      logger.verbose("passing auth control to edge function", { path });
      return call;
    }

    const token = getTokenFromCall(call);

    logger.verbose("validating token", { accessKeyId, path });

    if (!isValidToken(token, identityPublicKey)) {
      return unauthenticatedError(call);
    }

    const decodedToken = decodeToken<TokenUseEnum.ACCESS>(token) as {
      access: Access[];
      accessKeyId: string;
    };

    logger.verbose("checking access for accessKeyId", {
      accessKeyId,
      path,
      hasAccess: hasAccess(decodedToken, path),
      pathIsWorkspacePath: workspaceResourceAccess.includes(path),
      tokenHasAccessKeyId: tokenHasAccessKeyId(token, accessKeyId)
    });

    if (
      !hasAccess(decodedToken, path) ||
      (workspaceResourceAccess.includes(path) &&
        !tokenHasAccessKeyId(token, accessKeyId)) ||
      (workspaceResourceOwnerOrAdminAccess.includes(path) &&
        !tokenHasAccessKeyId(token, accessKeyId))
    ) {
      return permissionDeniedError(call);
    }

    return call;
  };
}

export { createAuthInterceptor };
