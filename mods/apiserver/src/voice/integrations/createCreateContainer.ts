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
import {
  AUTOPILOT_INTERNAL_ADDRESS,
  AUTOPILOT_SPECIAL_LOCAL_ADDRESS,
  WELCOME_DEMO_SPECIAL_LOCAL_ADDRESS
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Application } from "@fonoster/types";
import { Prisma } from "../../core/db";
import { APISERVER_HOST } from "../../envs";
import { getIntegrationsFromFile } from "../../utils/getIntegrationsFromFile";
import { SpeechToTextFactory } from "../stt/SpeechToTextFactory";
import { TextToSpeechFactory } from "../tts/TextToSpeechFactory";
import { ApplicationNotFoundError } from "./ApplicationNotFoundError";
import { getSttConfig } from "./getSttConfig";
import { getTtsConfig } from "./getTtsConfig";
import { IntegrationsContainer } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createCreateContainer(prisma: Prisma, pathToIntegrations: string) {
  logger.verbose("loading integrations config", { pathToIntegrations });

  const integrations = getIntegrationsFromFile(pathToIntegrations);

  return async function createContainer(
    appRef: string
  ): Promise<IntegrationsContainer> {
    logger.verbose("creating integrations container", { appRef });

    const app = await prisma.application.findUnique({
      where: { ref: appRef },
      include: {
        textToSpeech: true,
        speechToText: true,
        intelligence: true
      }
    });

    if (!app) {
      throw new ApplicationNotFoundError(appRef);
    }

    const ttsConfig = getTtsConfig(integrations, app as Application);
    const sttConfig = getSttConfig(integrations, app as Application);

    const tts = TextToSpeechFactory.getEngine(
      app.textToSpeech.productRef,
      ttsConfig
    );

    const stt = SpeechToTextFactory.getEngine(
      app.speechToText.productRef,
      sttConfig
    );

    const actualEndpoint =
      app.endpoint === AUTOPILOT_SPECIAL_LOCAL_ADDRESS
        ? AUTOPILOT_INTERNAL_ADDRESS
        : app.endpoint === WELCOME_DEMO_SPECIAL_LOCAL_ADDRESS
          ? `${APISERVER_HOST}:50051`
          : app.endpoint;

    return {
      ref: appRef,
      accessKeyId: app.accessKeyId,
      endpoint: actualEndpoint,
      tts,
      stt
    };
  };
}

export { createCreateContainer };
