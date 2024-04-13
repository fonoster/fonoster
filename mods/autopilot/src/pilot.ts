#!/usr/bin/env node
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
import { CLIENT_EVENTS } from "./events/types";
import { VoiceRequest, VoiceResponse, VoiceServer } from "@fonoster/voice";
import { Cerebro } from "./cerebro";
import { eventsServer } from "./events/server";
import { getIntentsEngine } from "./intents/engines";
import { ServerConfig, TTSVendor } from "./types";
import { getTTSPlugin, getVoiceConfig, sendClientEvent } from "./util";
import GoogleASR, { GoogleSpeechConfig } from "@fonoster/googleasr";
import { getLogger, ulogger, ULogType } from "@fonoster/logger";
import Apps from "@fonoster/apps";
import Secrets from "@fonoster/secrets";
import {
  APISERVER_AUTOPILOT_MEDIA_BUSY_MESSAGE,
  APISERVER_AUTOPILOT_MEDIA_NOANSWER_MESSAGE
} from "./envs";

const logger = getLogger({ service: "autopilot", filePath: __filename });

export default function pilot(config: ServerConfig) {
  logger.info("starting autopilot");

  const voiceServer = new VoiceServer({
    port: config.port
  });

  if (config.eventsServerEnabled) eventsServer.start();

  logger.verbose("events server enabled = " + config.eventsServerEnabled);

  voiceServer.listen(
    async (voiceRequest: VoiceRequest, voiceResponse: VoiceResponse) => {
      logger.verbose(`new request [sessionId: ${voiceRequest.sessionId}]`, {
        voiceRequest
      });

      try {
        if (!voiceRequest.appRef)
          throw new Error("invalid voice request: missing appRef");
        // If set, we overwrite the configuration with the values obtain from the webhook
        const serviceCredentials = {
          accessKeyId: voiceRequest.accessKeyId,
          accessKeySecret: voiceRequest.sessionToken
        };

        const apps = new Apps(serviceCredentials);
        const secrets = new Secrets(serviceCredentials);

        const app = await apps.getApp(voiceRequest.appRef);

        logger.verbose("requested app", { app, ref: app.ref });

        const ieSecret = await secrets.getSecret(
          app.intentsEngineConfig.secretName
        );

        const intentsEngine = getIntentsEngine(app)(
          JSON.parse(ieSecret.secret)
        );

        intentsEngine?.setProjectId(app.intentsEngineConfig.projectId);

        const speechSecret = await secrets.getSecret(
          app.speechConfig.secretName
        );

        const speechCredentials = {
          private_key: JSON.parse(speechSecret.secret).private_key,
          client_email: JSON.parse(speechSecret.secret).client_email
        };

        const voiceConfig = getVoiceConfig({
          secretString: speechSecret.secret,
          app,
          config
        });

        logger.verbose("voice config", { voiceConfig });

        const ttsPlugin = getTTSPlugin({
          languageCode: voiceConfig.languageCode,
          vendor: voiceConfig.vendor as TTSVendor,
          secretString: speechSecret.secret,
          path: config.fileRetentionPolicyDirectory
        });

        voiceResponse.use(ttsPlugin);

        voiceResponse.use(
          new GoogleASR({
            credentials: speechCredentials,
            languageCode: config.defaultLanguageCode
          } as GoogleSpeechConfig)
        );

        await voiceResponse.answer();

        const eventsClient =
          app.enableEvents && config.eventsServerEnabled
            ? eventsServer.getConnection(voiceRequest.callerNumber)
            : null;

        sendClientEvent(eventsClient, {
          eventName: CLIENT_EVENTS.ANSWERED
        });

        if (app.initialDtmf) {
          await voiceResponse.dtmf({ dtmf: app.initialDtmf });
        }

        if (
          app.intentsEngineConfig.welcomeIntentId &&
          intentsEngine.findIntentWithEvent
        ) {
          const response = await intentsEngine.findIntentWithEvent(
            // TODO: This should be renamed to welcomeEventId
            app.intentsEngineConfig.welcomeIntentId,
            {
              telephony: {
                caller_id: voiceRequest.callerNumber
              }
            }
          );
          if (response.effects.length > 0) {
            // eslint-disable-next-line no-loops/no-loops
            for await (const effect of response.effects) {
              if (effect.type === "say") {
                await voiceResponse.say(
                  effect.parameters["response"] as string,
                  voiceConfig as { playbackId: string }
                );
              }
            }
          } else {
            logger.warn("no effects found for welcome event", {
              eventId: app.intentsEngineConfig.welcomeIntentId
            });
          }
        }

        const transfer = app.transferConfig;

        transfer.messageNoAnswer = transfer.messageBusy =
          transfer.messageBusy || APISERVER_AUTOPILOT_MEDIA_BUSY_MESSAGE;

        transfer.messageNoAnswer =
          transfer.messageNoAnswer ||
          APISERVER_AUTOPILOT_MEDIA_NOANSWER_MESSAGE;

        const cerebro = new Cerebro({
          voiceRequest,
          voiceResponse,
          eventsClient,
          voiceConfig,
          intentsEngine,
          activationIntentId: app.activationIntentId,
          activationTimeout: app.activationTimeout,
          transfer: app.transferConfig,
          alternativeLanguageCode: app.speechConfig.languageCode
        });

        // Open for bussiness
        await cerebro.wake();
      } catch (e) {
        ulogger({
          accessKeyId: voiceRequest.accessKeyId,
          eventType: ULogType.APP,
          level: "error",
          message: (e as Error).message
        });
      }
    }
  );
}
