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

/** The `logs` section shared by every Fonoster service's config file. */
const logsSchema = z
  .object({
    level: z
      .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
      .default("info"),
    format: z.enum(["json", "text"]).default("json"),
    transport: z.enum(["console", "fluent"]).default("console"),
    fluent: z
      .object({
        host: z.string(),
        port: z.number().int().positive().default(24224),
        tagPrefix: z.string().default("fonoster-logs")
      })
      .optional()
  })
  .superRefine((logs, ctx) => {
    if (logs.transport === "fluent" && !logs.fluent) {
      ctx.addIssue({
        code: "custom",
        path: ["fluent"],
        message: "required when transport is fluent"
      });
    }
  })
  .prefault({});

type LogsConfig = z.infer<typeof logsSchema>;

export { logsSchema, LogsConfig };
