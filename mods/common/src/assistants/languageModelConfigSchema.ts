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
import { toolSchema } from "./tools";
import { LanguageModelProvider } from "./LanguageModelProvider";
import * as Messages from "../messages";

const NUMBER_BETWEEN_0_AND_2 = "Must be a number between 0 and 2";

const languageModelConfigSchema = z.object({
  provider: z.nativeEnum(LanguageModelProvider, {
    message: "Invalid language model provider."
  }),
  apiKey: z.string().optional(),
  model: z.string(),
  temperature: z
    .number()
    .max(2, { message: NUMBER_BETWEEN_0_AND_2 })
    .min(0, { message: NUMBER_BETWEEN_0_AND_2 }),
  maxTokens: z
    .number()
    .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
    .positive({ message: Messages.POSITIVE_INTEGER_MESSAGE }),
  baseUrl: z
    .string()
    .url({
      message: Messages.VALID_URL
    })
    .optional(),
  knowledgeBase: z.array(
    z.object({
      type: z.enum(["s3"]),
      title: z.string(),
      document: z.string().regex(/\.pdf$/, {
        message: "Document must be a pdf file"
      })
    })
  ),
  tools: z.array(toolSchema)
});

export { languageModelConfigSchema };