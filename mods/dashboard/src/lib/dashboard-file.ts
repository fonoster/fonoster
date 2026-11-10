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

/** One request for /dashboard.yaml, shared by everything that reads it. */
export const DASHBOARD_FILE_KEY = ["dashboard.yaml"];

/** Only web links, so the file can't put a javascript: URL on a page. */
export const isWebLink = (value: string) => /^https?:\/\//.test(value);

/**
 * Downloads /dashboard.yaml and parses it, or null when there's no file or it
 * doesn't parse. The YAML parser loads only when the file is there.
 */
export async function loadDashboardFile(): Promise<unknown> {
  const res = await fetch("/dashboard.yaml", { cache: "no-store" });
  const type = res.headers.get("content-type") ?? "";
  // The dev server answers unknown paths with index.html.
  if (!res.ok || type.includes("html")) return null;
  const { parse } = await import("yaml");
  try {
    return parse(await res.text());
  } catch (err) {
    console.warn("dashboard.yaml doesn't parse:", err);
    return null;
  }
}
