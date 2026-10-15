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
import * as http from "http";
import * as https from "https";
import { URL } from "url";

// A tiny Kubernetes Secret client (RC-B4): enough to read and merge keys into one Secret from inside
// the cluster (service account token and CA), without a Kubernetes client dependency.

const SA = "/var/run/secrets/kubernetes.io/serviceaccount";

export type KubeOptions = {
  /** API server base URL (default https://$KUBERNETES_SERVICE_HOST:$KUBERNETES_SERVICE_PORT). */
  server?: string;
  token?: string;
  ca?: string | Buffer;
  namespace?: string;
  /** Tests only. */
  insecure?: boolean;
};

export class KubeSecrets {
  private readonly server: string;
  private readonly token: string;
  private readonly ca?: string | Buffer;
  readonly namespace: string;

  constructor(private readonly options: KubeOptions = {}) {
    const env = process.env;
    this.server =
      options.server ??
      `https://${env.KUBERNETES_SERVICE_HOST}:${env.KUBERNETES_SERVICE_PORT ?? 443}`;
    this.token = options.token ?? read(`${SA}/token`) ?? "";
    this.ca = options.ca ?? read(`${SA}/ca.crt`);
    this.namespace =
      options.namespace ??
      env.FONOSTER_REGION_NAMESPACE ??
      read(`${SA}/namespace`) ??
      "default";
    if (!options.server && !env.KUBERNETES_SERVICE_HOST)
      throw new Error(
        "not inside Kubernetes (KUBERNETES_SERVICE_HOST is not set); use a data directory instead"
      );
  }

  private request(
    method: string,
    path: string,
    body?: unknown,
    contentType = "application/json"
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    const url = new URL(path, this.server);
    const data = body === undefined ? undefined : JSON.stringify(body);
    return new Promise((resolve, reject) => {
      // http:// only for tests against a fake API server.
      const transport = url.protocol === "http:" ? http : https;
      const req = transport.request(
        url,
        {
          method,
          ca: this.ca,
          rejectUnauthorized: !this.options.insecure,
          headers: {
            authorization: `Bearer ${this.token}`,
            accept: "application/json",
            ...(data
              ? {
                  "content-type": contentType,
                  "content-length": Buffer.byteLength(data)
                }
              : {})
          }
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            let parsed: Record<string, unknown> = {};
            try {
              parsed = text ? JSON.parse(text) : {};
            } catch {
              parsed = { message: text };
            }
            resolve({ status: res.statusCode ?? 0, body: parsed });
          });
        }
      );
      req.on("error", reject);
      if (data) req.write(data);
      req.end();
    });
  }

  private path(name?: string) {
    return `/api/v1/namespaces/${encodeURIComponent(this.namespace)}/secrets${
      name ? `/${encodeURIComponent(name)}` : ""
    }`;
  }

  /** The Secret's keys decoded, or undefined when it does not exist. */
  async get(name: string): Promise<Record<string, string> | undefined> {
    const res = await this.request("GET", this.path(name));
    if (res.status === 404) return undefined;
    if (res.status >= 300)
      throw new Error(`kubernetes: GET secret ${name}: ${res.status}`);
    const data = (res.body.data ?? {}) as Record<string, string>;
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k,
        Buffer.from(v, "base64").toString("utf8")
      ])
    );
  }

  /** Sets keys (null removes one), creating the Secret when missing. */
  async merge(name: string, values: Record<string, string | null>) {
    const data = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [
        k,
        v === null ? null : Buffer.from(v, "utf8").toString("base64")
      ])
    );
    const patched = await this.request(
      "PATCH",
      this.path(name),
      { data },
      "application/merge-patch+json"
    );
    if (patched.status < 300) return;
    if (patched.status !== 404)
      throw new Error(`kubernetes: PATCH secret ${name}: ${patched.status}`);
    const created = await this.request("POST", this.path(), {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name,
        labels: { "app.kubernetes.io/part-of": "fonoster-region" }
      },
      type: "Opaque",
      data: Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== null)
      )
    });
    if (created.status >= 300)
      throw new Error(`kubernetes: POST secret ${name}: ${created.status}`);
  }
}

function read(file: string) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
}
