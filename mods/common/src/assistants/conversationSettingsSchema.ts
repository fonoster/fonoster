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
import { z } from "zod";
import * as Messages from "../messages";

const ZERO_OR_GREATER_THAN_ZERO = "Must be a number greater than or equal to 0";
const NUMBER_BETWEEN_0_AND_1 = "Must be a number between 0 and 1";
const MAX_SPEECH_WAIT_TIMEOUT = 0;
const IDLE_OPTIONS_TIMEOUT = 10000;
const IDLE_OPTIONS_MAX_TIMEOUT_COUNT = 2;
const VAD_ACTIVATION_THRESHOLD = 0.4;
const VAD_DEACTIVATION_THRESHOLD = 0.25;
const VAD_DEBOUNCE_FRAMES = 4;

const conversationSettingsSchema = z.object({
  firstMessage: z.string().optional(),
  systemPrompt: z.string(),
  goodbyeMessage: z.string(),
  systemErrorMessage: z.string(),
  initialDtmf: z
    .string()
    .regex(/^[0-9*#]+$/, { message: Messages.VALID_DTMF })
    .optional(),
  maxSessionDuration: z
    .number()
    .int()
    .positive()
    .default(30 * 60 * 1000), // 30 minutes
  maxSpeechWaitTimeout: z
    .number()
    .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
    .gte(0, { message: ZERO_OR_GREATER_THAN_ZERO })
    .default(MAX_SPEECH_WAIT_TIMEOUT),
  transferOptions: z
    .object({
      phoneNumber: z.string(),
      message: z.string(),
      timeout: z
        .number()
        .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .positive({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .default(30000)
    })
    .optional(),
  idleOptions: z.object({
    message: z.string(),
    timeout: z
      .number()
      .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
      .positive({ message: Messages.POSITIVE_INTEGER_MESSAGE })
      .default(IDLE_OPTIONS_TIMEOUT),
    maxTimeoutCount: z
      .number()
      .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
      .positive({ message: Messages.POSITIVE_INTEGER_MESSAGE })
      .default(IDLE_OPTIONS_MAX_TIMEOUT_COUNT)
  }),
  vad: z
    .object({
      pathToModel: z.string().optional(),
      activationThreshold: z
        .number()
        .max(1)
        .min(0)
        .positive({ message: NUMBER_BETWEEN_0_AND_1 }),
      deactivationThreshold: z
        .number()
        .max(1)
        .min(0)
        .positive({ message: NUMBER_BETWEEN_0_AND_1 }),
      debounceFrames: z
        .number()
        .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .positive({ message: Messages.POSITIVE_INTEGER_MESSAGE })
    })
    .default({
      activationThreshold: VAD_ACTIVATION_THRESHOLD,
      deactivationThreshold: VAD_DEACTIVATION_THRESHOLD,
      debounceFrames: VAD_DEBOUNCE_FRAMES
    })
});

export { conversationSettingsSchema };
