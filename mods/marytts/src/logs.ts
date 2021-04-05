/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import logger from "@fonos/logger";
import {DefaultConfig, OptionsInterface} from "./types";

export const maryTtsLogs = {
  initializing: (config: DefaultConfig): unknown =>
    logger.log(
      "debug",
      `@fonos/tts.MaryTTS.constructor [initializing with config: ${JSON.stringify(
        config
      )}]`
    ),

  serviceUrl: (url: string): unknown =>
    logger.log(
      "verbose",
      `@fonos/tts.MaryTTS.constructor [serviceUrl: ${url}]`
    ),

  synthesize: (text: string, options: OptionsInterface): unknown =>
    logger.log(
      "debug",
      `@fonos/tts.MaryTTS.synthesize [text: ${text}, options: ${JSON.stringify(
        options
      )}]`
    )
};
