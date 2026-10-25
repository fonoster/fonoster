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
export const CA_FILE_ENV = "FONOSTER_CA_FILE";

/**
 * Reads a PEM file of certificate authorities. Fails before any connection, naming the path,
 * when the file is missing or isn't PEM.
 */
export function readCaFile(file: string): string {
  let pem: string;
  try {
    pem = readFileSync(file, "utf8");
  } catch (e) {
    throw new Error(
      `CA file ${file} could not be read: ${(e as { code?: string }).code ?? (e as Error).message}`
    );
  }
  if (!pem.includes("-----BEGIN CERTIFICATE-----"))
    throw new Error(`CA file ${file} holds no PEM certificate`);
  return pem;
}

/**
 * A fetch that trusts the CA file as well as the system's authorities. Node's global fetch takes
 * no CA, so this goes through https.request. Host names are still verified. Only what the
 * agent's control-plane calls use: method, headers, a string body; ok, status, text() and json().
 */
export function createCaFetch(caPem: string): typeof fetch {
  const ca = [...rootCertificates, caPem];
  type Init = { method?: string; headers?: unknown; body?: unknown };
  return ((input: string | URL, init: Init = {}) =>
    new Promise((resolve, reject) => {
      const target = new URL(String(input));
      const transport = target.protocol === "http:" ? http : https;
      const req = transport.request(
        target,
        {
          method: init.method ?? "GET",
          headers: init.headers as Record<string, string> | undefined,
          ...(target.protocol === "https:" ? { ca } : {})
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c: Buffer) => chunks.push(c));
          res.on("error", reject);
          res.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            const status = res.statusCode ?? 0;
            resolve({
              ok: status >= 200 && status < 300,
              status,
              text: async () => text,
              json: async () => JSON.parse(text)
            } as unknown as Awaited<ReturnType<typeof fetch>>);
          });
        }
      );
      req.on("error", reject);
      if (typeof init.body === "string") req.write(init.body);
      req.end();
    })) as typeof fetch;
}

/** The fetch for the control plane: CA-aware when --ca-file or FONOSTER_CA_FILE names a file. */
export function controlPlaneFetch(caFile?: string): typeof fetch | undefined {
  const file = caFile || process.env[CA_FILE_ENV];
  return file ? createCaFetch(readCaFile(file)) : undefined;
}

/** A hint for TLS verification failures: trust the CA, never turn TLS off. */
export function certHint(message: string): string {
  return /self[- ]signed|unable to (get|verify)|certificate|CERT_/i.test(
    message
  )
    ? `${message}; the server's certificate isn't trusted: if it's an install's generated certificate, pass --ca-file <its config/tls/ca.pem> or set ${CA_FILE_ENV}`
    : message;
}
