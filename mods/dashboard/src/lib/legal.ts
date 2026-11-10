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
import { isWebLink } from "./dashboard-file";

const legalSchema = z.object({
  terms: z.string().nullish(),
  privacy: z.string().nullish()
});

export type Legal = { terms: string; privacy: string };

/**
 * The Terms and Privacy Policy links in config/dashboard.yaml, or null when
 * neither is set: no file, no legal key, empty values or a file that doesn't
 * parse. A link that isn't http(s) counts as empty.
 */
export function parseLegal(source: unknown): Legal | null {
  const file = z.object({ legal: z.unknown() }).safeParse(source);
  if (!file.success || file.data.legal == null) return null;
  const result = legalSchema.safeParse(file.data.legal);
  if (!result.success) {
    console.warn(
      "dashboard.yaml: ignoring legal:",
      result.error.issues[0].message
    );
    return null;
  }
  const terms = webLink("terms", result.data.terms);
  const privacy = webLink("privacy", result.data.privacy);
  return terms || privacy ? { terms, privacy } : null;
}

function webLink(key: string, value?: string | null) {
  if (!value || isWebLink(value)) return value ?? "";
  console.warn(`dashboard.yaml: ignoring legal.${key}, not an http(s) URL`);
  return "";
}
