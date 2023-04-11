/* eslint-disable @typescript-eslint/no-explicit-any */
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
import * as c from "./generated/api";
import { IAuthClient } from "../../auth/src/client/types";
import {
  CreateTokenRequest,
  CreateTokenResponse,
  ValidateTokenRequest
} from "../../auth/src/client/types";
import { WebClientOptions } from "./types";
import WebAPIClient from "./web_client";

export default class Auth extends WebAPIClient implements IAuthClient {
  constructor(options: WebClientOptions) {
    super(c, "AuthApi", options);
  }

  async createToken(request: CreateTokenRequest): Promise<CreateTokenResponse> {
    return (await super.run("createToken", request)) as any;
  }

  async createNoAccessToken(
    request: CreateTokenRequest
  ): Promise<CreateTokenResponse> {
    return (await super.run("createNoAccessToken", request)) as any;
  }

  async validateToken(request: ValidateTokenRequest): Promise<boolean> {
    return (await super.run("validateToken", request)) as any;
  }
}
