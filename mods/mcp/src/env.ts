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
import { assertEnvsAreSet } from "@fonoster/common";

assertEnvsAreSet([
  "MCP_WORKSPACE_ACCESS_KEY_ID",
  "MCP_APIKEY_ACCESS_KEY_ID",
  "MCP_APIKEY_ACCESS_KEY_SECRET"
]);

const WORKSPACE_ACCESS_KEY_ID = process.env.MCP_WORKSPACE_ACCESS_KEY_ID;
const ACCESS_KEY_ID = process.env.MCP_APIKEY_ACCESS_KEY_ID;
const ACCESS_KEY_SECRET = process.env.MCP_APIKEY_ACCESS_KEY_SECRET;
const ENDPOINT = process.env.MCP_ENDPOINT;
const ALLOW_INSECURE = process.env.MCP_ALLOW_INSECURE === "true";

export {
  WORKSPACE_ACCESS_KEY_ID,
  ACCESS_KEY_ID,
  ACCESS_KEY_SECRET,
  ENDPOINT,
  ALLOW_INSECURE
};
