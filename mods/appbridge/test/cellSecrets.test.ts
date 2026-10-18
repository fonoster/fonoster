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
import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { CellSecrets } from "@fonoster/common";
import { validateConfig } from "../src/config";
import { Catalog } from "../src/speech/Catalog";

// A private region's cell secrets (add-private-regions PR-4, build log RC-B5).

describe("@gateway/cell secrets", function () {
  it("accepts providers without a platform key and uses the cell's key", async function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-cell-"));
    const file = path.join(dir, "secrets.enc");
    new CellSecrets.EncryptedFileSecretStore(file, "pass").set(
      "deepgram",
      "cell-dg"
    );
    const config = {
      nats: { url: "nats://x" },
      cellSecrets: { file, keyEnv: "GW_CELL_TEST_KEY" },
      providers: {
        deepgram: {
          adapter: "deepgram" as const,
          capabilities: ["stt" as const, "tts" as const]
        }
      }
    };
    expect(validateConfig(config)).to.deep.equal([]);
    const { cellSecrets, ...noCell } = config;
    expect(cellSecrets).to.be.ok;
    expect(validateConfig(noCell).join()).to.match(/no credential/);
    const keys = new CellSecrets.CellSecretKeys(
      CellSecrets.openCellSecrets(config.cellSecrets, {
        GW_CELL_TEST_KEY: "pass"
      })
    );
    const catalog = new Catalog(config, undefined, keys);
    expect(catalog.resolveStt(undefined, "WO1")).to.equal(undefined);
    await catalog.prepare("WO1");
    const key = (a: unknown) =>
      (a as { options: { apiKey: string } }).options.apiKey;
    expect(key(catalog.resolveStt(undefined, "WO1")!.adapter)).to.equal(
      "cell-dg"
    );
    expect(key(catalog.resolveVoice("deepgram/aura", "WO1")!.adapter)).to.equal(
      "cell-dg"
    );
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
