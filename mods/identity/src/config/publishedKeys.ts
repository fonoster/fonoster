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
import { createHash, createPublicKey } from "crypto";

/**
 * Keys that were committed to the repository (config/keys and the root config examples) before
 * they were removed. They are public, so anyone could sign tokens or decrypt credentials with
 * them: Identity refuses to start with one.
 */
const PUBLISHED_SIGNING_KEY_FINGERPRINTS = [
  // config/keys/public.pem (SHA-256 of the SPKI DER)
  "b8dcd305f9d55674fb796641f967ee35b1fd8c464432f842320208e717e9db97"
];
const PUBLISHED_ENCRYPTION_KEYS = [
  "k1.aesgcm256.MmPSvzCG9fk654bAbl30tsqq4h9d3N4F11hlue8bGAY=",
  // the placeholder in config/fonoster.example.yaml
  "k1.aesgcm256.GENERATE-YOUR-OWN-with-npx-47ng-cloak-gen00="
];

/** SHA-256 of a PEM key's public part (SPKI DER), or undefined if it doesn't parse. */
function publicKeyFingerprint(pem: string): string | undefined {
  try {
    const der = createPublicKey(pem).export({ type: "spki", format: "der" });
    return createHash("sha256").update(der).digest("hex");
  } catch {
    return undefined;
  }
}

/** Throws when a signing key or the encryption key is one that was published. */
function assertUnpublishedKeys(keys: {
  privateKey: string;
  publicKey: string;
  encryptionKey: string;
}) {
  const published = [keys.privateKey, keys.publicKey].some((pem) =>
    PUBLISHED_SIGNING_KEY_FINGERPRINTS.includes(publicKeyFingerprint(pem) ?? "")
  );
  if (published)
    throw new Error(
      "identity signing key is the development key once committed to the Fonoster repository: generate your own (./init.sh, or openssl genrsa 2048)"
    );
  if (PUBLISHED_ENCRYPTION_KEYS.includes(keys.encryptionKey?.trim()))
    throw new Error(
      "encryption.key is the example key once committed to the Fonoster repository: generate your own (npx @47ng/cloak generate)"
    );
}

export { assertUnpublishedKeys, publicKeyFingerprint };
