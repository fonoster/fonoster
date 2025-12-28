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
import { Stream } from "stream";
import * as z from "zod";
import { MethodNotImplementedError } from "../errors/MethodNotImplementedError";
import { SpeechToText } from "../types";
import { SpeechResult, StreamSpeech, SttConfig } from "./types";

abstract class AbstractSpeechToText<
  E,
  T extends SttConfig = SttConfig
> implements SpeechToText {
  abstract readonly engineName: E;
  config: T;

  constructor(config: T) {
    this.config = config;
  }

  abstract streamTranscribe(stream: Stream): StreamSpeech;

  abstract transcribe(stream: Stream): Promise<SpeechResult>;

  getName(): E {
    return this.engineName;
  }

  static getConfigValidationSchema(): z.Schema {
    throw new MethodNotImplementedError();
  }

  static getCredentialsValidationSchema(): z.Schema {
    throw new MethodNotImplementedError();
  }
}

export { AbstractSpeechToText };
