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
import { createServer } from "node:http";
import { createRequire } from "node:module";
import type { AddressInfo } from "node:net";
import { dirname, join } from "node:path";
import type { Page, Route } from "@playwright/test";

const require = createRequire(import.meta.url);
const sdkDir = dirname(require.resolve("@fonoster/sdk/package.json"));
const pb = (name: string) =>
  require(join(sdkDir, "src/generated/web", `${name}_pb.js`));

/* eslint-disable @typescript-eslint/no-explicit-any */
export const identity: any = pb("identity");
export const capabilities: any = pb("capabilities");
export const applications: any = pb("applications");
export const numbers: any = pb("numbers");
export const providers: any = pb("providers");
export const calls: any = pb("calls");
export const usage: any = pb("usage");
export const struct: any = require(
  join(
    dirname(
      require.resolve("google-protobuf/package.json", { paths: [sdkDir] })
    ),
    "google/protobuf/struct_pb.js"
  )
);
const empty: any = require(
  join(
    dirname(
      require.resolve("google-protobuf/package.json", { paths: [sdkDir] })
    ),
    "google/protobuf/empty_pb.js"
  )
);
/* eslint-enable @typescript-eslint/no-explicit-any */

export const API_URL = "http://localhost:8449";

type Message = { serializeBinary(): Uint8Array };
type GrpcErrorReply = { error: { code: number; message: string } };
/**
 * One step of a server stream, taken once `after` settles (a test opens a gate to move on): a
 * message, an error that ends the stream, or the end. Without an end step it ends after the last.
 */
export type StreamStep = { after?: Promise<unknown> } & (
  { message: Message } | GrpcErrorReply | { end: true }
);
type Reply = Message | GrpcErrorReply | { stream: StreamStep[] };
type Handler = (request: Uint8Array) => Reply | Promise<Reply>;
export type RestReply =
  | { status?: number; json?: unknown }
  | { status?: number; body: Buffer; headers?: Record<string, string> };
export type RestHandler = (request: {
  params: Record<string, string>;
  query: URLSearchParams;
}) => RestReply | Promise<RestReply>;

function frame(flag: number, payload: Uint8Array) {
  const out = new Uint8Array(5 + payload.length);
  out[0] = flag;
  new DataView(out.buffer).setUint32(1, payload.length);
  out.set(payload, 5);
  return out;
}

function trailer(code: number, message = "") {
  return frame(
    0x80,
    new TextEncoder().encode(
      `grpc-status:${code}\r\ngrpc-message:${encodeURIComponent(message)}\r\n`
    )
  );
}

