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
import {
  JavaScriptValue,
  Struct
} from "google-protobuf/google/protobuf/struct_pb";
import { TrackCallResponse } from "./generated/web/calls_pb";

type PartialApplicationInput = {
  intelligence?: {
    config: { [key: string]: unknown };
  } | null;
  /** Audio filters; each filter's options travel as a protobuf Struct. */
  filters?: { name: string; options?: { [key: string]: unknown } }[] | null;
};

/** Config objects are plain JSON from the caller, which is what a protobuf Struct holds. */
function asStructInput(value: { [key: string]: unknown }): {
  [key: string]: JavaScriptValue;
} {
  return value as { [key: string]: JavaScriptValue };
}

/** The Autopilot agent (intelligence.config) and filter options travel as protobuf Structs. */
function buildStructOverride<T extends PartialApplicationInput>(request: T): T {
  return {
    ...request,
    intelligence: request.intelligence
      ? {
          ...request.intelligence,
          config: request.intelligence.config
            ? Struct.fromJavaScript(asStructInput(request.intelligence.config))
            : undefined
        }
      : undefined,
    filters: request.filters
      ? request.filters.map((f) => ({
          name: f.name,
          options: f.options
            ? Struct.fromJavaScript(asStructInput(f.options))
            : undefined
        }))
      : request.filters
  };
}

function buildStructOverrideReverse(request) {
  const result = {
    ...request,
    intelligence: request.intelligence
      ? {
          ...request.intelligence,
          config: request.intelligence.config
            ? request.intelligence.config.toJavaScript()
            : undefined
        }
      : undefined,
    filters: Array.isArray(request.filters)
      ? request.filters.map((f) => {
          const options =
            f.options && typeof f.options.toJavaScript === "function"
              ? f.options.toJavaScript()
              : f.options;
          return options && Object.keys(options).length
            ? { name: f.name, options }
            : { name: f.name };
        })
      : undefined
  };

  Object.keys(result).forEach(
    (key) => result[key] === undefined && delete result[key]
  );

  return result;
}

function dialStatusToString(status: number): string | undefined {
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

export {
  asStructInput,
  buildStructOverride,
  buildStructOverrideReverse,
  dialStatusToString
};
