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
type SynthOptions = {
  voice: string;
};

type DeepgramTtsConfig = {
  [key: string]: Record<string, string>;
  credentials: {
    apiKey: string;
  };
};

type ElevenLabsTtsConfig = {
  [key: string]: Record<string, string>;
  credentials: {
    apiKey: string;
  };
};

type GoogleTtsConfig = {
  [key: string]: Record<string, string>;
  credentials: {
    client_email: string;
    private_key: string;
  };
};

type AzureTTSConfig = {
  [key: string]: Record<string, string>;
  credentials: {
    subscriptionKey: string;
    serviceRegion: string;
  };
};

export {
  SynthOptions,
  AzureTTSConfig,
  DeepgramTtsConfig,
  ElevenLabsTtsConfig,
  GoogleTtsConfig
};
