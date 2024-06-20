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
import fs from "fs";
import { getLogger } from "@fonoster/logger";
import { Prisma as PrismaType } from "@prisma/client";
import { IntegrationsContainer } from "./types";
import { Prisma } from "../../core/db";
import { TTS_PATH_TO_FILES } from "../../envs";
import { SpeechToTextFactory } from "../stt/SpeechToTextFactory";
import { TextToSpeechFactory } from "../tts/TextToSpeechFactory";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function makeCreateContainer(prisma: Prisma, pathToIntegrations: string) {
  logger.verbose("loading integrations foundation", { pathToIntegrations });

  const integrationsFile = fs.readFileSync(pathToIntegrations, "utf8");
  const integrations = JSON.parse(integrationsFile);

  // Create lambda to find the credentials for the integrations
  const findCredentials = (productRef: string) => {
    return integrations.find(
      (i: { productRef: string }) => i.productRef === productRef
    );
  };

  return async (appRef: string): Promise<IntegrationsContainer> => {
    logger.verbose("creating container for", { appRef });

    const app = await prisma.application.findUnique({
      where: { ref: appRef },
      include: {
        textToSpeech: true,
        speechToText: true,
        intelligence: true
      }
    });

    const ttsConfig = {
      ...(app.textToSpeech.config as PrismaType.JsonObject),
      credentials: findCredentials(app.textToSpeech.productRef).credentials,
      pathToFiles: TTS_PATH_TO_FILES
    };

    const sttConfig = {
      ...(app.speechToText.config as PrismaType.JsonObject),
      languageCode: "en-US" as any,
      config: {
        languageCode: "en-US" as any,
      },
      credentials: findCredentials(app.speechToText.productRef).credentials
    };

    const tts = TextToSpeechFactory.getEngine(
      app.textToSpeech.productRef,
      ttsConfig
    );

    const stt = SpeechToTextFactory.getEngine(
      app.speechToText.productRef,
      sttConfig
    );

    return {
      ref: appRef,
      accessKeyId: app.accessKeyId,
      appEndpoint: app.appEndpoint,
      tts,
      stt
    };
  };
}

export { makeCreateContainer };
