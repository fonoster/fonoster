/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { AzureVoice, GoogleVoice, VoiceLanguage } from "@fonoster/common";
import {
  EXPERIMENTAL_AZURE_TTS_REGION,
  EXPERIMENTAL_AZURE_TTS_SUBSCRIPTION_KEY,
  EXPERIMENTAL_GOOGLE_TTS_CLIENT_EMAIL,
  EXPERIMENTAL_GOOGLE_TTS_PRIVATE_KEY
} from "../envs";

const azureTtsConfig = {
  engine: "azure",
  options: {
    voice: AzureVoice.EN_AU_ANNETTE_NEURAL
  },
  credentials: {
    subscriptionKey: EXPERIMENTAL_AZURE_TTS_SUBSCRIPTION_KEY,
    serviceRegion: EXPERIMENTAL_AZURE_TTS_REGION
  }
};

const googleTtsConfig = {
  engine: "google",
  options: {
    voice: GoogleVoice.EN_US_STUDIO_O
  },
  credentials: {
    client_email: EXPERIMENTAL_GOOGLE_TTS_CLIENT_EMAIL,
    private_key: EXPERIMENTAL_GOOGLE_TTS_PRIVATE_KEY
  }
};

const googleSttConfig = {
  engine: "google",
  languageCode: VoiceLanguage.EN_US,
  options: {
    languageCode: VoiceLanguage.EN_US
  },
  credentials: {
    client_email: EXPERIMENTAL_GOOGLE_TTS_CLIENT_EMAIL,
    private_key: EXPERIMENTAL_GOOGLE_TTS_PRIVATE_KEY
  }
};

const fonosterSDKMock = {
  getApp: async (_appRef: string) => {
    return {
      ref: "fakeRef",
      accessKeyId: "WO00000000000000000000000000000000",
      endpoint: "localhost:50061",
      ttsConfig: googleTtsConfig,
      sttConfig: googleSttConfig
    };
  }
};

export { fonosterSDKMock };
