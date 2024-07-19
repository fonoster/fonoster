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
import { Struct } from "google-protobuf/google/protobuf/struct_pb";

type CreateOrUpdateRequest = {
  textToSpeech?: {
    config: { [key: string]: unknown };
  } | null;
  speechToText?: {
    config: { [key: string]: unknown };
  } | null;
  intelligence?: {
    credentials: { [key: string]: unknown };
    config: { [key: string]: unknown };
  } | null;
};

function buildStructOverride<T extends CreateOrUpdateRequest>(request: T): T {
  return {
    ...request,
    textToSpeech: request.textToSpeech
      ? {
          ...request.textToSpeech,
          config: request.textToSpeech.config
            ? Struct.fromJavaScript(request.textToSpeech.config)
            : undefined
        }
      : undefined,
    speechToText: request.speechToText
      ? {
          ...request.speechToText,
          config: request.speechToText.config
            ? Struct.fromJavaScript(request.speechToText.config)
            : undefined
        }
      : undefined,
    intelligence: request.intelligence
      ? {
          ...request.intelligence,
          credentials: request.intelligence.credentials
            ? Struct.fromJavaScript(request.intelligence.credentials)
            : undefined,
          config: request.intelligence.config
            ? Struct.fromJavaScript(request.intelligence.config)
            : undefined
        }
      : undefined
  };
}

export { buildStructOverride };
