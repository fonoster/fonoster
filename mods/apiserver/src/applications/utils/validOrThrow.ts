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
import { getLogger } from "@fonoster/logger";
import { CreateApplicationRequest, UpdateApplicationRequest } from "../types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

// TODO: Implement validation
// Validation should:
//  - Check that the name is not empty
//  - Check that has a valid type
//  - Check that the appEndpoint is not empty if the type is PROGRAMMABLE_VOICE
//  - Check that textToSpeech complies with the vendor requirements (Each vendor will have different requirements)
//  - Check that speechToText complies with the vendor requirements (Each vendor will have different requirements)
//  - Check that conversation complies with the vendor requirements (Each vendor will different requirements)
function validOrThrow(
  request: CreateApplicationRequest | UpdateApplicationRequest
) {
  logger.verbose("validating createApplication", request);
  // Noop
}

export { validOrThrow };
