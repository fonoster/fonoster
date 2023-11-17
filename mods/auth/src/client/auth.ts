/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { APIClient, ClientOptions } from "@fonoster/common";
import { AuthClient } from "../service/protos/auth_grpc_pb";
import AuthPB from "../service/protos/auth_pb";
import { promisifyAll } from "grpc-promise";
import {
  CreateTokenRequest,
  CreateTokenResponse,
  IAuthClient,
  ValidateTokenRequest
} from "./types";

/**
 * @classdesc Use Fonoster Auth, a capability of Fonoster,
 * to validate and create short life tokens.
 *
 * @extends APIClient
 * @example
 *
 * const request = {
 *   accessKeyId: "US618572e3ec11d10600000001",
 *   roleName: "USER"
 * };
 *
 * auth.createToken(request)
 * .then(console.log)       // returns an object with the token
 * .catch(console.error);   // an error occurred
 */
export default class Auths extends APIClient implements IAuthClient {
  /**
   * Constructs a new Auth object.
   * @param {ClientOptions} options - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(AuthClient, options);
    super.init();
    promisifyAll(super.getService(), { metadata: super.getMeta() });
  }

  /**
   * Creates a short-life token. The client must have role allowed to create
   * tokens.
   *
   * @param {CreateTokenRequest} request - Request to create a new token
   * @param {string} request.accessKeyId - Path to the function
   * @param {string} request.expiration - Longevity of the token
   * @param {string} request.roleName - Role assigned to the token
   * @return {Promise<CreateTokenResponse>}
   * @example
   *
   * const Fonoster = require("@fonoster/sdk");
   * const auth = new Fonoster.Auth();
   *
   * const request = {
   *   accessKeyId: "PJ618572e3ec11d10600000001",
   *   roleName: "SERVICE",
   *   expiration: "10m"
   * };
   *
   * auth.createToken(request)
   *  .then(console.log)       // returns an object with the token
   *  .catch(console.error);   // an error occurred
   */
  async createToken(request: CreateTokenRequest): Promise<CreateTokenResponse> {
    const req = new AuthPB.CreateTokenRequest();

    req.setAccessKeyId(request.accessKeyId);
    req.setRoleName(request.roleName);
    req.setExpiration(request.expiration);
    const res = await super.getService().createToken().sendMessage(req);
    return {
      token: res.getToken()
    };
  }

  /**
   * Creates a short-life token meant only to serve as a signature. This token will
   * only be useful to sign a request.
   *
   * @param {CreateTokenRequest} request - Request to create a new signature token
   * @param {string} request.accessKeyId - Path to the function
   * @return {Promise<CreateTokenResponse>}
   * @example
   *
   * const Fonoster = require("@fonoster/sdk");
   * const auth = new Fonoster.Auth();
   *
   * const request = {
   *   accessKeyId: "PJ619154d081467a0700000001",
   * };
   *
   * auth.createNoAccessToken(request)
   *  .then(console.log)       // returns an object with the token
   *  .catch(console.error);   // an error occurred
   */
  async createNoAccessToken(
    request: CreateTokenRequest
  ): Promise<CreateTokenResponse> {
    const req = new AuthPB.CreateTokenRequest();
    req.setAccessKeyId(request.accessKeyId);
    const res = await super.getService().createNoAccessToken().sendMessage(req);
    return {
      token: res.getToken()
    };
  }

  /**
   * Checks if a give token was issue by the system.
   *
   * @param {CreateTokValidateTokenRequestenRequest} request - Request to verify the validity of a token
   * @param {string} request.token - Path to the function.
   * @return {Promise<boolean>}
   * @example
   *
   * const Fonoster = require("@fonoster/sdk");
   * const auth = new Fonoster.Auth();
   *
   * const request = {
   *   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   * };
   *
   * auth.validateToken(request)
   *  .then(console.log)       // returns `true` or `false`
   *  .catch(console.error);   // an error occurred
   */
  async validateToken(request: ValidateTokenRequest): Promise<boolean> {
    const req = new AuthPB.ValidateTokenRequest();
    req.setToken(request.token);
    const res = await super.getService().validateToken().sendMessage(req);
    return res.getValid();
  }
}

export { AuthPB, IAuthClient };

// WARNING: Workaround for support to commonjs clients
module.exports = Auths;
module.exports.AuthPB = AuthPB;
