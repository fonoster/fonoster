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
import { z } from "zod";

export enum AllowedHttpMethod {
  GET = "get",
  POST = "post"
}

export const propertySchema = z
  .object({
    type: z.string(),
    // NOTICE: We are adopting Gemini's format which only supports 'enum' and 'date-time'
    format: z.enum(["enum", "date-time"]).optional(),
    pattern: z.string().optional()
  })
  .refine(
    (data) => {
      return !("format" in data && "pattern" in data);
    },
    {
      message: "Property can only have either 'format' or 'pattern', not both."
    }
  );

export const toolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.object({
    type: z.enum(["object", "array"]),
    properties: z.record(propertySchema),
    required: z.array(z.string()).optional()
  }),
  requestStartMessage: z.string().optional(),
  operation: z.object({
    method: z
      .nativeEnum(AllowedHttpMethod, {
        message: "Invalid method"
      })
      .default(AllowedHttpMethod.GET),
    url: z.string().url({ message: "Invalid URL" }),
    waitForResponse: z.boolean().default(true),
    headers: z
      .record(z.string(), z.string())
      .refine(
        (headers) =>
          !Object.keys(headers || {}).some(
            (key) =>
              key.toLowerCase() === "accept" ||
              key.toLowerCase() === "content-type"
          ),
        {
          message:
            "Headers cannot include 'accept' or 'content-type' as they are set internally"
        }
      )
      .optional()
  })
});
