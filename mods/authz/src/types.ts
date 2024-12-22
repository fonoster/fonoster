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
import { VoiceRequest } from "@fonoster/common";

type ServerConfig = {
  bind?: string;
  port?: number;
};

type CheckMethodAuthorizedRequest = {
  accessKeyId: string;
  method: string;
};

type ChargeAccountRequest = {
  accessKeyId: string;
  amount: number;
};

type GetAccountBalanceRequest = {
  accessKeyId: string;
};

type AuthzHandler = {
  checkSessionAuthorized(request: VoiceRequest): Promise<boolean>;
  checkMethodAuthorized(
    request: CheckMethodAuthorizedRequest
  ): Promise<boolean>;
  chargeAccount(request: ChargeAccountRequest): Promise<void>;
  getAccountBalance(request: GetAccountBalanceRequest): Promise<number>;
};

export {
  ServerConfig,
  AuthzHandler,
  VoiceRequest,
  CheckMethodAuthorizedRequest,
  ChargeAccountRequest,
  GetAccountBalanceRequest
};
