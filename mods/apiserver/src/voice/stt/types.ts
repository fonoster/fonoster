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
import { VoiceLanguage } from "@fonoster/common/src/tts/types";

enum DeepgramModel {
  NOVA_2 = "nova-2"
}

type SttConfig = {
  languageCode: VoiceLanguage;
};

type SpeechResult = {
  speech: string;
  isFinal: boolean;
};

type StreamSpeech = {
  on(events: string, callback: (result: SpeechResult) => void): void;
  // close: () => void;
};

type GoogleSttConfig = SttConfig & {
  config: {
    encoding: "LINEAR16";
    sampleRateHertz: 16000;
    interimResults: boolean;
    languageCode: VoiceLanguage;
  };
  credentials: {
    client_email: string;
    private_key: string;
  };
};

type DeepgramSttConfig = SttConfig & {
  config: {
    model: DeepgramModel;
    language: VoiceLanguage;
  };
  credentials: {
    apiKey: string;
  };
};

export {
  SttConfig,
  SpeechResult,
  StreamSpeech,
  GoogleSttConfig,
  DeepgramSttConfig,
  DeepgramModel
};
