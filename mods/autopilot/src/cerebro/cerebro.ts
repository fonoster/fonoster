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
import { EffectsManager } from "./effects";
import { Intent, IntentsEngine } from "../intents/types";
import { SGatherStream, VoiceRequest, VoiceResponse } from "@fonoster/voice";
import { CerebroConfig, CerebroStatus } from "./types";
import { sendClientEvent } from "../util";
import { CLIENT_EVENTS } from "../events/types";
import { getLogger, ulogger, ULogType } from "@fonoster/logger";
import Events from "events";

const logger = getLogger({ service: "autopilot", filePath: __filename });

export class Cerebro {
  voiceResponse: VoiceResponse;
  cerebroEvents: Events;
  voiceRequest: VoiceRequest;
  status: CerebroStatus;
  activationTimeout: number;
  maxIteractionsBeforeHangup: number = 2;
  failedInteractions: number = 0;
  activeTimer: NodeJS.Timer;
  interactionTimer: NodeJS.Timer;
  intentsEngine: IntentsEngine;
  stream: SGatherStream;
  config: CerebroConfig;
  lastIntent: Intent;
  effects: EffectsManager;
  interactionsTimer: NodeJS.Timeout;
  isCallHandover: boolean = false;
  isDead: boolean = false;
  constructor(config: CerebroConfig) {
    this.voiceResponse = config.voiceResponse;
    this.voiceRequest = config.voiceRequest;
    this.cerebroEvents = new Events();
    this.status = CerebroStatus.SLEEP;
    this.activationTimeout = config.activationTimeout || 15000;
    this.intentsEngine = config.intentsEngine;
    this.effects = new EffectsManager({
      playbackId: config.voiceConfig.playbackId as string,
      eventsClient: config.eventsClient,
      voice: config.voiceResponse,
      voiceConfig: config.voiceConfig,
      activationIntentId: config.activationIntentId,
      transfer: config.transfer
    });
    this.config = config;
  }

  // Subscribe to events
  async wake() {
    this.status = CerebroStatus.AWAKE_PASSIVE;

    // This timer becomes active only if we don't have an activation intent
    if (!this.config.activationIntentId) {
      this.startInteractionTimer();
    }

    this.voiceResponse.on("error", (error: Error) => {
      this.cerebroEvents.emit("error", error);
      ulogger({
        accessKeyId: this.voiceRequest.accessKeyId,
        eventType: ULogType.APP,
        level: "error",
        message: (error as Error).message
      });
    });

    const speechConfig = { source: "speech,dtmf" } as any;

    if (this.config.alternativeLanguageCode) {
      speechConfig.model = "command_and_search";
      speechConfig.alternativeLanguageCodes = [
        this.config.alternativeLanguageCode
      ];
    }

    this.stream = await this.voiceResponse.sgather(speechConfig as any);

    this.stream.on("transcript", async (data) => {
      if (data.isFinal && data.transcript) {
        logger.verbose("clear interactions timer", {
          sessionId: this.voiceRequest.sessionId
        });

        clearTimeout(this.interactionsTimer);

        const intent = await this.intentsEngine.findIntent(data.transcript, {
          telephony: {
            caller_id: this.voiceRequest.callerNumber
          }
        });

        logger.verbose("cerebro received new transcription from user", {
          sessionId: this.voiceRequest.sessionId,
          text: data.transcript,
          ref: intent.ref,
          confidence: intent.confidence
        });

        if (
          intent.effects.find((e) => e.type === "hangup") ||
          intent.effects.find((e) => e.type === "transfer")
        ) {
          logger.verbose(
            "call hand over: stop all the timers and close the stream",
            {
              sessionId: this.voiceRequest.sessionId
            }
          );

          clearTimeout(this.activeTimer);
          clearTimeout(this.interactionsTimer);

          this.voiceResponse.closeMediaPipe();

          this.isCallHandover = true;
        }

        await this.effects.invokeEffects(
          intent,
          this.status,
          async () => {
            await this.stopPlayback();

            if (this.config.activationIntentId === intent.ref) {
              sendClientEvent(this.config.eventsClient, {
                eventName: CLIENT_EVENTS.RECOGNIZING
              });

              if (this.status === CerebroStatus.AWAKE_ACTIVE) {
                this.resetActiveTimer();
              } else {
                this.startActiveTimer();
              }
            }
          },
          () => {
            logger.verbose("invokeEffects cleanup callback", {
              sessionId: this.voiceRequest.sessionId
            });
            this.cleanup();
          }
        );

        if (this.isDead || this.isCallHandover) {
          try {
            logger.verbose("the call was handover or cerebro was cleaned up", {
              sessionId: this.voiceRequest.sessionId
            });
            this.voiceResponse.hangup();
          } catch (e) {
            // All we can do is try as the call may have already been hung up
          }
          return;
        }

        logger.verbose("cerebro finished processing intent effects", {
          sessionId: this.voiceRequest.sessionId
        });

        // Reset the interactions timer
        if (!this.config.activationIntentId) {
          this.resetInteractionTimer();
        }

        // WARNING: It doesn't appear that we are using this anywhere
        this.lastIntent = intent;
      }
    });
  }

