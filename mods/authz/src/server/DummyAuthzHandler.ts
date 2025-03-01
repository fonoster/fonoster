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
import { getLogger } from "@fonoster/logger";
import {
  AddBillingMeterEventRequest,
  AuthzHandler,
  CheckMethodAuthorizedRequest,
  VoiceRequest
} from "../types";
const logger = getLogger({ service: "authz", filePath: __filename });

class DummyAuthzHandler implements AuthzHandler {
  async checkSessionAuthorized(request: VoiceRequest): Promise<boolean> {
    logger.verbose("checkSessionAuthorized called", request);
    return true;
  }

  async checkMethodAuthorized(
    request: CheckMethodAuthorizedRequest
  ): Promise<boolean> {
    logger.verbose("checkMethodAuthorized called", request);
    return true;
  }

  async addBillingMeterEvent(
    request: AddBillingMeterEventRequest
  ): Promise<void> {
    logger.verbose("chargeAccount called", request);
  }
}

export { DummyAuthzHandler };
