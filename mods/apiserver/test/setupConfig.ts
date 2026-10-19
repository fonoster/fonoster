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
/**
 * Loaded by mocha before any test file (see .mocharc.cjs), so modules that
 * read the API server's config at import time get the test fixture instead
 * of looking for fonoster.yaml.
 */
import { generateKeyPairSync } from "crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { parseConfigFile } from "@fonoster/common";
import { setConfigForTests } from "../src/config";

const fixture = join(__dirname, "fixtures", "fonoster.test.yaml");

/** A fresh RS256 pair for this run: no signing key is committed (M12). */
function generateTestKeys() {
  const dir = mkdtempSync(join(tmpdir(), "fonoster-test-keys-"));
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const privateKeyPath = join(dir, "private.pem");
  const publicKeyPath = join(dir, "public.pem");
  writeFileSync(
    privateKeyPath,
    pair.privateKey.export({ type: "pkcs8", format: "pem" })
  );
  writeFileSync(
    publicKeyPath,
    pair.publicKey.export({ type: "spki", format: "pem" })
  );
  return { privateKeyPath, publicKeyPath };
}

const config = parseConfigFile(fixture, readFileSync(fixture, "utf8")) as {
  identity: { keys: Record<string, string> };
};
config.identity.keys = generateTestKeys();

setConfigForTests(config as Parameters<typeof setConfigForTests>[0]);
