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
import * as os from "os";
import * as path from "path";
import { resolveSecretRefs } from "@fonoster/common";
import { expect } from "chai";
import {
  catalogId,
  keyFromCredentials,
  migrateIntegrations,
  optionsFromArgv,
  providerOfProductRef,
  ttsModelFor
} from "../../src/migration";

// The parts of fonoster-migrate-legacy that need no database.

describe("@migration: legacy names and integrations.json", function () {
  let dir: string;

  beforeEach(function () {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "migrate-legacy-"));
  });

  afterEach(function () {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("maps product refs and raw names to catalog ids", function () {
    expect(providerOfProductRef("tts.elevenlabs")).to.equal("elevenlabs");
    expect(providerOfProductRef("tts.azure")).to.equal("azure");
    expect(providerOfProductRef("llm.openai")).to.equal("openai");
    expect(providerOfProductRef("tts.polly")).to.equal(undefined);
    expect(catalogId("groq", "llama-3.3-70b-versatile")).to.equal(
      "groq/llama-3.3-70b-versatile"
    );
    expect(catalogId("openai", "openai/gpt-4o-mini")).to.equal(
      "openai/gpt-4o-mini"
    );
    expect(ttsModelFor("deepgram", "aura-2-thalia-en")).to.equal(
      "deepgram/aura-2"
    );
    expect(ttsModelFor("deepgram", "aura-asteria-en")).to.equal(
      "deepgram/aura"
    );
    expect(
      ttsModelFor("elevenlabs", "x", { model: "eleven_turbo_v2" })
    ).to.equal("elevenlabs/eleven_turbo_v2");
  });

  it("reads stored credentials as adapter keys", function () {
    expect(keyFromCredentials('{"apiKey":"k1"}')).to.equal("k1");
    expect(keyFromCredentials("bare-key")).to.equal("bare-key");
    const sa = { client_email: "a@b.c", private_key: "pk" };
    expect(JSON.parse(keyFromCredentials(JSON.stringify(sa)))).to.deep.equal(
      sa
    );
  });

  it("turns integrations.json into credentialRef config with secret:// files", function () {
    const file = path.join(dir, "integrations.json");
    fs.writeFileSync(
      file,
      JSON.stringify([
        {
          name: "Deepgram STT",
          productRef: "stt.deepgram",
          type: "stt",
          credentials: { apiKey: "dg-1" }
        },
        {
          name: "Deepgram TTS",
          productRef: "tts.deepgram",
          type: "tts",
          credentials: { apiKey: "dg-1" }
        },
        {
          name: "OpenAI",
          productRef: "llm.openai",
          type: "llm",
          credentials: { apiKey: "sk-op" }
        },
        {
          name: "Polly",
          productRef: "tts.polly",
          type: "tts",
          credentials: { apiKey: "x" }
        }
      ])
    );
    const out = path.join(dir, "credentials.json");
    const secrets = path.join(dir, "secrets");
    const report = migrateIntegrations({ file, out, secretsDir: secrets });
    expect(report.changed).to.deep.equal([
      "deepgram-default",
      "openai-default"
    ]);
    expect(report.skipped).to.deep.equal(["tts.polly"]);
    expect(JSON.stringify(report.notices)).to.not.contain("dg-1");

    const fragment = JSON.parse(fs.readFileSync(out, "utf8"));
    expect(fragment.registry.platformCredentials).to.deep.equal([
      "deepgram-default",
      "openai-default"
    ]);
    expect(fragment.providers.deepgram.capabilities).to.deep.equal([
      "stt",
      "tts"
    ]);
    expect(fs.readFileSync(out, "utf8")).to.not.contain("sk-op");
    expect(
      (fs.statSync(path.join(secrets, "openai-default")).mode & 0o777).toString(
        8
      )
    ).to.equal("600");
    // The operator config resolves the references to the keys.
    const resolved = resolveSecretRefs(fragment) as typeof fragment;
    expect(resolved.credentials["openai-default"].value).to.equal("sk-op");
    expect(resolved.providers.deepgram.credential.value).to.equal("dg-1");
  });

  it("references environment variables without a secrets directory, and dry runs write nothing", function () {
    const file = path.join(dir, "integrations.json");
    fs.writeFileSync(
      file,
      JSON.stringify([
        {
          name: "OpenAI",
          productRef: "llm.openai",
          type: "llm",
          credentials: { apiKey: "sk-op" }
        }
      ])
    );
    const out = path.join(dir, "credentials.json");
    const report = migrateIntegrations({ file, out, dryRun: true });
    expect(report.fragment.credentials["openai-default"]).to.deep.equal({
      env: "OPENAI_DEFAULT"
    });
    expect(fs.existsSync(out)).to.be.false;
  });

  it("parses the command line", function () {
    const o = optionsFromArgv(
      [
        "--integrations",
        "i.json",
        "--credentials-out",
        "c.json",
        "--app",
        "a",
        "--app",
        "b"
      ],
      {}
    );
    expect(o.dryRun).to.be.true;
    expect(o.integrations).to.deep.equal({
      file: "i.json",
      out: "c.json",
      secretsDir: undefined
    });
    expect(o.apps?.refs).to.deep.equal(["a", "b"]);
    expect(() => optionsFromArgv(["--integrations", "i.json"], {})).to.throw(
      /credentials-out/
    );
  });
});
