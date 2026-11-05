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
import * as fs from "fs";
import { BlockList, isIP } from "net";
import { FarEnd } from "./types";

const NAME = /^[a-z0-9-]+$/;

function fail(index: number, field: string, why: string): never {
  throw new Error(`far end ${index}: ${field} ${why}`);
}

function checkAddress(index: number, value: unknown): void {
  if (typeof value !== "string") fail(index, "addresses", "must be strings");
  const [ip, bits, extra] = value.split("/");
  const family = isIP(ip);
  if (!family || extra !== undefined) {
    fail(index, "addresses", `has a bad address: ${value}`);
  }
  if (bits !== undefined) {
    const n = Number(bits);
    const max = family === 4 ? 32 : 128;
    if (!/^\d+$/.test(bits) || n > max) {
      fail(index, "addresses", `has a bad prefix: ${value}`);
    }
  }
}

/**
 * Checks a list of far ends and returns it typed. Throws naming the entry's
 * index and the field when an entry is malformed. Unknown keys are ignored.
 */
export function parseFarEnds(input: unknown): FarEnd[] {
  if (!Array.isArray(input)) throw new Error("far ends must be a JSON array");
  const seen = new Set<string>();
  return input.map((entry, index) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      fail(index, "entry", "must be an object");
    }
    const { name, hosts, addresses } = entry as Record<string, unknown>;
    if (typeof name !== "string" || !NAME.test(name)) {
      fail(index, "name", "must match ^[a-z0-9-]+$");
    }
    if (seen.has(name)) fail(index, "name", `is used twice: ${name}`);
    seen.add(name);
    if (hosts !== undefined && !Array.isArray(hosts)) {
      fail(index, "hosts", "must be an array");
    }
    if (addresses !== undefined && !Array.isArray(addresses)) {
      fail(index, "addresses", "must be an array");
    }
    const h = (hosts as unknown[] | undefined) ?? [];
    const a = (addresses as unknown[] | undefined) ?? [];
    if (h.length === 0 && a.length === 0) {
      fail(index, "hosts", "or addresses must be set");
    }
    h.forEach((v) => {
      if (typeof v !== "string" || !v) fail(index, "hosts", "must be strings");
    });
    a.forEach((v) => checkAddress(index, v));
    return {
      name,
      ...(hosts ? { hosts: h as string[] } : {}),
      ...(addresses ? { addresses: a as string[] } : {})
    };
  });
}

/** Reads a JSON file of far ends (see parseFarEnds). */
export function loadFarEnds(path: string): FarEnd[] {
  return parseFarEnds(JSON.parse(fs.readFileSync(path, "utf8")));
}

function globToRegExp(glob: string): RegExp {
  const body = glob
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}$`, "i");
}

/** True when the host matches one of the far end's host globs. */
export function matchesHost(farEnd: FarEnd, host: string | undefined): boolean {
  if (!host) return false;
  return (farEnd.hosts ?? []).some((g) => globToRegExp(g).test(host));
}

/** True when the address is one of the far end's addresses or CIDRs. */
export function matchesAddress(
  farEnd: FarEnd,
  address: string | undefined
): boolean {
  const family = address ? isIP(address) : 0;
  if (!address || !family) return false;
  const list = new BlockList();
  (farEnd.addresses ?? []).forEach((entry) => {
    const [ip, bits] = entry.split("/");
    const type = isIP(ip) === 6 ? "ipv6" : "ipv4";
    if (bits === undefined) list.addAddress(ip, type);
    else list.addSubnet(ip, Number(bits), type);
  });
  return list.check(address, family === 6 ? "ipv6" : "ipv4");
}
