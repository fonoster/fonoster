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
export interface IAuthClient {
  createToken(request: CreateTokenRequest): Promise<CreateTokenResponse>;
  createNoAccessToken(
    request: CreateTokenRequest
  ): Promise<CreateTokenResponse>;
  validateToken(request: ValidateTokenRequest): Promise<boolean>;
}

export interface CreateTokenRequest {
  accessKeyId: string;
  roleName?: string;
  // Examples: 40s, 10m, 1d, 30d, 1y
  expiration?: string;
}

export interface CreateTokenResponse {
  token: string;
}

export interface ValidateTokenRequest {
  token: string;
}
