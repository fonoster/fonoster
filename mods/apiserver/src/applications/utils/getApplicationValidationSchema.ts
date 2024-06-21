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
import { ApplicationType } from "@prisma/client";
import { z } from "zod";
import { Google as GoogleStt } from "../../voice/stt/Google";
import { Azure as AzureTts } from "../../voice/tts/Azure";
import { Google as GoogleTts } from "../../voice/tts/Google";
import { hostOrHostPortSchema } from "../hostOrHostPortSchema";

const validators = {
  ttsConfigValidators: {
    "tts.google": GoogleTts.getConfigValidationSchema,
    "tts.azure": AzureTts.getConfigValidationSchema
  },
  ttsCredentialsValidators: {
    "tts.google": GoogleTts.getCredentialsValidationSchema,
    "tts.azure": AzureTts.getCredentialsValidationSchema
  },
  sttConfigValidators: {
    "stt.google": GoogleStt.getConfigValidationSchema
  },
  sttCredentialsValidators: {
    "stt.google": GoogleStt.getCredentialsValidationSchema
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
    appEndpoint: hostOrHostPortSchema,
    textToSpeech: z.object({
      productRef: z.string(),
      config: validators.ttsConfigValidators[ttsEngineName]()
    }),
    speechToText: z.object({
      productRef: z.string(),
      config: validators.sttConfigValidators[sttEngineName]()
    })
  });
}

export { getApplicationValidationSchema };
