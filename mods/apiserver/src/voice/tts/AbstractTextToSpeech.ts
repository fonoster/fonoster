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
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";
import { MethodNotImplementedError } from "../errors/MethodNotImplementedError";
import { SynthOptions } from "./types";

abstract class AbstractTextToSpeech<E, S extends SynthOptions = SynthOptions> {
  abstract readonly engineName: E;
  protected abstract OUTPUT_FORMAT: "wav" | "sln16";
  protected abstract CACHING_FIELDS: string[];

  abstract synthesize(
    text: string,
    options: S
  ): Promise<{ ref: string; stream: Readable }>;

  static getConfigValidationSchema(): z.Schema {
    throw new MethodNotImplementedError();
  }

  static getCredentialsValidationSchema(): z.Schema {
    throw new MethodNotImplementedError();
  }

  protected createMediaReference(): string {
    return uuidv4();
  }

  getName(): E {
    return this.engineName;
  }
}

export { AbstractTextToSpeech };
