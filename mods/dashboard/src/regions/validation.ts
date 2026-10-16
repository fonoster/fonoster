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
const ID = /^[a-z][a-z0-9-]{2,31}$/;
const RESERVED_PREFIXES = ["us-", "eu-", "sa-", "ap-", "af-", "me-"];
const FQDN =
  /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

/** Region id rules (PR-18). Returns an error message, or undefined when valid. */
export function validateRegionId(id: string): string | undefined {
  if (!ID.test(id))
    return "Use 3 to 32 lowercase letters, digits or hyphens, starting with a letter";
  if (id === "default" || RESERVED_PREFIXES.some((p) => id.startsWith(p)))
    return "This id is reserved";
  return undefined;
}

/** The customer's own SIP domain: a fully qualified domain name (PR-16). */
export function validateSipDomain(domain: string): string | undefined {
  return FQDN.test(domain.trim())
    ? undefined
    : "Enter a domain like sip.acme.com";
}
