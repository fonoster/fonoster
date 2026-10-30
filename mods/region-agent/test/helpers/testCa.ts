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
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { issueCertificates } from "@fonoster/common/dist/config/certificates";

/** A throwaway CA and a server certificate signed by it, for TLS tests. */
export type TestCa = {
  dir: string;
  caFile: string;
  ca: Buffer;
  cert: Buffer;
  key: Buffer;
};

/**
 * Issues a CA and a server certificate for `names` (DNS names or IP addresses) with the same code
 * `fonoster-config init` uses, and writes the CA to a file for `caFile`.
 */
export function makeTestCa(
  names: string[] = ["localhost", "127.0.0.1"]
): TestCa {
  const dir = mkdtempSync(join(tmpdir(), "fonoster-ca-"));
  const { ca, server } = issueCertificates(names);
  const caFile = join(dir, "ca.pem");
  writeFileSync(caFile, ca.cert);
  return {
    dir,
    caFile,
    ca: Buffer.from(ca.cert),
    cert: Buffer.from(server.cert),
    key: Buffer.from(server.key)
  };
}
