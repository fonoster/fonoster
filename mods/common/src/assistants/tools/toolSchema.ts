/*
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
import { z } from "zod";
import { propertySchema } from "./propertySchema";
import * as Messages from "../../messages";
import { AllowedOperations } from "./AllowedOperations";

const toolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.object({
    type: z.enum(["object", "array"]),
    properties: z.record(propertySchema),
    required: z.array(z.string()).optional()
  }),
  requestStartMessage: z.string().optional(),
  operation: z
    .object({
      type: z.nativeEnum(AllowedOperations, {
        message: "Invalid operation type"
      }),
      // Make url required if operation type is not built-in
      url: z.string().url({ message: Messages.VALID_URL }).optional(),
      waitForResponse: z.boolean().optional(),
      headers: z.record(z.string()).optional()
    })
    .superRefine(({ url, type }, ctx: z.RefinementCtx) => {
      if (type !== AllowedOperations.BUILT_IN && !url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Url is required for non built-in operations."
        });
      }
    })
});

export { toolSchema };
