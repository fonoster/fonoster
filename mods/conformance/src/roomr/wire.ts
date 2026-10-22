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
import * as grpc from "@grpc/grpc-js";

// Wire helpers for the Roomr suite: scenario files spell proto fields in snake_case (as the
// protos and the NATS events do) while protoLoader works in camelCase; the keys of map fields
// (`headers`, `metadata`) are data and never converted. Refusals carry a google.rpc.ErrorInfo
// reason in grpc-status-details-bin, which the suite reads and the fake node writes.

/** Map fields whose keys are data, not field names. */
const MAP_FIELDS = new Set(["headers", "metadata"]);

const toCamel = (k: string) =>
  k.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const toSnake = (k: string) =>
  k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function convert(value: unknown, key: (k: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => convert(v, key));
  if (value === null || typeof value !== "object" || Buffer.isBuffer(value))
    return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const name = key(k);
    out[name] = MAP_FIELDS.has(k) || MAP_FIELDS.has(name) ? v : convert(v, key);
  }
  return out;
}

/** snake_case field names to protoLoader's camelCase (map keys untouched). */
export function camelFields<T = Record<string, unknown>>(value: unknown): T {
  return convert(value, toCamel) as T;
}

/** camelCase field names to the protos' snake_case (map keys untouched). */
export function snakeFields<T = Record<string, unknown>>(value: unknown): T {
  return convert(value, toSnake) as T;
}

/** The gRPC status name of a code ("RESOURCE_EXHAUSTED"). */
export function statusName(code: number): string {
  return grpc.status[code] ?? String(code);
}

// ---- google.rpc.Status / ErrorInfo, by hand (two small messages) --------------------------

function varint(n: number): Buffer {
  const bytes: number[] = [];
  let v = n >>> 0;
  while (v > 0x7f) {
    bytes.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  bytes.push(v);
  return Buffer.from(bytes);
}

function field(num: number, wire: number, body: Buffer | number): Buffer {
  const tag = varint((num << 3) | wire);
  if (typeof body === "number") return Buffer.concat([tag, varint(body)]);
  return Buffer.concat([tag, varint(body.length), body]);
}

function readFields(buf: Buffer): { num: number; value: Buffer | number }[] {
  const out: { num: number; value: Buffer | number }[] = [];
  let i = 0;
  const readVarint = () => {
    let shift = 0;
    let result = 0;
    while (i < buf.length) {
      const b = buf[i++];
      result += (b & 0x7f) * 2 ** shift;
      if (!(b & 0x80)) break;
      shift += 7;
    }
    return result;
  };
  while (i < buf.length) {
    const tag = readVarint();
    const num = Math.floor(tag / 8);
    const wire = tag & 7;
    if (wire === 0) out.push({ num, value: readVarint() });
    else if (wire === 2) {
      const len = readVarint();
      out.push({ num, value: buf.subarray(i, i + len) });
      i += len;
    } else if (wire === 5) i += 4;
    else if (wire === 1) i += 8;
    else break;
  }
  return out;
}

const ERROR_INFO_TYPE = "type.googleapis.com/google.rpc.ErrorInfo";

/** grpc-status-details-bin for a refusal with an ErrorInfo reason (what the Go node sends). */
export function statusDetails(
  code: number,
  message: string,
  reason: string,
  domain = "roomr.fonoster.com"
): Buffer {
  const info = Buffer.concat([
    field(1, 2, Buffer.from(reason)),
    field(2, 2, Buffer.from(domain))
  ]);
  const any = Buffer.concat([
    field(1, 2, Buffer.from(ERROR_INFO_TYPE)),
    field(2, 2, info)
  ]);
  return Buffer.concat([
    field(1, 0, code),
    field(2, 2, Buffer.from(message)),
    field(3, 2, any)
  ]);
}

/** The ErrorInfo reason in a gRPC error's status details, if any. */
export function errorReason(err: grpc.ServiceError): string | undefined {
  const raw = err.metadata?.get("grpc-status-details-bin")?.[0];
  if (!raw) return undefined;
  const status = readFields(Buffer.isBuffer(raw) ? raw : Buffer.from(raw));
  for (const f of status) {
    if (f.num !== 3 || !Buffer.isBuffer(f.value)) continue;
    const any = readFields(f.value);
    const type = any.find((a) => a.num === 1)?.value;
    const body = any.find((a) => a.num === 2)?.value;
    if (String(type) !== ERROR_INFO_TYPE || !Buffer.isBuffer(body)) continue;
    const reason = readFields(body).find((a) => a.num === 1)?.value;
    if (Buffer.isBuffer(reason)) return reason.toString();
  }
  return undefined;
}

/** A refusal for a fake server's callback: the gRPC code, its message and an ErrorInfo reason. */
export function refusal(
  code: grpc.status,
  reason: string,
  message = reason
): grpc.ServiceError {
  const metadata = new grpc.Metadata();
  metadata.set("grpc-status-details-bin", statusDetails(code, message, reason));
  return Object.assign(new Error(message), {
    code,
    details: message,
    metadata
  }) as grpc.ServiceError;
}
