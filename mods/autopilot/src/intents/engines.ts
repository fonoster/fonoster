/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/rox
 *
 * This file is part of Rox AI
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
import { App } from "@fonoster/apps";
import { IntentsEngine } from "./types";
import DialogFlowCX from "./dialogflow_cx";
import DialogFlowES from "./dialogflow_es";

export function getIntentsEngine(app: App) {
  return function getEngine(
    credentials: Record<string, string>
  ): IntentsEngine {
    const platform = app.intentsEngineConfig.emulateTelephonyPlatform
      ? "TELEPHONY"
      : "PLATFORM_UNSPECIFIED";

    if ("location" in app.intentsEngineConfig) {
      return new DialogFlowCX({
        credentials,
        projectId: app.intentsEngineConfig.projectId,
        agent: app.intentsEngineConfig.agent,
        location: app.intentsEngineConfig.location,
        platform,
        languageCode: "en-US"
      });
    }

    return new DialogFlowES({
      credentials,
      projectId: app.intentsEngineConfig.projectId,
      platform,
      languageCode: "en-US"
    });
  };
}
