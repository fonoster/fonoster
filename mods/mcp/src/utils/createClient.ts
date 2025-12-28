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
import * as SDK from "@fonoster/sdk";
import {
  ACCESS_KEY_ID,
  ACCESS_KEY_SECRET,
  ALLOW_INSECURE,
  ENDPOINT,
  WORKSPACE_ACCESS_KEY_ID
} from "../env";

export async function createClient() {
  const client = new SDK.Client({
    accessKeyId: WORKSPACE_ACCESS_KEY_ID,
    endpoint: ENDPOINT,
    allowInsecure: ALLOW_INSECURE
  });
  await client.loginWithApiKey(ACCESS_KEY_ID, ACCESS_KEY_SECRET);
  return client;
}
