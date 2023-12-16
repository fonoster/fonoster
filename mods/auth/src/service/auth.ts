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
// const grpc = require("@grpc/grpc-js").grpc;
import * as grpc from "@grpc/grpc-js";
import fs from "fs";
import {
  GetRoleRequest,
  Role,
  ValidateTokenRequest,
  ValidateTokenResponse,
  CreateTokenRequest,
  CreateTokenResponse
} from "./protos/auth_pb";
import { IAuthServer, IAuthService, AuthService } from "./protos/auth_grpc_pb";
import { ErrorCodes, FonosterError } from "@fonoster/errors";
import { getLogger } from "@fonoster/logger";
import {
  APISERVER_RBAC_CONFIG,
  APISERVER_JWT_AUTH_ISS,
  APISERVER_JWT_PRIVATE_KEY
} from "../envs";
import Auth from "../utils/auth_utils";
import JWT from "../utils/jwt";

const logger = getLogger({ service: "auth", filePath: __filename });

const authenticator = new Auth(new JWT());

const rbac = JSON.parse(fs.readFileSync(APISERVER_RBAC_CONFIG, "utf8"));

class AuthServer implements IAuthServer {
  [name: string]: grpc.UntypedHandleCall;
  async validateToken(
    call: grpc.ServerUnaryCall<ValidateTokenRequest, ValidateTokenResponse>,
    callback: grpc.sendUnaryData<ValidateTokenResponse>
  ) {
    const result = await authenticator.validateToken(
      { accessToken: call.request.getToken() },
      APISERVER_JWT_PRIVATE_KEY
    );
    const validateTokenResponse = new ValidateTokenResponse();
    validateTokenResponse.setValid(result.isValid);
    callback(null, validateTokenResponse);
  }

  async createToken(
    call: grpc.ServerUnaryCall<CreateTokenRequest, CreateTokenResponse>,
    callback: grpc.sendUnaryData<CreateTokenResponse>
  ) {
    // TODO: We need to validate the token and verify
    // it has permissions to create token since the auth module
    // doesnt pass thru the auth middleware.
    logger.verbose("creating token", {
      accessKeyId: call.request.getAccessKeyId()
    });
    const result = await authenticator.createToken(
      call.request.getAccessKeyId(),
      APISERVER_JWT_AUTH_ISS,
      call.request.getRoleName(),
      APISERVER_JWT_PRIVATE_KEY,
      call.request.getExpiration() || "30d"
    );
    const response = new CreateTokenResponse();
    response.setToken(result.accessToken);
    callback(null, response);
  }

  async createNoAccessToken(
    call: grpc.ServerUnaryCall<CreateTokenRequest, CreateTokenResponse>,
    callback: grpc.sendUnaryData<CreateTokenResponse>
  ) {
    // TODO: We need to validate the token and verify
    // it has permissions to create token since the auth module
    // doesnt pass thru the auth middleware.
    logger.verbose("creating no access token", {
      accessKeyId: call.request.getAccessKeyId()
    });
    const result = await authenticator.createToken(
      call.request.getAccessKeyId(),
      APISERVER_JWT_AUTH_ISS,
      "NO_ACCESS",
      APISERVER_JWT_PRIVATE_KEY,
      "1d"
    );
    const response = new CreateTokenResponse();
    response.setToken(result.accessToken);
    callback(null, response);
  }

  async getRole(
    call: grpc.ServerUnaryCall<GetRoleRequest, Role>,
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

      callback(new FonosterError("Role not found", ErrorCodes.NOT_FOUND), null);
    } catch (e) {
      callback(new FonosterError(e, ErrorCodes.UNKNOWN), null);
    }
  }
}

export { AuthServer as default, IAuthService, AuthService };
