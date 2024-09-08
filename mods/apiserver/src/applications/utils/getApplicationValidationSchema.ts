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
import { hostOrHostPortSchema } from "@fonoster/common";
import { ApplicationType } from "@prisma/client";
import { z } from "zod";
import { Deepgram as DeepgramStt } from "../../voice/stt/Deepgram";
import { Google as GoogleStt } from "../../voice/stt/Google";
import { Azure as AzureTts } from "../../voice/tts/Azure";
import { Deepgram as DeepgramTts } from "../../voice/tts/Deepgram";
import { Google as GoogleTts } from "../../voice/tts/Google";

// TODO: We need a way to add this values dynamically
const validators = {
  ttsConfigValidators: {
    "tts.google": GoogleTts.getConfigValidationSchema,
    "tts.azure": AzureTts.getConfigValidationSchema,
    "tts.deepgram": DeepgramTts.getConfigValidationSchema
  },
  ttsCredentialsValidators: {
    "tts.google": GoogleTts.getCredentialsValidationSchema,
    "tts.azure": AzureTts.getCredentialsValidationSchema,
    "tts.deepgram": DeepgramTts.getCredentialsValidationSchema
  },
  sttConfigValidators: {
    "stt.google": GoogleStt.getConfigValidationSchema,
    "stt.deepgram": DeepgramStt.getConfigValidationSchema
  },
  sttCredentialsValidators: {
    "stt.google": GoogleStt.getCredentialsValidationSchema,
    "stt.deepgram": DeepgramStt.getCredentialsValidationSchema
  }
};

function getApplicationValidationSchema(request: {
  ttsEngineName: string;
  sttEngineName: string;
}) {
  const { ttsEngineName, sttEngineName } = request;

  return z.object({
    name: z.string(),
    type: z.nativeEnum(ApplicationType),
    endpoint: hostOrHostPortSchema,
    textToSpeech: ttsEngineName
      ? z.object({
          productRef: z.string(),
          config: validators.ttsConfigValidators[ttsEngineName]()
        })
      : z.undefined(),
    speechToText: sttEngineName
      ? z.object({
          productRef: z.string(),
          config: validators.sttConfigValidators[sttEngineName]()
        })
      : z.undefined()
  });
}

export { getApplicationValidationSchema };
