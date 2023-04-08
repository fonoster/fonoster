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
export interface ICallManagerClient {
  call(request: CallRequest): Promise<CallResponse>;
}

export interface CallRequest {
  from: string;
  to: string;
  webhook?: string;
  appRef?: string;
  metadata?: Record<string, unknown>;
  ignoreE164Validation?: boolean;
}

export interface CallResponse {
  ref: string;
}
export interface EndpointInfo {
  domain: string;
  trunk: string;
  context: string;
  extension: string;
}
