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
import { generateKeyPairSync, KeyObject, randomBytes, sign } from "crypto";
import * as http from "http";
import { AddressInfo } from "net";

// A fake control plane for the region agent's tests: it issues ES256 enrollment tokens, serves the
// key set and the enrollment endpoint the way contract.md says, and keeps what cells sent.

export type Issued = { token: string; jti: string };

export class FakeControlPlane {
  readonly kid = "rk-test-1";
  private readonly privateKey: KeyObject;
  readonly publicJwk: Record<string, unknown>;
  private server?: http.Server;
  readonly used = new Set<string>();
  readonly enrollments: Record<string, unknown>[] = [];
  /** Forces a response for the next enrollment (status, body). */
  nextResponse?: { status: number; body: unknown };
  url = "";

  constructor(
    readonly regionRef = "rg_testregion",
    readonly workspaceRef = "WOtestworkspace"
  ) {
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256"
    });
    this.privateKey = privateKey;
    this.publicJwk = {
      ...(publicKey.export({ format: "jwk" }) as Record<string, unknown>),
      kid: this.kid,
      alg: "ES256",
      use: "sig"
    };
  }

  async start() {
    this.server = http.createServer((req, res) => this.handle(req, res));
    await new Promise<void>((r) => this.server!.listen(0, "127.0.0.1", r));
    this.url = `http://127.0.0.1:${(this.server!.address() as AddressInfo).port}`;
    return this;
  }

  async stop() {
    await new Promise<void>((r) =>
      this.server ? this.server.close(() => r()) : r()
    );
  }

  /** A token signed with this control plane's key (or another, to test bad signatures). */
  issue(
    options: {
      expiresInS?: number;
      aud?: string;
      key?: KeyObject;
      leaf?: string;
      cp?: string;
    } = {}
  ): Issued {
    const now = Math.floor(Date.now() / 1000);
    const jti = randomBytes(8).toString("hex");
    const claims = {
      iss: this.url,
      aud: options.aud ?? "fonoster.region.v1",
      sub: this.regionRef,
      wsp: this.workspaceRef,
      cp: options.cp ?? this.url,
      leaf: options.leaf ?? "nats://127.0.0.1:7422",
      jti,
      iat: now,
      exp: now + (options.expiresInS ?? 24 * 3600)
    };
    const enc = (o: unknown) =>
      Buffer.from(JSON.stringify(o)).toString("base64url");
    const input = `${enc({ alg: "ES256", typ: "JWT", kid: this.kid })}.${enc(claims)}`;
    const sig = sign("sha256", Buffer.from(input), {
      key: options.key ?? this.privateKey,
      dsaEncoding: "ieee-p1363"
    });
    return { token: `${input}.${sig.toString("base64url")}`, jti };
  }

  private handle(req: http.IncomingMessage, res: http.ServerResponse) {
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.method === "GET" && req.url === "/.well-known/region-keys.json")
      return send(200, { keys: [this.publicJwk] });
    if (req.method === "POST" && req.url === "/api/regions/enroll") {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        this.enrollments.push(body);
        if (this.nextResponse) {
          const r = this.nextResponse;
          this.nextResponse = undefined;
          return send(r.status, r.body);
        }
        const claims = JSON.parse(
          Buffer.from(String(body.token).split(".")[1], "base64url").toString()
        );
        if (this.used.has(claims.jti))
          return send(409, { error: "token_used" });
        if (claims.exp * 1000 < Date.now())
          return send(410, { error: "token_expired" });
        this.used.add(claims.jti);
        send(200, {
          regionRef: this.regionRef,
          workspaceRef: this.workspaceRef,
          leafUrl: claims.leaf,
          credentials:
            "-----BEGIN NATS USER JWT-----\neyJ0ZXN0IjoidHJ1ZSJ9\n------END NATS USER JWT------\n",
          subjects: `region.${this.regionRef}.>`,
          configVersion: 0
        });
      });
      return;
    }
    send(404, { error: "not_found" });
  }
}
