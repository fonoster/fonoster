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

const runtimeSchema = z.object({
  apiUrl: z
    .string({ required_error: "DASHBOARD_API_URL is not set" })
    .url("DASHBOARD_API_URL must be a URL, e.g. https://api.example.com")
});

export type RuntimeConfig = z.infer<typeof runtimeSchema>;

declare global {
  interface Window {
    __FONOSTER__?: unknown;
  }
}

export type RuntimeResult =
  | { ok: true; config: RuntimeConfig }
  | { ok: false; error: string };

/** Reads the settings that /config.js put on window at start-up. */
export function readRuntimeConfig(
  source: unknown = window.__FONOSTER__
): RuntimeResult {
  if (source === undefined || source === null) {
    return { ok: false, error: "DASHBOARD_API_URL is not set" };
  }
  const result = runtimeSchema.safeParse(source);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0].message };
  }
  return {
    ok: true,
    config: { apiUrl: result.data.apiUrl.replace(/\/+$/, "") }
  };
}
