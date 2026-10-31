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
import { existsSync, readFileSync } from "fs";
import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import { extname, join, normalize } from "path";
import { URL } from "url";
import WebSocket from "ws";
import { control } from "./control";
import { StripeError } from "./errors";
import { Json, StripeFake } from "./fake";
import { parseForm } from "./form";
import { portal } from "./portal";
import { billingRoutes } from "./resources/billing";
import { advance } from "./resources/billing";
import { catalogRoutes } from "./resources/catalog";
import { creditRoutes } from "./resources/credits";
import { customerRoutes } from "./resources/customers";
import { eventRoutes } from "./resources/events";
import { meterRoutes } from "./resources/meters";
import { paymentRoutes } from "./resources/payments";
import { Route } from "./router";
import { acceptedParams, API_VERSION, responseErrors } from "./schema";

const ROUTES: Route[] = [
  ...customerRoutes,
  ...paymentRoutes,
  ...catalogRoutes,
  ...meterRoutes,
  ...creditRoutes,
  ...billingRoutes,
  ...eventRoutes
];

const compiled = ROUTES.map((r) => {
  const names: string[] = [];
  const pattern = r.path.replace(/\{([^}]+)\}/g, (_m, name) => {
    names.push(name);
    return "([^/]+)";
  });
  return { ...r, regex: new RegExp(`^${pattern}$`), names };
});

/** Parameters every endpoint accepts besides its own. */
const ALWAYS = new Set(["expand"]);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2"
};

/** Drops the fake's internal fields (`fake_*`) from everything it answers. */
function publicView(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(publicView);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Json)
        .filter(([k]) => !k.startsWith("fake_"))
        .map(([k, v]) => [k, publicView(v)])
    );
  return value;
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

export type StripeFakeServerOptions = {
  port?: number;
  host?: string;
  /** The built viewer (D7); the viewer is skipped when absent. */
  viewerDir?: string;
  /** Validate every response against the pinned spec (tests). */
  validateResponses?: boolean;
  /** Webhook endpoints from config: `[{url, secret}]`. */
  webhooks?: { url: string; secret: string }[];
  /** The fake's address as browsers reach it, for Customer Portal links (portal.ts). */
  portalUrl?: string;
};

export class StripeFakeServer {
  readonly fake: StripeFake;
  private server?: Server;
  private ticker?: ReturnType<typeof setInterval>;

  constructor(private readonly options: StripeFakeServerOptions = {}) {
    this.fake = new StripeFake({
      webhooks: options.webhooks,
      portalUrl: options.portalUrl
    });
  }

  get url(): string {
    const address = this.server?.address();
    if (!address || typeof address === "string")
      throw new Error("not listening");
    return `http://127.0.0.1:${address.port}`;
  }

  async start(): Promise<this> {
    this.server = createServer((req, res) => void this.handle(req, res));
    const wss = new WebSocket.Server({
      server: this.server,
      path: "/_fake/ws"
    });
    wss.on("connection", (socket) => {
      const off = this.fake.subscribe((change) =>
        socket.send(JSON.stringify(change))
      );
      socket.on("close", off);
    });
    await new Promise<void>((resolve) =>
      this.server!.listen(
        this.options.port ?? 12111,
        this.options.host ?? "0.0.0.0",
        resolve
      )
    );
    // Account time moves with the wall clock: due work and webhook retries run as it passes.
    this.ticker = setInterval(() => {
      advance(this.fake, null, this.fake.now());
      void this.fake.deliverDue();
    }, 1000);
    this.ticker.unref();
    return this;
  }

  async stop(): Promise<void> {
    clearInterval(this.ticker);
    await new Promise<void>((resolve) =>
      this.server ? this.server.close(() => resolve()) : resolve()
    );
  }

  private send(
    res: ServerResponse,
    status: number,
    body: unknown,
    headers: Record<string, string> = {}
  ) {
    res.writeHead(status, {
      "content-type": "application/json",
      "stripe-version": API_VERSION,
      ...headers
    });
    res.end(JSON.stringify(body));
  }

