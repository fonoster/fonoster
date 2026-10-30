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
import { createPrivateKey, generateKeyPairSync, KeyObject } from "crypto";
import { createCertificate } from "./x509";

/**
 * A local CA and a server certificate signed by it, in memory, like the ones init.sh writes to
 * config/tls/: for tests and tools that need a trusted TLS server without files.
 */
const DAY = 24 * 60 * 60 * 1000;
const CA_NAME = "Fonoster local CA";

const newKeyPair = () => generateKeyPairSync("ec", { namedCurve: "P-256" });

const keyPem = (key: KeyObject) =>
  key.export({ type: "pkcs8", format: "pem" }).toString();

/** A CA and a server certificate for `names` (DNS names or IP addresses). */
export function issueCertificates(
  names: string[],
  now: Date = new Date()
): {
  ca: { cert: string; key: string };
  server: { cert: string; key: string };
} {
  const ca = newKeyPair();
  const caCert = createCertificate({
    publicKey: ca.publicKey,
    subject: CA_NAME,
    issuer: CA_NAME,
    signingKey: ca.privateKey,
    notBefore: new Date(now.getTime() - DAY),
    notAfter: new Date(now.getTime() + 3650 * DAY),
    ca: true
  });
  const server = newKeyPair();
  const serverCert = createCertificate({
    publicKey: server.publicKey,
    subject: names[0],
    issuer: CA_NAME,
    signingKey: createPrivateKey(keyPem(ca.privateKey)),
    notBefore: new Date(now.getTime() - DAY),
    notAfter: new Date(now.getTime() + 397 * DAY),
    ca: false,
    names
  });
  return {
    ca: { cert: caCert, key: keyPem(ca.privateKey) },
    server: { cert: serverCert, key: keyPem(server.privateKey) }
  };
}
