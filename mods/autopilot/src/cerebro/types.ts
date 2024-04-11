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
import { VoiceResponse } from "@fonoster/voice";
import { VoiceRequest } from "@fonoster/voice/dist/types";
import { EventsClient } from "../events/emitter";
import { IntentsEngine } from "../intents/types";

export enum CerebroStatus {
  SLEEP,
  AWAKE_ACTIVE,
  AWAKE_PASSIVE
}

export interface CerebroConfig {
  voiceRequest: VoiceRequest;
  voiceResponse: VoiceResponse;
  activationTimeout?: number;
  activationIntentId?: string;
  intentsEngine: IntentsEngine;
  voiceConfig: Record<string, string | string[]>;
  eventsClient: EventsClient | null;
  transfer?: Transfer;
  alternativeLanguageCode?: string;
}

export interface Transfer {
  media?: string;
  mediaNoAnswer?: string;
  mediaBusy?: string;
  message?: string;
  messageNoAnswer?: string;
  messageBusy?: string;
}

export interface EffectsManagerConfig {
  eventsClient: EventsClient | null;
  voice: VoiceResponse;
  voiceConfig: Record<string, unknown>;
  activationIntentId?: string;
  playbackId: string;
  transfer?: Transfer;
}

export interface Effect {
  type: "say" | "hangup" | "send_data" | "transfer";
  parameters: Record<string, unknown>;
}
