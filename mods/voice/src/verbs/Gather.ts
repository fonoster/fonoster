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
import { z } from "zod";
import { GatherRequest, GatherSource } from "./types";
import { Verb } from "./Verb";

class Gather extends Verb<GatherRequest> {
  getValidationSchema(): z.Schema {
    return z.object({
      source: z
        .enum([
          GatherSource.SPEECH,
          GatherSource.DTMF,
          GatherSource.SPEECH_AND_DTMF
        ])
        .optional(),
      finishOnKey: z
        .string()
        .regex(/^[0-9*#]+$/)
        .length(1)
        .optional(),
      timeout: z.number().int().positive().optional(),
      maxDigits: z.number().int().positive().optional()
    });
  }
}

export { Gather };
