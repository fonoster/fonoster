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

/**
 * A stored usage event as the apiserver publishes it for billing (FONOSTER_USAGE_RECORDED,
 * add-billing-service D2): the usage.v1 event plus its owner.
 */
export type RecordedUsage = {
  id: string;
  ownerRef: string;
  workspaceRef: string;
  appRef?: string;
  callRef?: string;
  region: string;
  regionKind: "public" | "private";
  origin: "call" | "browser_test" | "eval" | "api";
  meter: string;
  quantity: number;
  provider?: string;
  model?: string;
  keySource?: "platform" | "workspace";
  occurredAt: string;
};

export const RECORDED_USAGE_STREAM = "FONOSTER_USAGE_RECORDED";
export const RECORDED_USAGE_SUBJECTS = "billing.usage.>";
