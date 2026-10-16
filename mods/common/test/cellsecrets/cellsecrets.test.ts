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
import {
  CellSecretKeys,
  DirectorySecretStore,
  EncryptedFileSecretStore,
  NatsWorkspaceKeys,
  openCellSecrets
} from "../../src/cellsecrets";

describe("cell secrets (add-private-regions PR-4)", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "cellsecrets-"));
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("encrypts values at rest, 0600, and reads them back", () => {
    const file = path.join(dir, "secrets.enc");
    const store = new EncryptedFileSecretStore(file, "passphrase");
    store.set("deepgram", "dg-key-123");
    store.set("groq", "gq-key");
    expect(store.get("deepgram")).to.equal("dg-key-123");
    expect(store.names()).to.deep.equal(["deepgram", "groq"]);
    const raw = fs.readFileSync(file, "utf8");
    expect(raw).to.not.include("dg-key-123");
    expect(fs.statSync(file).mode & 0o777).to.equal(0o600);
    // another reader with the same key sees the values
    expect(
      new EncryptedFileSecretStore(file, "passphrase").get("groq")
    ).to.equal("gq-key");
    expect(store.delete("groq")).to.equal(true);
    expect(store.delete("groq")).to.equal(false);
    expect(store.names()).to.deep.equal(["deepgram"]);
  });

  it("refuses a wrong key and bad names", () => {
    const file = path.join(dir, "secrets.enc");
    new EncryptedFileSecretStore(file, "right").set("openai", "k");
    expect(() =>
      new EncryptedFileSecretStore(file, "wrong").get("openai")
    ).to.throw(/wrong key/);
    expect(() =>
      new EncryptedFileSecretStore(file, "right").set("Bad Name", "x")
    ).to.throw(/invalid secret name/);
  });

  it("reads a mounted Kubernetes Secret directory", () => {
    fs.writeFileSync(path.join(dir, "deepgram"), "dg\n");
    fs.mkdirSync(path.join(dir, "..data"));
    const store = new DirectorySecretStore(dir);
    expect(store.names()).to.deep.equal(["deepgram"]);
    expect(store.get("deepgram")).to.equal("dg");
    expect(store.get("../etc/passwd")).to.equal(undefined);
  });

  it("opens from config and serves keys by provider or credentialRef", async () => {
    const store = openCellSecrets(
      { file: path.join(dir, "s.enc"), keyEnv: "X_KEY" },
      { X_KEY: "k" }
    );
    store.set("openai", "sk-1");
    const keys = new CellSecretKeys(store);
    expect(await keys.get("WOany", "openai")).to.equal("sk-1");
    expect(await keys.get("WOany", "deepgram")).to.equal(undefined);
    expect(
      keys.forCredentialRef("llm-openai", [
        { id: "openai", credentialRef: "llm-openai" }
      ])
    ).to.equal("sk-1");
    expect(() => openCellSecrets({ file: "x" }, {})).to.throw(/is not set/);
  });
});

describe("workspace keys over the region link (add-private-regions PR-20)", () => {
  it("asks on cell.workspacekeys.get per call and never caches", async () => {
    const asked: unknown[] = [];
    let value: string | undefined = "byo-1";
    const keys = new NatsWorkspaceKeys(async () => ({
      async request(subject, data) {
        asked.push({ subject, ...JSON.parse(Buffer.from(data).toString()) });
        return {
          data: Buffer.from(JSON.stringify(value ? { value } : {}))
        };
      }
    }));
    expect(await keys.get("WO1", "openai")).to.equal("byo-1");
    value = undefined;
    expect(await keys.get("WO1", "openai")).to.equal(undefined);
    expect(asked).to.deep.equal([
      {
        subject: "cell.workspacekeys.get",
        workspaceRef: "WO1",
        provider: "openai"
      },
      {
        subject: "cell.workspacekeys.get",
        workspaceRef: "WO1",
        provider: "openai"
      }
    ]);
  });

  it("answers undefined on a timeout or a broken link", async () => {
    const keys = new NatsWorkspaceKeys(async () => ({
      request: async () => {
        throw new Error("TIMEOUT");
      }
    }));
    expect(await keys.get("WO1", "openai")).to.equal(undefined);
    expect(await keys.get("", "openai")).to.equal(undefined);
  });
});
