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

const {
  GrpcErrorMessage,
  AgentPreconditionsCheck,
  Validators,
  withErrorHandlingAndValidation
} = require("@fonoster/common");
const { getLogger } = require("@fonoster/logger");
const { convertToRoutrAgentUpdate } = require("./convertToRoutrAgent");

const logger = getLogger({ service: "sipnet", filePath: __filename });

/**
 * Updates an agent with application reference for autopilot integration
 * @param {Object} api - The agents API
 * @param {Function} checkAgentPreconditions - Function to check agent preconditions
 * @returns {Function} The updateAgent function
 */
function updateAgent(api, checkAgentPreconditions) {
  const fn = async (call, callback) => {
    const { request } = call;

    // Validates that the appRef exists in the system if provided
    if (request.appRef) {
      await checkAgentPreconditions(request);
    }

    logger.verbose("call to updateAgent", { ...request });

    try {
      const response = await api.updateAgent(convertToRoutrAgentUpdate(request));
      callback(null, response);
    } catch (e) {
      callback(e);
    }
  };

  return withErrorHandlingAndValidation({
    validators: [Validators.hasRef],
    fn
  });
}

module.exports = { updateAgent };
