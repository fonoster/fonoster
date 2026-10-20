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
import { createGetUsage } from "./createGetUsage";
import { UsageSql } from "./types";

/** The Usage gRPC service (usage.proto): what a workspace consumed, never money. */
function buildService(db: UsageSql) {
  return {
    definition: {
      serviceName: "Usage",
      pckg: "usage",
      version: "v1beta2",
      proto: "usage.proto"
    },
    handlers: {
      getUsage: createGetUsage(db)
    }
  };
}

export { buildService };
