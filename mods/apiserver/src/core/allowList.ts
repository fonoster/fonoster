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
const allowList = [
  "/grpc.health.v1.Health/Check",
  "/fonoster.identity.v1beta2.Identity/CreateUser",
  "/fonoster.identity.v1beta2.Identity/CreateUserWithOauth2Code",
  "/fonoster.identity.v1beta2.Identity/CreateWorkspace",
  "/fonoster.identity.v1beta2.Identity/ExchangeApiKey",
  "/fonoster.identity.v1beta2.Identity/ExchangeCredentials",
  "/fonoster.identity.v1beta2.Identity/ExchangeOauth2Code",
  "/fonoster.identity.v1beta2.Identity/ExchangeRefreshToken",
  "/fonoster.identity.v1beta2.Identity/SendVerificationCode",
  "/fonoster.identity.v1beta2.Identity/VerifyCode",
  "/fonoster.identity.v1beta2.Identity/GetPublicKey",
  "/fonoster.identity.v1beta2.Identity/SendResetPasswordCode",
  "/fonoster.identity.v1beta2.Identity/ResetPassword",
  "/fonoster.voice.v1beta2.Voice/CreateSession"
];

export { allowList };
