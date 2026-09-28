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
import { getLogger } from "@fonoster/logger";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";
import { MethodNotImplementedError } from "../errors/MethodNotImplementedError";
import { SynthOptions } from "./types";
import { createErrorStream } from "./utils/createErrorStream";
import { isSsml } from "./utils/isSsml";

const logger = getLogger({ service: "apiserver", filePath: __filename });

abstract class AbstractTextToSpeech<E, S extends SynthOptions = SynthOptions> {
  abstract readonly engineName: E;
  protected abstract OUTPUT_FORMAT: "wav" | "sln16";
  protected abstract CACHING_FIELDS: string[];

  abstract synthesize(
    text: string,
    options: S
  ): { ref: string; stream: Readable };

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

  /**
   * Resolves the voice for a single synthesis request. A voice passed in the
   * say options takes precedence over the voice configured for the application.
   * When `knownVoices` is given, an override that is not one of them is ignored
   * (with a warning) so a bad value never breaks the call.
   *
   * @param {Partial<SynthOptions>} options - The options passed to the say verb
   * @param {string} configuredVoice - The voice configured for the application
   * @param {Record<string, string>} knownVoices - The voices the engine supports
   * @return {string} The voice to use for this request
   */
  protected resolveVoice(
    options: Partial<SynthOptions> | undefined,
    configuredVoice: string,
    knownVoices?: Record<string, string>
  ): string {
    const requested = options?.voice;

    if (typeof requested !== "string" || requested.trim() === "") {
      return configuredVoice;
    }

    if (knownVoices && !Object.values(knownVoices).includes(requested)) {
      logger.warn(
        `ignoring unknown ${this.engineName} voice "${requested}"; using the configured voice`
      );
      return configuredVoice;
    }

    return requested;
  }

  protected logSynthesisRequest(text: string, options: S): void {
    logger.verbose(
      `synthesize [input: ${text}, isSsml=${isSsml(
        text
      )} options: ${JSON.stringify(options)}]`
    );
  }

  protected async safeSynthesize(
    ref: string,
    synthesisFunction: () => Promise<Readable>
  ): Promise<{ ref: string; stream: Readable }> {
    try {
      const stream = await synthesisFunction();
      return { ref, stream };
    } catch (error) {
      return {
        ref,
        stream: createErrorStream(
          `${this.engineName} synthesis failed: ${error.message}`
        )
      };
    }
  }
}

export { AbstractTextToSpeech };
