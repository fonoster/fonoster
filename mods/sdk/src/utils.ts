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
import { Struct } from "google-protobuf/google/protobuf/struct_pb";
import { TrackCallResponse } from "./generated/web/calls_pb";

type PartialApplicationInput = {
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

function buildStructOverride<T extends PartialApplicationInput>(request: T): T {
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

function buildStructOverrideReverse(request) {
  const result = {
    ...request,
    textToSpeech: request.textToSpeech
      ? {
          ...request.textToSpeech,
          config: request.textToSpeech.config
            ? request.textToSpeech.config.toJavaScript()
            : undefined
        }
      : undefined,
    speechToText: request.speechToText
      ? {
          ...request.speechToText,
          config: request.speechToText.config
            ? request.speechToText.config.toJavaScript()
            : undefined
        }
      : undefined,
    intelligence: request.intelligence
      ? {
          ...request.intelligence,
          credentials: request.intelligence.credentials
            ? request.intelligence.credentials.toJavaScript()
            : undefined,
          config: request.intelligence.config
            ? request.intelligence.config.toJavaScript()
            : undefined
        }
      : undefined
  };

  Object.keys(result).forEach(
    (key) => result[key] === undefined && delete result[key]
  );

  return result;
}

function dialStatusToString(status: number): string {
  switch (status) {
    case TrackCallResponse.Status.TRYING:
      return "TRYING";
    case TrackCallResponse.Status.ANSWER:
      return "ANSWER";
    case TrackCallResponse.Status.BUSY:
      return "BUSY";
    case TrackCallResponse.Status.CANCEL:
      return "CANCEL";
    case TrackCallResponse.Status.NOANSWER:
      return "ERROR";
    case TrackCallResponse.Status.FAILED:
      return "FAILED";
    case TrackCallResponse.Status.PROGRESS:
      return "PROGRESS";
  }
}

export { buildStructOverride, buildStructOverrideReverse, dialStatusToString };
