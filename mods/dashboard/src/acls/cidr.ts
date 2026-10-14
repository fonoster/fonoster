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

const OCTET = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const IPV4 = new RegExp(`^${OCTET}(\\.${OCTET}){3}$`);

export function isIPv4(value: string): boolean {
  return IPV4.test(value);
}

export function isIPv6(value: string): boolean {
  const halves = value.split("::");
  if (halves.length > 2) return false;
  const groups = halves.flatMap((half) => (half === "" ? [] : half.split(":")));
  let count = groups.length;
  // An embedded IPv4 tail (::ffff:10.0.0.1) takes the room of two groups.
  const last = groups[groups.length - 1];
  if (last?.includes(".")) {
    if (!isIPv4(last)) return false;
    groups.pop();
    count += 1;
  }
  if (groups.some((group) => !/^[0-9a-fA-F]{1,4}$/.test(group))) return false;
  return halves.length === 2 ? count < 8 : count === 8;
}

function withPrefix(
  value: string,
  isAddress: (v: string) => boolean,
  max: number
): boolean {
  const [address, prefix, ...rest] = value.split("/");
  if (rest.length > 0 || !isAddress(address)) return false;
  if (prefix === undefined) return true;
  if (!/^\d{1,3}$/.test(prefix)) return false;
  return Number(prefix) <= max;
}

/** "10.0.0.1" or "10.0.0.0/16". */
export function isIPv4OrCidr(value: string): boolean {
  return withPrefix(value, isIPv4, 32);
}

/** "2001:db8::1" or "2001:db8::/32". */
export function isIPv6OrCidr(value: string): boolean {
  return withPrefix(value, isIPv6, 128);
}

/**
 * Whether the API accepts the entry. The API (common/src/validators/sipnet/acls.ts)
 * only takes IPv4 addresses and ranges today; flip this when it accepts IPv6.
 */
export const ACCEPTS_IPV6 = false;

export function isAllowedEntry(value: string): boolean {
  return isIPv4OrCidr(value) || (ACCEPTS_IPV6 && isIPv6OrCidr(value));
}
