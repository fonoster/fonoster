/*
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

const NUMBER_BETWEEN_0_AND_1 = "Must be a number between 0 and 1";

const conversationSettingsSchema = z.object({
  firstMessage: z.string().optional(),
  systemTemplate: z.string(),
  goodbyeMessage: z.string(),
  systemErrorMessage: z.string(),
  initialDtmf: z
    .string()
    .regex(/^[0-9*#]+$/, { message: Messages.VALID_DTMF })
    .optional(),
  maxSpeechWaitTimeout: z
    .number()
    .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
    .positive({ message: Messages.POSITIVE_INTEGER_MESSAGE }),
  transferOptions: z
    .object({
      phoneNumber: z.string(),
      message: z.string(),
      timeout: z
        .number()
        .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .positive({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .optional()
    })
    .optional(),
  idleOptions: z
    .object({
      message: z.string(),
      timeout: z
        .number()
        .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .positive({ message: Messages.POSITIVE_INTEGER_MESSAGE }),
      maxTimeoutCount: z
        .number()
        .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .positive({ message: Messages.POSITIVE_INTEGER_MESSAGE })
    })
    .optional(),
  vad: z.object({
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
});

export { conversationSettingsSchema };
