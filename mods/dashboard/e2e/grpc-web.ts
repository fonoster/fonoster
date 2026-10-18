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
/*
 * A gRPC-web (text mode) stand-in for the Fonoster API, driven by Playwright's
 * page.route. Messages are built with the SDK's own generated protobuf
 * classes, so the dashboard decodes them exactly as it would real responses.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { Page, Route } from "@playwright/test";

const require = createRequire(import.meta.url);
const sdkDir = dirname(require.resolve("@fonoster/sdk/package.json"));
const pb = (name: string) => require(join(sdkDir, "src/generated/web", `${name}_pb.js`));

/* eslint-disable @typescript-eslint/no-explicit-any */
export const identity: any = pb("identity");
export const capabilities: any = pb("capabilities");
export const applications: any = pb("applications");
export const numbers: any = pb("numbers");
export const calls: any = pb("calls");
export const struct: any = require(join(dirname(require.resolve("google-protobuf/package.json", { paths: [sdkDir] })), "google/protobuf/struct_pb.js"));
const empty: any = require(join(dirname(require.resolve("google-protobuf/package.json", { paths: [sdkDir] })), "google/protobuf/empty_pb.js"));
/* eslint-enable @typescript-eslint/no-explicit-any */

export const API_URL = "http://localhost:8449";

type Message = { serializeBinary(): Uint8Array };
type Reply = Message | { error: { code: number; message: string } };
type Handler = (request: Uint8Array) => Reply | Promise<Reply>;

function frame(flag: number, payload: Uint8Array) {
  const out = new Uint8Array(5 + payload.length);
  out[0] = flag;
  new DataView(out.buffer).setUint32(1, payload.length);
  out.set(payload, 5);
  return out;
}

function decodeRequest(body: string | null): Uint8Array {
  if (!body) return new Uint8Array();
  const bytes = Buffer.from(body, "base64");
  const length = bytes.readUInt32BE(1);
  return new Uint8Array(bytes.subarray(5, 5 + length));
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-expose-headers": "grpc-status,grpc-message"
};

export class GrpcWebMock {
  private handlers = new Map<string, Handler>();
  /** Every call the dashboard made: method name → decoded request bytes. */
  readonly calls: { method: string; request: Uint8Array }[] = [];

  constructor(private page: Page) {}

  /** True while the mocked cookie session (/api/session, M4) holds a sign-in. */
  sessionActive = false;

  async install() {
    await this.page.route(`${API_URL}/**`, (route) => this.handle(route));
    await this.page.route(/\/api\/session(\/[a-z]+)?$/, (route) => this.handleSession(route));
  }

  /**
   * The apiserver's cookie session on the dashboard's origin. Tokens come from the
   * Identity/ExchangeRefreshToken mock, as the real endpoint gets them from Identity.
   */
  private async handleSession(route: Route) {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    this.calls.push({ method: `session${path.replace("/api/session", "") || "/adopt"}`, request: new Uint8Array() });
    if (!request.headers()["x-requested-with"]) return route.fulfill({ status: 403 });
    if (path === "/api/session/logout") {
      this.sessionActive = false;
      return route.fulfill({ status: 204 });
    }
    if (path === "/api/session") this.sessionActive = Boolean(request.postDataJSON()?.refreshToken);
    const handler = this.handlers.get("Identity/ExchangeRefreshToken");
    if (!this.sessionActive || !handler) return route.fulfill({ status: 401, json: { error: "no_session" } });
    const reply = await handler(new Uint8Array());
    if ("error" in reply) {
      this.sessionActive = false;
      return route.fulfill({ status: 401, json: { error: "invalid_session" } });
    }
    const tokens = reply as unknown as { getAccessToken(): string; getIdToken(): string };
    return route.fulfill({ json: { accessToken: tokens.getAccessToken(), idToken: tokens.getIdToken() } });
  }

  /** `method` is the short name, e.g. "Identity/ExchangeCredentials". */
  on(method: string, handler: Handler) {
    this.handlers.set(method, handler);
    return this;
  }

  callsTo(method: string) {
    return this.calls.filter((c) => c.method === method);
  }

  private async handle(route: Route) {
    const request = route.request();
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });

    const path = new URL(request.url()).pathname;
    const method = path.split(".").pop()!.replace(/^v1beta2\./, "");
    const short = path.replace(/^\/fonoster\.[a-z]+\.v1beta2\./, "");
    const body = decodeRequest(request.postData());
    this.calls.push({ method: short, request: body });

    const handler = this.handlers.get(short);
    const reply: Reply = handler
      ? await handler(body)
      : { error: { code: 12, message: `no mock for ${short} (${method})` } };

    const headers = { ...CORS, "content-type": "application/grpc-web-text+proto" };
    if ("error" in reply) {
      return route.fulfill({
        status: 200,
        headers: { ...headers, "grpc-status": String(reply.error.code), "grpc-message": encodeURIComponent(reply.error.message) },
        body: ""
      });
    }
    const trailer = new TextEncoder().encode("grpc-status:0\r\ngrpc-message:\r\n");
    const data = Buffer.concat([frame(0x00, reply.serializeBinary()), frame(0x80, trailer)]);
    return route.fulfill({ status: 200, headers, body: data.toString("base64") });
  }
}

export const emptyReply = () => new empty.Empty();

export function grpcError(code: number, message: string) {
  return { error: { code, message } };
}

/** A call record as the API sends it: epoch seconds and enum numbers. */
export function callRecord(fields: {
  ref: string;
  from: string;
  to: string;
  startedAt: number;
  duration: number;
  direction: "FROM_PSTN" | "TO_PSTN";
  status: keyof typeof calls.CallStatus;
  amdStatus?: "HUMAN" | "MACHINE";
}) {
  const record = new calls.CallDetailRecord();
  record.setRef(fields.ref);
  record.setCallId(`call-${fields.ref}`);
  record.setType(fields.direction === "TO_PSTN" ? calls.CallType.API_ORIGINATED : calls.CallType.SIP_ORIGINATED);
  record.setStatus(calls.CallStatus[fields.status]);
  record.setStartedAt(fields.startedAt);
  record.setEndedAt(fields.startedAt + fields.duration);
  record.setFrom(fields.from);
  record.setTo(fields.to);
  record.setDuration(fields.duration);
  record.setDirection(calls.CallDirection[fields.direction]);
  if (fields.amdStatus) {
    record.setAmdStatus(calls.CallDetailRecord.AmdStatus[fields.amdStatus]);
    record.setAmdConfidence(0.9);
    record.setAmdLatencyMs(640);
  }
  return record;
}
