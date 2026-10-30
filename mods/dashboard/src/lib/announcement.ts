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

const announcementSchema = z.object({
  show: z.boolean().default(false),
  tone: z.enum(["info", "warning", "critical"]).default("info"),
  lead: z.string().default(""),
  text: z.string().default(""),
  cta: z.string().default(""),
  link: z.string().default("")
});

export type Announcement = z.infer<typeof announcementSchema>;

/**
 * The announcement in config/dashboard.yaml, or null when there's none to show:
 * no file, show: false, nothing to say, or a file that doesn't parse. A broken
 * file never breaks the dashboard.
 */
export function parseAnnouncement(source: unknown): Announcement | null {
  const file = z.object({ announcement: z.unknown() }).safeParse(source);
  if (!file.success) return null;
  const result = announcementSchema.safeParse(file.data.announcement);
  if (!result.success) {
    console.warn(
      "dashboard.yaml: ignoring the announcement:",
      result.error.issues[0].message
    );
    return null;
  }
  const a = result.data;
  if (!a.show || !(a.lead || a.text)) return null;
  // Only web links, so the file can't put a javascript: URL in the bar.
  return /^https?:\/\//.test(a.link) ? a : { ...a, cta: "", link: "" };
}

/** Downloads /dashboard.yaml; the YAML parser loads only when the file is there. */
export async function loadAnnouncement(): Promise<Announcement | null> {
  const res = await fetch("/dashboard.yaml", { cache: "no-store" });
  const type = res.headers.get("content-type") ?? "";
  // The dev server answers unknown paths with index.html.
  if (!res.ok || type.includes("html")) return null;
  const { parse } = await import("yaml");
  try {
    return parseAnnouncement(parse(await res.text()));
  } catch (err) {
    console.warn("dashboard.yaml doesn't parse:", err);
    return null;
  }
}