const base64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64");

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
    await this.page.route(/\/api\/session(\/[a-z]+)?$/, (route) =>
      this.handleSession(route)
    );
  }

  /**
   * The apiserver's cookie session on the dashboard's origin. Tokens come from the
   * Identity/ExchangeRefreshToken mock, as the real endpoint gets them from Identity.
   */
  private async handleSession(route: Route) {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    this.calls.push({
      method: `session${path.replace("/api/session", "") || "/adopt"}`,
      request: new Uint8Array()
    });
    if (!request.headers()["x-requested-with"])
      return route.fulfill({ status: 403 });
    if (path === "/api/session/logout") {
      this.sessionActive = false;
      return route.fulfill({ status: 204 });
    }
    if (path === "/api/session")
      this.sessionActive = Boolean(request.postDataJSON()?.refreshToken);
    const handler = this.handlers.get("Identity/ExchangeRefreshToken");
    if (!this.sessionActive || !handler)
      return route.fulfill({ status: 401, json: { error: "no_session" } });
    const reply = await handler(new Uint8Array());
    if ("error" in reply) {
      this.sessionActive = false;
      return route.fulfill({ status: 401, json: { error: "invalid_session" } });
    }
    const tokens = reply as unknown as {
      getAccessToken(): string;
      getIdToken(): string;
    };
    return route.fulfill({
      json: {
        accessToken: tokens.getAccessToken(),
        idToken: tokens.getIdToken()
      }
    });
  }

  /** `method` is the short name, e.g. "Identity/ExchangeCredentials". */
  on(method: string, handler: Handler) {
    this.handlers.set(method, handler);
    return this;
  }

  callsTo(method: string) {
    return this.calls.filter((c) => c.method === method);
  }

  private restRoutes: {
    method: string;
    pattern: RegExp;
    keys: string[];
    handler: RestHandler;
  }[] = [];

  /**
   * Answers an HTTP API on the same origin, e.g. `rest("GET", "/api/records/:callRef", …)`.
   * Calls are recorded as "GET /api/records/x?query" so tests can assert what was asked.
   */
  rest(method: string, path: string, handler: RestHandler) {
    const keys: string[] = [];
    const pattern = new RegExp(
      `^${path.replace(/:([a-zA-Z]+)/g, (_, key) => {
        keys.push(key);
        return "([^/]+)";
      })}$`
    );
    // Later registrations win, as with on().
    this.restRoutes.unshift({ method, pattern, keys, handler });
    return this;
  }

  private async handleRest(route: Route, url: URL) {
    const request = route.request();
    this.calls.push({
      method: `${request.method()} ${url.pathname}${url.search}`,
      request: new Uint8Array()
    });
    const match = this.restRoutes
      .map((r) => ({
        r,
        m: r.method === request.method() ? r.pattern.exec(url.pathname) : null
      }))
      .find((x) => x.m);
    const headers = {
      ...CORS,
      "access-control-expose-headers":
        "grpc-status,grpc-message,x-content-hash,content-disposition"
    };
    if (!match || !match.m)
      return route.fulfill({
        status: 404,
        headers,
        json: { error: "not_found" }
      });
    const params = Object.fromEntries(
      match.r.keys.map((k, i) => [k, decodeURIComponent(match.m![i + 1])])
    );
    const reply = await match.r.handler({ params, query: url.searchParams });
    if ("body" in reply)
      return route.fulfill({
        status: reply.status ?? 200,
        headers: { ...headers, ...reply.headers },
        body: reply.body
      });
    return route.fulfill({
      status: reply.status ?? 200,
      headers,
      json: reply.json
    });
  }

  private async handle(route: Route) {
    const request = route.request();
    if (request.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers: CORS });

    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) return this.handleRest(route, url);
    const path = url.pathname;
    const method = path
      .split(".")
      .pop()!
      .replace(/^v1beta2\./, "");
    const short = path.replace(/^\/fonoster\.[a-z]+\.v1beta2\./, "");
    const body = decodeRequest(request.postData());
    this.calls.push({ method: short, request: body });

    const handler = this.handlers.get(short);
    const reply: Reply = handler
      ? await handler(body)
      : { error: { code: 12, message: `no mock for ${short} (${method})` } };

    const headers = {
      ...CORS,
      "content-type": "application/grpc-web-text+proto"
    };
    if ("stream" in reply) return this.stream(route, headers, reply.stream);
    if ("error" in reply) {
      return route.fulfill({
        status: 200,
        headers: {
          ...headers,
          "grpc-status": String(reply.error.code),
          "grpc-message": encodeURIComponent(reply.error.message)
        },
        body: ""
      });
    }
    const data = Buffer.concat([
      frame(0x00, reply.serializeBinary()),
      trailer(0)
    ]);
    return route.fulfill({
      status: 200,
      headers,
      body: data.toString("base64")
    });
  }

  /**
   * A server stream, message by message: route.fulfill() can only send a whole body, so the
   * request goes to a one-shot local server that writes each frame when its step is due.
   */
  private async stream(
    route: Route,
    headers: Record<string, string>,
    steps: StreamStep[]
  ) {
    const server = createServer(async (_req, res) => {
      res.writeHead(200, headers);
      let status = trailer(0);
      for (const step of steps) {
        await step.after;
        if ("end" in step) break;
        if ("error" in step) {
          status = trailer(step.error.code, step.error.message);
          break;
        }
        res.write(base64(frame(0x00, step.message.serializeBinary())));
      }
      res.end(base64(status));
      server.close();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve)
    );
    const { port } = server.address() as AddressInfo;
    return route.continue({ url: `http://127.0.0.1:${port}/` });
  }
}

/** A step a test releases by hand: `const ring = gate(); …; ring.open();`. */
export function gate() {
  let open!: () => void;
  const promise = new Promise<void>((resolve) => (open = resolve));
  return { promise, open };
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
  record.setType(
    fields.direction === "TO_PSTN"
      ? calls.CallType.API_ORIGINATED
      : calls.CallType.SIP_ORIGINATED
  );
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
