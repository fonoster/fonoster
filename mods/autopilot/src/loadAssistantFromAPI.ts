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
import { VoiceRequest } from "@fonoster/common";
import * as SDK from "@fonoster/sdk";
import { AssistantConfig } from "./assistants";
import { AUTOPILOT_APISERVER_ENDPOINT } from "./envs";

function loadAssistantFromAPI(req: VoiceRequest): Promise<AssistantConfig> {
  return new Promise((resolve, reject) => {
    const clientConfig = {
      accessKeyId: req.accessKeyId,
      endpoint: AUTOPILOT_APISERVER_ENDPOINT,
      allowInsecure: true,
      withoutInterceptors: true
    };

    const client = new SDK.Client(clientConfig);
    client.setAccessToken(req.sessionToken);
    const applications = new SDK.Applications(client);
    applications
      .getApplication(req.appRef)
      .then((app) => {
        // TODO: Improve error handling here. We should
        // throw a clear error if the intelligence section is empty
        resolve(app.intelligence?.config as AssistantConfig);
      })
      .catch((err) => {
        reject(new Error("Failed to load assistant config"));
      });
  });
}

export { loadAssistantFromAPI };
