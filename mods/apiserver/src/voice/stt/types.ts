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
import { VoiceLanguage } from "@fonoster/common";

type SpeechResult = {
  speech: string;
  isFinal: boolean;
  responseTime: number;
};

type StreamSpeech = {
  on(events: string, callback: (result: SpeechResult) => void): void;
  // close: () => void;
};

type SttConfig = {
  config: {
    languageCode: VoiceLanguage;
  };
};

type GoogleSttConfig = {
  config: {
    languageCode: VoiceLanguage;
  };
  credentials: {
    client_email: string;
    private_key: string;
  };
};

enum DeepgramModel {
  NOVA_3 = "nova-3",
  NOVA_2 = "nova-2",
  NOVA_2_PHONECALL = "nova-2-phonecall",
  NOVA_2_CONVERSATIONALAI = "nova-2-conversationalai"
}

type DeepgramSttConfig = {
  config: {
    languageCode: VoiceLanguage;
    model: DeepgramModel;
    smartFormat: boolean;
    noDelay: boolean;
  };
  credentials: {
    apiKey: string;
  };
};

export {
  DeepgramModel,
  DeepgramSttConfig,
  GoogleSttConfig,
  SpeechResult,
  StreamSpeech,
  SttConfig
};
