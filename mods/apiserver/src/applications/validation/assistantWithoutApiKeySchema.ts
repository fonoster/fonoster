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
import { assistantSchema } from "@fonoster/common";
import { z } from "zod";

const assistantWithoutApiKeySchema = assistantSchema.extend({
  languageModel: assistantSchema.shape.languageModel.superRefine(
    (data, ctx) => {
      if ("apiKey" in data) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "apiKey is not allowed in languageModel",
          path: ["apiKey"]
        });
      }
    }
  )
});

export { assistantWithoutApiKeySchema };
