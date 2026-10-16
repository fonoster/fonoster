/**
 * Copyright (C) 2026 by Fonoster Inc (https://fonoster.com)
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
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import * as SDK from "@fonoster/sdk";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { parseListener } from "../src/utils/applicationRequest";
import { createOrUpdateApplication } from "../src/utils/createOrUpdateApplication";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@ctl[utils/createOrUpdateApplication]", function () {
  let tmpDir: string;
  let createStub: sinon.SinonStub;
  let updateStub: sinon.SinonStub;
  let getStub: sinon.SinonStub;
  const client = {} as unknown as SDK.Client;

  const baseConfig = {
    name: "My App",
    url: "wss://bot.example.com/session",
    protocol: "fonoster"
  };

  const assistant = {
    name: "Receptionist",
    languageModel: { model: "openai/gpt-4o-mini", apiKey: "sk-should-go" }
  };

  const currentApp = {
    ref: "positional-ref",
    name: "Current",
    type: "STREAM",
    url: "wss://old.example.com/session",
    protocol: "twilio",
    speech: {
      voice: "deepgram/aura-2-thalia-en",
      language: "en-US",
      sttModel: "",
      ttsModel: "",
      silenceTimeoutMs: 0,
      patience: ""
    },
    listeners: [{ url: "wss://rec.example.com/ws", tracks: "inbound" }],
    recording: "on",
    fallbackAppRef: "",
    fallbackMessage: "",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  function writeConfig(ext: string, content: unknown): string {
    const filePath = join(tmpDir, `app.${ext}`);
    const data =
      typeof content === "string" ? content : JSON.stringify(content);
    writeFileSync(filePath, data, "utf8");
    return filePath;
  }

  beforeEach(function () {
    tmpDir = mkdtempSync(join(tmpdir(), "ctl-app-"));
    createStub = sandbox
      .stub(SDK.Applications.prototype, "createApplication")
      .resolves({ ref: "created-ref", signingSecret: "s3cret" });
    updateStub = sandbox
      .stub(SDK.Applications.prototype, "updateApplication")
      .resolves({ ref: "updated-ref" });
    getStub = sandbox
      .stub(SDK.Applications.prototype, "getApplication")
      .resolves(currentApp as never);
  });

  afterEach(function () {
    sandbox.restore();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates an application from a file in the app model", async function () {
    const filePath = writeConfig("json", baseConfig);

    const response = await createOrUpdateApplication(client, filePath);

    expect(response.signingSecret).to.equal("s3cret");
    expect(createStub).to.have.been.calledOnce;
    expect(updateStub).to.not.have.been.called;
    expect(createStub.firstCall.args[0]).to.include({
      ...baseConfig,
      type: "STREAM"
    });
  });

  it("creates an application from flags only", async function () {
    await createOrUpdateApplication(client, undefined, undefined, false, {
      name: "Flags",
      url: "wss://bot.example.com/media",
      protocol: "twilio",
      voice: "elevenlabs/rachel",
      "stt-model": "deepgram/nova-3",
      patience: "high",
      listener: ["wss://rec.example.com/ws,outbound"],
      recording: "consent"
    });

    const request = createStub.firstCall.args[0];
    expect(request).to.include({
      name: "Flags",
      type: "STREAM",
      url: "wss://bot.example.com/media",
      protocol: "twilio",
      recording: "consent"
    });
    expect(request.speech).to.deep.equal({
      voice: "elevenlabs/rachel",
      sttModel: "deepgram/nova-3",
      patience: "high"
    });
    expect(request.listeners).to.deep.equal([
      { url: "wss://rec.example.com/ws", tracks: "outbound" }
    ]);
  });

  it("makes an Autopilot agent from an agent file and drops any model key", async function () {
    const assistantPath = writeConfig("json", assistant);

    await createOrUpdateApplication(client, undefined, undefined, false, {
      name: "Receptionist",
      agent: assistantPath
    });

    const request = createStub.firstCall.args[0];
    expect(request.type).to.equal("AUTOPILOT");
    expect(request.url).to.equal(undefined);
    expect(request.intelligence.productRef).to.equal("llm.openai");
    expect(request.intelligence.config.languageModel).to.deep.equal({
      model: "openai/gpt-4o-mini"
    });
  });

  it("accepts an inline assistant in the app file (YAML)", async function () {
    const filePath = writeConfig(
      "yaml",
      "name: Bot\nassistant:\n  name: Bot\n  languageModel:\n    model: groq/llama\n"
    );

    await createOrUpdateApplication(client, filePath);

    const request = createStub.firstCall.args[0];
    expect(request.type).to.equal("AUTOPILOT");
    expect(request.intelligence.productRef).to.equal("llm.groq");
  });

  it("refuses a stream without a url", async function () {
    await expect(
      createOrUpdateApplication(client, undefined, undefined, false, {
        name: "No url"
      })
    ).to.be.rejectedWith(/a url is required/);
    expect(createStub).to.not.have.been.called;
  });

  it("refuses an Autopilot agent on the twilio protocol", async function () {
    const assistantPath = writeConfig("json", assistant);
    await expect(
      createOrUpdateApplication(client, undefined, undefined, false, {
        name: "x",
        agent: assistantPath,
        protocol: "twilio"
      })
    ).to.be.rejectedWith(/fonoster protocol/);
  });

  it("updates from the current app, changing only the flags given", async function () {
    await createOrUpdateApplication(client, undefined, "positional-ref", true, {
      voice: "elevenlabs/rachel"
    });

    expect(getStub).to.have.been.calledOnceWith("positional-ref");
    const request = updateStub.firstCall.args[0];
    expect(request).to.include({
      ref: "positional-ref",
      name: "Current",
      url: "wss://old.example.com/session",
      protocol: "twilio",
      recording: "on"
    });
    expect(request.speech).to.deep.equal({
      voice: "elevenlabs/rachel",
      language: "en-US"
    });
    expect(request.listeners).to.have.length(1);
  });

  it("replaces listeners with --clear-listeners and --listener", async function () {
    await createOrUpdateApplication(client, undefined, "positional-ref", true, {
      "clear-listeners": true,
      listener: ["wss://new.example.com/ws"]
    });

    expect(updateStub.firstCall.args[0].listeners).to.deep.equal([
      { url: "wss://new.example.com/ws", tracks: "both" }
    ]);
  });

  it("keeps an Autopilot app's assistant when updating other fields", async function () {
    getStub.resolves({
      ...currentApp,
      type: "AUTOPILOT",
      protocol: "fonoster",
      url: "ws://autopilot:8080/session",
      intelligence: { productRef: "llm.openai", config: assistant }
    } as never);

    await createOrUpdateApplication(client, undefined, "positional-ref", true, {
      language: "es-ES"
    });

    const request = updateStub.firstCall.args[0];
    expect(request.type).to.equal("AUTOPILOT");
    expect(request.url).to.equal(undefined);
    expect(request.intelligence.config.name).to.equal("Receptionist");
    expect(request.speech.language).to.equal("es-ES");
  });

  it("lets the positional ref override a ref in the file", async function () {
    const filePath = writeConfig("json", { ...baseConfig, ref: "file-ref" });

    await createOrUpdateApplication(client, filePath, "positional-ref", true);

    expect(updateStub.firstCall.args[0]).to.have.property(
      "ref",
      "positional-ref"
    );
    expect(updateStub.firstCall.args[0]).to.include({ name: "My App" });
  });

  it("falls back to the file ref when the positional is omitted", async function () {
    const filePath = writeConfig("yaml", `name: My App\nref: file-ref\n`);

    await createOrUpdateApplication(client, filePath, undefined, true);

    expect(getStub).to.have.been.calledOnceWith("file-ref");
    expect(updateStub.firstCall.args[0]).to.have.property("ref", "file-ref");
  });

  it("throws a clear error when no ref is available for an update", async function () {
    const filePath = writeConfig("json", baseConfig);

    await expect(
      createOrUpdateApplication(client, filePath, undefined, true)
    ).to.be.rejectedWith(/Application ref is required/);

    expect(updateStub).to.not.have.been.called;
    expect(createStub).to.not.have.been.called;
  });

  it("rejects unsupported file formats", async function () {
    const filePath = writeConfig("txt", "name: My App");

    await expect(
      createOrUpdateApplication(client, filePath, "ref", true)
    ).to.be.rejectedWith(/Unsupported file format/);
  });

  it("parses listeners with and without tracks", function () {
    expect(parseListener("wss://a.example.com/x")).to.deep.equal({
      url: "wss://a.example.com/x",
      tracks: "both"
    });
    expect(parseListener("wss://a.example.com/x,inbound")).to.deep.equal({
      url: "wss://a.example.com/x",
      tracks: "inbound"
    });
    expect(() => parseListener("wss://a.example.com/x,sideways")).to.throw(
      /invalid listener tracks/
    );
  });
});
