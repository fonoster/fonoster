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
import { AgentsAPI, GetAgentRequest } from "./client";
import { withAccess } from "../withAccess";

const logger = getLogger({ service: "sipnet", filePath: __filename });

function getAgent(agents: AgentsAPI) {
  return withAccess(async (call: { request: GetAgentRequest }) => {
    const { ref } = call.request;

    logger.verbose("call to getAgent", { ref });

    return agents.getAgent(ref);
  }, agents.getAgent);
}

export { getAgent };
