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
import { SayOptions } from "@fonoster/voice/dist/say/types";
import { EffectsManagerConfig } from "./types";

const playOrSay = async (param: {
  voice: VoiceResponse;
  voiceConfig: Record<string, unknown>;
  playbackId: string;
  media?: string;
  message?: string;
}) => {
  if (param.media) {
    await param.voice.play("sound:" + param.media, {
      playbackId: param.playbackId
    });
  }

  if (param.message) {
    if (param.voiceConfig) {
      param.voiceConfig.playbackId = param.playbackId;
    } else {
      param.voiceConfig = { playbackId: param.playbackId };
    }
    await param.voice.say(param.message, param.voiceConfig as SayOptions);
  }
};

export const playTransfering = async (
  voice: VoiceResponse,
  playbackId: string,
  config: EffectsManagerConfig
) =>
  await playOrSay({
    voice,
    voiceConfig: config.voiceConfig,
    playbackId,
    media: config.transfer?.media,
    message: config.transfer?.message
  });

export const playBusyAndHangup = async (
  voice: VoiceResponse,
  playbackId: string,
  config: EffectsManagerConfig
) =>
  await playOrSay({
    voice,
    voiceConfig: config.voiceConfig,
    playbackId,
    media: config.transfer?.mediaBusy,
    message: config.transfer?.messageBusy
  });

export const playNoAnswerAndHangup = async (
  voice: VoiceResponse,
  playbackId: string,
  config: EffectsManagerConfig
) =>
  await playOrSay({
    voice,
    voiceConfig: config.voiceConfig,
    playbackId,
    media: config.transfer?.mediaNoAnswer,
    message: config.transfer?.messageNoAnswer
  });
