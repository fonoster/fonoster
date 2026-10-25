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
import { execFileSync } from "child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

/** A throwaway CA and a server certificate signed by it, for TLS tests. */
export type TestCa = {
  dir: string;
  caFile: string;
  ca: Buffer;
  cert: Buffer;
  key: Buffer;
};

/** Creates a CA and a server certificate for `names` (DNS or IP) with openssl (tests only). */
export function makeTestCa(
  names: string[] = ["localhost", "127.0.0.1"]
): TestCa {
  const dir = mkdtempSync(join(tmpdir(), "fonoster-ca-"));
  const run = (args: string[]) =>
    execFileSync("openssl", args, { cwd: dir, stdio: "pipe" });
  const san = names
    .map((n) => (/^[\d.]+$|:/.test(n) ? `IP:${n}` : `DNS:${n}`))
    .join(",");
  writeFileSync(join(dir, "ext.cnf"), `subjectAltName=${san}\n`);
  run([
    "ecparam",
    "-name",
    "prime256v1",
    "-genkey",
    "-noout",
    "-out",
    "ca-key.pem"
  ]);
  run([
    "req",
    "-x509",
    "-new",
    "-key",
    "ca-key.pem",
    "-sha256",
    "-days",
    "2",
    "-subj",
    "/CN=Test CA",
    "-out",
    "ca.pem"
  ]);
  run([
    "ecparam",
    "-name",
    "prime256v1",
    "-genkey",
    "-noout",
    "-out",
    "server-key.pem"
  ]);
  run([
    "req",
    "-new",
    "-key",
    "server-key.pem",
    "-subj",
    `/CN=${names[0]}`,
    "-out",
    "server.csr"
  ]);
  run([
    "x509",
    "-req",
    "-in",
    "server.csr",
    "-CA",
    "ca.pem",
    "-CAkey",
    "ca-key.pem",
    "-CAcreateserial",
    "-days",
    "2",
    "-sha256",
    "-extfile",
    "ext.cnf",
    "-out",
    "server.pem"
  ]);
  return {
    dir,
    caFile: join(dir, "ca.pem"),
    ca: readFileSync(join(dir, "ca.pem")),
    cert: readFileSync(join(dir, "server.pem")),
    key: readFileSync(join(dir, "server-key.pem"))
  };
}