  private async handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? "/", "http://fake");
    const method = (req.method ?? "GET").toLowerCase();
    const requestId = this.fake.requestId();
    try {
      if (this.fake.latencyMs)
        await new Promise((r) => setTimeout(r, this.fake.latencyMs));
      if (url.pathname.startsWith("/_fake/") || url.pathname === "/_fake") {
        const raw = method === "get" ? "" : await readBody(req);
        const body = raw
          ? (JSON.parse(raw) as Json)
          : Object.fromEntries(url.searchParams);
        return this.send(
          res,
          200,
          publicView(await control(this.fake, method, url.pathname, body))
        );
      }
      if (url.pathname.startsWith("/p/")) {
        const page = await portal(
          this.fake,
          method,
          url.pathname,
          method === "post" ? parseForm(await readBody(req)) : {}
        );
        if ("location" in page) {
          res.writeHead(303, { location: page.location });
          return void res.end();
        }
        res.writeHead(page.status, {
          "content-type": "text/html; charset=utf-8"
        });
        return void res.end(page.html);
      }
      if (!url.pathname.startsWith("/v1/") && !url.pathname.startsWith("/v2/"))
        return this.viewer(url.pathname, res);
      if (this.fake.rateLimit)
        throw new StripeError(
          429,
          "rate_limit_error",
          "Too many requests hit the API too quickly (the fake's rate limit is on).",
          { code: "rate_limit" }
        );
      const auth = req.headers.authorization ?? "";
      if (!/^Bearer (sk|rk)_test_/.test(auth))
        throw new StripeError(
          401,
          "invalid_request_error",
          "Invalid API Key provided. The fake accepts test-mode keys only (sk_test_...)."
        );
      const version = req.headers["stripe-version"];
      if (version && version !== API_VERSION)
        throw new StripeError(
          400,
          "invalid_request_error",
          `The fake answers as API version ${API_VERSION}; this request asked for ${version}.`
        );
      const match = compiled
        .map((r) => ({
          r,
          m: r.method === method ? r.regex.exec(url.pathname) : null
        }))
        .find((x) => x.m);
      if (!match)
        throw new StripeError(
          404,
          "invalid_request_error",
          `Unrecognized request URL (${method.toUpperCase()}: ${url.pathname}).`
        );
      const raw = method === "post" ? await readBody(req) : "";
      const body =
        method === "post"
          ? parseForm(raw)
          : parseForm(url.searchParams.toString());
      const accepted = acceptedParams(match.r.path, method);
      if (accepted) {
        const unknown = Object.keys(body).find(
          (k) => !accepted.has(k) && !ALWAYS.has(k)
        );
        if (unknown)
          throw new StripeError(
            400,
            "invalid_request_error",
            `Received unknown parameter: ${unknown}`,
            { param: unknown }
          );
      }
      const key =
        method === "post"
          ? (req.headers["idempotency-key"] as string | undefined)
          : undefined;
      if (key) {
        const seen = this.fake.idempotency.get(key);
        if (seen && seen.at > this.fake.now() - 86_400) {
          if (seen.params !== `${url.pathname}?${raw}`)
            throw new StripeError(
              400,
              "idempotency_error",
              "Keys for idempotent requests can only be used with the same parameters they were first used with."
            );
          return this.send(res, seen.status, seen.body, {
            "idempotent-replayed": "true",
            "request-id": requestId
          });
        }
      }
      const params = Object.fromEntries(
        match.r.names.map((n, i) => [n, decodeURIComponent(match.m![i + 1])])
      );
      let status = 200;
      let out: unknown;
      try {
        out = publicView(
          await match.r.handler({ fake: this.fake, params, body })
        );
      } catch (e) {
        if (!(e instanceof StripeError)) throw e;
        status = e.status;
        out = e.toJSON();
      }
      if (status === 200 && this.options.validateResponses) {
        const errors = responseErrors(match.r.path, method, out);
        if (errors.length)
          throw new Error(
            `response to ${method.toUpperCase()} ${match.r.path} breaks Stripe's schema: ${errors.slice(0, 5).join("; ")}`
          );
      }
      if (key)
        this.fake.idempotency.set(key, {
          params: `${url.pathname}?${raw}`,
          status,
          body: out,
          at: this.fake.now()
        });
      this.send(res, status, out, { "request-id": requestId });
      if (method !== "get") void this.fake.deliverDue();
    } catch (e) {
      if (e instanceof StripeError)
        return this.send(res, e.status, e.toJSON(), {
          "request-id": requestId
        });
      this.send(
        res,
        500,
        { error: { type: "api_error", message: (e as Error).message } },
        { "request-id": requestId }
      );
    }
  }

  private viewer(pathname: string, res: ServerResponse) {
    const dir = this.options.viewerDir;
    if (!dir || !existsSync(join(dir, "index.html"))) {
      res.writeHead(200, { "content-type": "text/plain" });
      return res.end(
        "Stripe fake: the viewer is not built. The API is under /v1 and the control API under /_fake."
      );
    }
    const file = normalize(
      join(dir, pathname === "/" ? "index.html" : pathname)
    );
    const target =
      file.startsWith(dir) && existsSync(file) ? file : join(dir, "index.html");
    res.writeHead(200, {
      "content-type": MIME[extname(target)] ?? "application/octet-stream"
    });
    res.end(readFileSync(target));
  }
}
