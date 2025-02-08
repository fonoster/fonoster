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
import { LanguageModelProvider } from "./LanguageModelProvider";
import { CallDirection } from "@fonoster/types";

const testCasesSchema = z.object({
  evalsLanguageModel: z.object({
    provider: z.enum(["openai"], {
      message:
        "Invalid language model provider. Only OpenAI is supported for evals."
    }),
    model: z.string(),
    apiKey: z.string()
  }),
  evalsSystemPrompt: z.string().optional(),
  sessions: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      telephonyContext: z.object({
        callDirection: z.nativeEnum(CallDirection),
        ingressNumber: z.string(),
        callerNumber: z.string()
      }),
      conversation: z.array(
        z.object({
          userInput: z.string(),
          expected: z.object({
            text: z.object({
              type: z.enum(["exact", "similar"]),
              response: z.string()
            }),
            functions: z
              .array(
                z.object({
                  tool: z.string(),
                  parameters: z.record(z.string(), z.any())
                })
              )
              .optional()
          })
        })
      )
    })
  )
});

export { testCasesSchema };
