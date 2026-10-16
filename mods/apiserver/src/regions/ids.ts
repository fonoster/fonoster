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
import { RegionError } from "./types";

// Region ids, display names and SIP domains (add-private-regions PR-16, PR-18).

export const REGION_ID = /^[a-z][a-z0-9-]{2,31}$/;
export const GEO_PREFIXES = ["us-", "eu-", "sa-", "ap-", "af-", "me-"];
/** Words the HTTP routes use (`/api/regions/current`, …); never region ids. */
export const ROUTE_WORDS = ["current", "enroll", "admin"];
export const PUBLIC_REGION_ID = /^(us|eu|sa|ap|af|me)-[a-z]+-\d+$/;
export const DEFAULT_REGION_ID = "default";

/** A private region id: the format, not `default`, no public geo prefix, no route word. */
export function checkPrivateRegionId(id: unknown): string {
  if (typeof id !== "string" || !REGION_ID.test(id))
    throw new RegionError(
      400,
      "region_id_invalid",
      "the id must be 3-32 lowercase letters, digits or hyphens and start with a letter"
    );
  if (
    id === DEFAULT_REGION_ID ||
    ROUTE_WORDS.includes(id) ||
    GEO_PREFIXES.some((p) => id.startsWith(p))
  )
    throw new RegionError(
      400,
      "region_id_reserved",
      `"${id}" is reserved: \`default\` and the public prefixes ${GEO_PREFIXES.join(", ")} are for public regions`
    );
  return id;
}

/** A public region id: `default` or `<geo>-<area>-<n>` (us-east-1). */
export function checkPublicRegionId(id: unknown): string {
  if (
    typeof id !== "string" ||
    !REGION_ID.test(id) ||
    !(id === DEFAULT_REGION_ID || PUBLIC_REGION_ID.test(id))
  )
    throw new RegionError(
      400,
      "region_id_invalid",
      "a public region id is `default` or <geo>-<area>-<n> (e.g. us-east-1)"
    );
  return id;
}

export function checkDisplayName(name: unknown): string {
  const v = typeof name === "string" ? name.trim() : "";
  if (!v || v.length > 120)
    throw new RegionError(
      400,
      "display_name_invalid",
      "the display name must be 1-120 characters"
    );
  return v;
}

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/** True for a lowercase FQDN: 2+ labels, alphabetic TLD, ≤ 253 characters, no wildcard. */
export function isFqdn(value: string): boolean {
  if (!value || value.length > 253) return false;
  const labels = value.split(".");
  if (labels.length < 2) return false;
  if (!labels.every((l) => LABEL.test(l))) return false;
  return /^[a-z]{2,63}$/.test(labels[labels.length - 1]);
}

/** A region's SIP domain (PR-16), lowercased; required unless `optional`. */
export function checkSipDomain(
  value: unknown,
  optional = false
): string | undefined {
  if (optional && (value === undefined || value === null || value === ""))
    return undefined;
  const v =
    typeof value === "string"
      ? value.trim().toLowerCase().replace(/\.$/, "")
      : "";
  if (!isFqdn(v))
    throw new RegionError(
      400,
      "sip_domain_invalid",
      "the SIP domain must be a fully qualified domain name you control (e.g. sip.acme.com); point wildcard DNS (*.sip.acme.com) at the region"
    );
  return v;
}
