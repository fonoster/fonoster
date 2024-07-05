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
import { Metadata } from "@grpc/grpc-js";
import {
  ExchangeApiKeyRequest,
  ExchangeCredentialsRequest,
  ExchangeRefreshTokenRequest
} from "../generated/node/identity_pb";

type ExchangeRequest =
  | ExchangeApiKeyRequest
  | ExchangeCredentialsRequest
  | ExchangeRefreshTokenRequest;

type ExchangeMethod = (
  req: ExchangeRequest,
  metadata: Metadata | Record<string, unknown>,
  callback: (
    err: Error | null,
    response: { getAccessToken: () => string; getRefreshToken: () => string }
  ) => void
) => void;

function exchangeToken(
  request: ExchangeRequest,
  exchangeMethod: ExchangeMethod
): Promise<{ refreshToken: string; accessToken: string }> {
  return new Promise((resolve, reject) => {
    exchangeMethod(request, {}, (err: Error | null, response) => {
      if (err) {
        reject(err);
      }

      const accessToken = response?.getAccessToken();
      const refreshToken = response?.getRefreshToken();

      resolve({ accessToken, refreshToken });
    });
  });
}

export { exchangeToken };
