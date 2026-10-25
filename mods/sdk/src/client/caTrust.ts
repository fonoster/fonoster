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
import { readFileSync } from "fs";
import * as http from "http";
import * as https from "https";
import { rootCertificates } from "tls";
import { URL } from "url";

/** The environment variable every Fonoster client reads its CA file from. */
const CA_FILE_ENV = "FONOSTER_CA_FILE";

type CaFetch = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

/** The CA file to trust: the option, else FONOSTER_CA_FILE, else none. */
function resolveCaFile(option?: string): string | undefined {
  const file = option || process.env[CA_FILE_ENV];
  return file ? file : undefined;
}

/**
 * Reads a PEM file of certificate authorities. Fails before any connection, naming the path,
 * when the file is missing or isn't PEM.
 */
function readCaFile(file: string): Buffer {
  let pem: Buffer;
  try {
    pem = readFileSync(file);
  } catch (e) {
    throw new Error(
      `CA file ${file} could not be read: ${(e as { code?: string }).code ?? (e as Error).message}`
    );
  }
  if (!pem.toString("utf8").includes("-----BEGIN CERTIFICATE-----"))
    throw new Error(`CA file ${file} holds no PEM certificate`);
  return pem;
}

/**
 * The authorities to trust: the system's plus the CA file's. TLS options that take `ca` replace
 * the system roots, so both go in.
 */
function trustedRoots(ca: Buffer): string[] {
  return [...rootCertificates, ca.toString("utf8")];
}

/**
 * A fetch for the SDK's HTTP calls that trusts the CA as well as the system roots. Node's global
 * fetch takes no CA, so this goes through https.request. Host names are still verified.
 */
function createCaFetch(ca: Buffer): CaFetch {
  const roots = trustedRoots(ca);
  return (url, init = {}) =>
    new Promise((resolve, reject) => {
      const target = new URL(url);
      const transport = target.protocol === "http:" ? http : https;
      const req = transport.request(
        target,
        {
          method: init.method ?? "GET",
          headers: init.headers,
          ...(target.protocol === "https:" ? { ca: roots } : {})
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c: Buffer) => chunks.push(c));
          res.on("error", reject);
          res.on("end", () => {
            const body = Buffer.concat(chunks);
            const status = res.statusCode ?? 0;
            resolve({
              ok: status >= 200 && status < 300,
              status,
              headers: {
                get: (name: string) => {
                  const v = res.headers[name.toLowerCase()];
                  return v === undefined
                    ? null
                    : Array.isArray(v)
                      ? v.join(", ")
                      : String(v);
                }
              },
              json: async () => JSON.parse(body.toString("utf8")),
              arrayBuffer: async () =>
                body.buffer.slice(
                  body.byteOffset,
                  body.byteOffset + body.byteLength
                ) as ArrayBuffer
            });
          });
        }
      );
      req.on("error", reject);
      if (init.body !== undefined) req.write(init.body);
      req.end();
    });
}

export {
  CA_FILE_ENV,
  CaFetch,
  createCaFetch,
  readCaFile,
  resolveCaFile,
  trustedRoots
};
