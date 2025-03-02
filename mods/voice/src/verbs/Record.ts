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
import { Messages, RecordRequest } from "@fonoster/common";
import { z } from "zod";
import { Verb } from "./Verb";

class Record extends Verb<RecordRequest> {
  getValidationSchema(): z.Schema {
    return z.object({
      maxDuration: z
        .number()
        .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .positive({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .optional(),
      maxSilence: z
        .number()
        .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .positive({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .optional(),
      beep: z.boolean().optional(),
      finishOnKey: z
        .string()
        .regex(/^[0-9*#]+$/, { message: Messages.VALID_DTMF })
        .length(1, {
          message: Messages.MUST_BE_A_SINGLE_CHARACTER
        })
        .optional()
    });
  }
}

export { Record };
