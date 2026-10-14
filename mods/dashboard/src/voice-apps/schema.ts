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

// Same rule as the API (common/src/validators/hostOrHostPortSchema.ts).
const HOST =
  /^(?!:\/\/)([a-zA-Z0-9-_]+(\.[a-zA-Z0-9-_]+)*|(\d{1,3}\.){3}\d{1,3})$/;
const HOST_PORT =
  /^(?!:\/\/)([a-zA-Z0-9-_]+(\.[a-zA-Z0-9-_]+)*|(\d{1,3}\.){3}\d{1,3}):\d{1,5}$/;

export const endpointSchema = z
  .string()
  .trim()
  .min(1, "Enter the host:port of your voice server")
  .refine((value) => HOST.test(value) || HOST_PORT.test(value), {
    message: "Use host:port, like voice.acme.com:50061 (no http://)"
  });

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name")
  .max(255, "Use at most 255 characters");

export const speechSchema = z
  .object({
    voice: z.string(),
    transcriber: z.string(),
    language: z.string()
  })
  .refine(
    (s) =>
      s.language !== "multi" ||
      s.transcriber === "none" ||
      ["nova-3", "nova-2"].includes(s.transcriber),
    {
      message: "Multilingual needs nova-3 or nova-2",
      path: ["language"]
    }
  );

export const voiceAppSchema = z.object({
  name: nameSchema,
  endpoint: endpointSchema,
  speech: speechSchema
});

export type VoiceAppValues = z.infer<typeof voiceAppSchema>;
