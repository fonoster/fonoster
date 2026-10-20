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

/** The call a session would serve (CheckSessionAuthorizedRequest in authz.proto). */
type VoiceRequest = {
  appRef: string;
  accessKeyId: string;
  endpoint: string;
  ingressNumber: string;
  callerName: string;
  callerNumber: string;
  mediaSessionRef: string;
  callRef: string;
  sessionToken: string;
  callDirection: "FROM_PSTN" | "TO_PSTN" | "INTRA_NETWORK";
  metadata?: Record<string, string>;
};

type ServerConfig = {
  bind?: string;
  port?: number;
};

type CheckMethodAuthorizedRequest = {
  accessKeyId: string;
  method: string;
};

type AddBillingMeterEventRequest = {
  accessKeyId: string;
  payload: Record<string, unknown>;
};

/** Why a session was refused (add-billing-service D7). */
type SessionRefusal = "insufficient_balance" | "concurrency_limit";

/** A session admission answer: a refusal names its reason. */
type SessionDecision = { authorized: boolean; reason?: SessionRefusal };

type AuthzHandler = {
  /** A plain boolean is still accepted from handlers written before reasons existed. */
  checkSessionAuthorized(
    request: VoiceRequest
  ): Promise<boolean | SessionDecision>;
  checkMethodAuthorized(
    request: CheckMethodAuthorizedRequest
  ): Promise<boolean>;
  addBillingMeterEvent(request: AddBillingMeterEventRequest): Promise<void>;
};

export {
  ServerConfig,
  AuthzHandler,
  SessionDecision,
  SessionRefusal,
  VoiceRequest,
  CheckMethodAuthorizedRequest,
  AddBillingMeterEventRequest
};
