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
import grpc from "grpc";
import {
  GetRoleRequest,
  Role,
  ValidateTokenRequest,
  ValidateTokenResponse,
  CreateTokenRequest,
  CreateTokenResponse
} from "./protos/auth_pb";
import {IAuthServer, IAuthService, AuthService} from "./protos/auth_grpc_pb";
import {ErrorCodes, FonosError} from "@fonos/errors";
import {getSalt, AUTH_ISS} from "@fonos/certs";
import logger from "@fonos/logger";
import Auth from "../utils/auth_utils";
import JWT from "../utils/jwt";
const authenticator = new Auth(new JWT());
const rbac = require(process.env.AUTH_RBAC || "/home/fonos/rbac.json");

class AuthServer implements IAuthServer {
  async validateToken(
    call: grpc.ServerUnaryCall<ValidateTokenRequest>,
    callback: grpc.sendUnaryData<ValidateTokenResponse>
  ) {
    const result = await authenticator.validateToken(
      {accessToken: call.request.getToken()},
      getSalt()
    );
    const validateTokenResponse = new ValidateTokenResponse();
    validateTokenResponse.setValid(result.isValid);
    callback(null, validateTokenResponse);
  }

  async createToken(
    call: grpc.ServerUnaryCall<CreateTokenRequest>,
    callback: grpc.sendUnaryData<CreateTokenResponse>
  ) {
    // WARNING: We must add expiration time (perhaps 60mins?)
    // We also need to validate the token and verify
    // it has permissions to create token since the auth module
    // doesnt pas thru the auth middleware.
    logger.verbose(`@fonos/auth creating token [accessKeyId is ${call.request.getAccessKeyId()}]`)
    const result = await authenticator.createToken(
      call.request.getAccessKeyId(),
      AUTH_ISS,
      call.request.getRoleName(),
      getSalt()
    );
    const response = new CreateTokenResponse();
    response.setToken(result.accessToken);
    callback(null, response);
  }

  async createNoAccessToken(
    call: grpc.ServerUnaryCall<CreateTokenRequest>,
    callback: grpc.sendUnaryData<CreateTokenResponse>
  ) {
    // WARNING: We must add expiration time (perhaps 60mins?)
    // We also need to validate the token and verify
    // it has permissions to create token since the auth module
    // doesnt pas thru the auth middleware.
    logger.verbose(`@fonos/auth creating no access token [accessKeyId is ${call.request.getAccessKeyId()}]`)
    const result = await authenticator.createToken(
      call.request.getAccessKeyId(),
      AUTH_ISS,
      // WARNING: Harcoded value
      "NO_ACCESS",
      getSalt()
    );
    const response = new CreateTokenResponse();
    response.setToken(result.accessToken);
    callback(null, response);
  }

  async getRole(
    call: grpc.ServerUnaryCall<GetRoleRequest>,
    callback: grpc.sendUnaryData<Role>
  ) {
    try {
      const rawRole = rbac.filter((r) => r.name === call.request.getName())[0];
      if (rawRole) {
        const role = new Role();
        role.setAccessList(rawRole.access);
        role.setName(rawRole.name);
        role.setDescription(rawRole.description);
        callback(null, role);
        return;
      }

      callback(new FonosError("Role not found", ErrorCodes.NOT_FOUND), null);
    } catch (e) {
      callback(new FonosError(e, ErrorCodes.UNKNOWN), null);
    }
  }
}

export {AuthServer as default, IAuthService, AuthService};