  // Unsubscribe from events
  async sleep() {
    logger.verbose("cerebro timeout and is going to sleep");
    await this.voiceResponse.closeMediaPipe();
    this.stream.close();
    this.status = CerebroStatus.SLEEP;
  }

  startActiveTimer(): void {
    this.status = CerebroStatus.AWAKE_ACTIVE;
    this.activeTimer = setTimeout(() => {
      this.status = CerebroStatus.AWAKE_PASSIVE;

      sendClientEvent(this.config.eventsClient, {
        eventName: CLIENT_EVENTS.RECOGNIZING_FINISHED
      });

      logger.verbose("cerebro changed awake status", { status: this.status });
    }, this.activationTimeout);
    logger.verbose("cerebro changed awake status", { status: this.status });
  }

  resetActiveTimer(): void {
    logger.verbose("cerebro is reseting awake status");
    clearTimeout(this.activeTimer);
    this.startActiveTimer();
  }

  /**
   * Start the interactions timer
   * If the user doesn't say anything we should play the welcome message
   * If it gets played twice many times we should hangup
   * If the user says something we should reset the timer
   * If we just finish an effect we should reset the timer
   */
  startInteractionTimer(): void {
    logger.verbose("cerebro is starting interactions timer", {
      sessionId: this.voiceRequest.sessionId
    });

    this.interactionsTimer = setInterval(async () => {
      this.failedInteractions++;

      logger.verbose("cerebro is counting interactions", {
        sessionId: this.voiceRequest.sessionId,
        failedInteractions: this.failedInteractions
      });

      // Fix hard coded intent
      let intentId = "welcome";

      if (this.failedInteractions >= this.maxIteractionsBeforeHangup) {
        logger.verbose(
          "there was no interaction so for a long time so we hangup",
          {
            sessionId: this.voiceRequest.sessionId
          }
        );

        // Fix hard coded intent
        intentId = "goodbye";

        clearTimeout(this.interactionsTimer);
      }

      const intent = await this.intentsEngine.findIntentWithEvent(intentId, {
        telephony: {
          caller_id: this.voiceRequest.callerNumber
        }
      });

      await this.effects.invokeEffects(
        intent,
        this.status,
        () => {
          logger.verbose("invokeEffects callback", {
            sessionId: this.voiceRequest.sessionId
          });
        },
        () => {
          logger.verbose("invokeEffects cleanup callback", {
            sessionId: this.voiceRequest.sessionId
          });
          this.cleanup();
        }
      );
    }, this.activationTimeout);
  }

  resetInteractionTimer(): void {
    logger.verbose("cerebro is reseting interactions timer", {
      sessionId: this.voiceRequest.sessionId
    });

    // Reset the failed interactions timer
    this.failedInteractions = 0;
    clearTimeout(this.interactionsTimer);
    this.startInteractionTimer();
  }

  async stopPlayback() {
    const { playbackId } = this.config.voiceConfig as { playbackId: string };
    if (playbackId) {
      try {
        const playbackControl = this.voiceResponse.playback(playbackId);

        logger.verbose("cerebro is stoping playback", { playbackId });

        await playbackControl.stop();
      } catch (e) {
        ulogger({
          accessKeyId: this.voiceRequest.accessKeyId,
          eventType: ULogType.APP,
          level: "error",
          message: (e as Error).message
        });
      }
    }
  }

  // Cleanup all timers and events
  async cleanup() {
    this.isDead = true;
    await this.voiceResponse.closeMediaPipe();
    this.stream.close();
    this.cerebroEvents.removeAllListeners();
    clearTimeout(this.activeTimer);
    clearTimeout(this.interactionsTimer);
  }
}
