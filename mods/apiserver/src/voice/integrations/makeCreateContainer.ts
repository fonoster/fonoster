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
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { ApplicationNotFoundError } from "./ApplicationNotFoundError";
import { getSttConfig } from "./getSttConfig";
import { getTtsConfig } from "./getTtsConfig";
import { IntegrationsContainer } from "./types";
import { Application } from "../../applications/types";
import { Prisma } from "../../core/db";
import { SpeechToTextFactory } from "../stt/SpeechToTextFactory";
import { TextToSpeechFactory } from "../tts/TextToSpeechFactory";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const integrationsConfigSchema = z.array(
  z.object({
    name: z.string(),
    productRef: z.string(),
    type: z.enum(["tts", "stt"]),
    credentials: z.record(z.unknown())
  })
);

function makeCreateContainer(prisma: Prisma, pathToIntegrations: string) {
  logger.verbose("loading integrations config", { pathToIntegrations });

  const integrationsFile = fs.readFileSync(pathToIntegrations, "utf8");
  const integrations = JSON.parse(integrationsFile);

  try {
    integrationsConfigSchema.parse(integrations);
  } catch (e) {
    // fatal error
    const message = fromError(e);
    logger.error("integrations config is invalid", { message });
    process.exit(1);
  }

  return async (appRef: string): Promise<IntegrationsContainer> => {
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
