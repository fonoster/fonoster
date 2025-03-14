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

// eslint-disable-next-line no-undef
const exports = {};

/**
 * Converts Fonoster UpdateAgentRequest to Router format
 * @param {Object} request - The update agent request
 * @returns {Object} The Router format agent update
 */
function convertToRoutrAgentUpdate(request) {
  const routrAgent = {
    ref: request.ref
  };

  if (request.name) routrAgent.name = request.name;
  if (request.privacy) routrAgent.privacy = request.privacy;
  if (request.enabled !== undefined) routrAgent.enabled = request.enabled;
  if (request.maxContacts) routrAgent.maxContacts = request.maxContacts;
  if (request.expires) routrAgent.expires = request.expires;
  if (request.domainRef) routrAgent.domainRef = request.domainRef;
  if (request.credentialsRef) routrAgent.credentialsRef = request.credentialsRef;
  
  // Include application reference if provided
  if (request.appRef) routrAgent.appRef = request.appRef;

  return routrAgent;
}

// eslint-disable-next-line no-undef
module.exports = { convertToRoutrAgentUpdate };
