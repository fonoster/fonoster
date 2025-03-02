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
import { Deepgram as DeepgramStt } from "../../voice/stt/Deepgram";
import { Google as GoogleStt } from "../../voice/stt/Google";
import { Azure as AzureTts } from "../../voice/tts/Azure";
import { Deepgram as DeepgramTts } from "../../voice/tts/Deepgram";
import { ElevenLabs as ElevenLabsTts } from "../../voice/tts/ElevenLabs";
import { Google as GoogleTts } from "../../voice/tts/Google";

const speechValidators = {
  ttsConfigValidators: {
    "tts.google": GoogleTts.getConfigValidationSchema,
    "tts.azure": AzureTts.getConfigValidationSchema,
    "tts.deepgram": DeepgramTts.getConfigValidationSchema,
    "tts.elevenlabs": ElevenLabsTts.getConfigValidationSchema
  },
  ttsCredentialsValidators: {
    "tts.google": GoogleTts.getCredentialsValidationSchema,
    "tts.azure": AzureTts.getCredentialsValidationSchema,
    "tts.deepgram": DeepgramTts.getCredentialsValidationSchema,
    "tts.elevenlabs": ElevenLabsTts.getCredentialsValidationSchema
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

export { speechValidators };
