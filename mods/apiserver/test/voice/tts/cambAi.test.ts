/*
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
import { createSandbox, SinonStub } from "sinon";
import { Readable } from "stream";
import { CambAi, ENGINE_NAME } from "../../../src/voice/tts/CambAi";
import { TextToSpeechFactory } from "../../../src/voice/tts/TextToSpeechFactory";
import { CambAiTtsConfig } from "../../../src/voice/tts/types";

const sandbox = createSandbox();

function createTestConfig(overrides: Partial<CambAiTtsConfig> = {}): CambAiTtsConfig {
  return {
    credentials: { apiKey: "test-api-key" },
    config: {
      voice: "147320",
      model: "mars-flash",
      language: "en-us"
    },
    ...overrides
  } as CambAiTtsConfig;
}

// Build a minimal WAV buffer: 44-byte header + PCM16 payload
function buildWavBuffer(pcmBytes: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmBytes, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(24000, 24); // sample rate
  header.writeUInt32LE(48000, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcmBytes, 40);
  const pcm = Buffer.alloc(pcmBytes, 0x10); // non-silent PCM
  return Buffer.concat([header, pcm]);
}

describe("@voice/tts/CambAi", function () {
  let fetchStub: SinonStub;

  beforeEach(function () {
    fetchStub = sandbox.stub(global, "fetch");
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should have the correct engine name", function () {
    expect(ENGINE_NAME).to.equal("tts.cambai");
  });

  it("should create an instance with correct config", function () {
    const config = createTestConfig();
    const engine = new CambAi(config);
    expect(engine.getName()).to.equal("tts.cambai");
  });

  it("should send correct payload to CAMB AI API", async function () {
    const wavBuffer = buildWavBuffer(960); // 480 samples of PCM16
    fetchStub.resolves(new Response(wavBuffer, { status: 200 }));

    const config = createTestConfig();
    const engine = new CambAi(config);
    const { stream } = engine.synthesize("Hello from test", { voice: "147320" });

    // Consume stream to trigger the fetch
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    expect(fetchStub.calledOnce).to.be.true;
    const [url, options] = fetchStub.firstCall.args;
    expect(url).to.equal("https://client.camb.ai/apis/tts-stream");

    const body = JSON.parse(options.body);
    expect(body.text).to.equal("Hello from test");
    expect(body.voice_id).to.equal(147320);
    expect(body.language).to.equal("en-us");
    expect(body.speech_model).to.equal("mars-flash");
    expect(body.output_configuration).to.deep.equal({ format: "wav" });
    expect(options.headers["x-api-key"]).to.equal("test-api-key");
  });

  it("should strip WAV header from response", async function () {
    const pcmSize = 480; // bytes of PCM data
    const wavBuffer = buildWavBuffer(pcmSize);
    fetchStub.resolves(new Response(wavBuffer, { status: 200 }));

    const config = createTestConfig();
    const engine = new CambAi(config);
    const { ref, stream } = engine.synthesize("Test", { voice: "147320" });

    expect(ref).to.be.a("string");

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const result = Buffer.concat(chunks);
    // Result should be PCM data without the 44-byte WAV header
    expect(result.length).to.equal(pcmSize);
  });

  it("should propagate API errors", async function () {
    fetchStub.resolves(
      new Response('{"error": "unauthorized"}', { status: 401 })
    );

    const config = createTestConfig();
    const engine = new CambAi(config);
    const { stream } = engine.synthesize("Error test", { voice: "147320" });

    return new Promise<void>((resolve) => {
      stream.on("error", (err: Error) => {
        expect(err.message).to.include("401");
        resolve();
      });
      stream.on("data", () => {}); // consume to trigger
    });
  });

  it("should use mars-pro model when configured", async function () {
    const wavBuffer = buildWavBuffer(960);
    fetchStub.resolves(new Response(wavBuffer, { status: 200 }));

    const config = createTestConfig();
    config.config.model = "mars-pro";
    const engine = new CambAi(config);
    const { stream } = engine.synthesize("Quality test", { voice: "147320" });

    await new Promise<void>((resolve, reject) => {
      stream.on("data", () => {});
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const body = JSON.parse(fetchStub.firstCall.args[1].body);
    expect(body.speech_model).to.equal("mars-pro");
  });

  it("should validate config schema", function () {
    const schema = CambAi.getConfigValidationSchema();
    // Valid config
    expect(() => schema.parse({ voice: "147320", model: "mars-flash" })).to.not
      .throw;
    // Invalid model should fail
    expect(() =>
      schema.parse({ model: "invalid-model" })
    ).to.throw;
  });

  it("should validate credentials schema", function () {
    const schema = CambAi.getCredentialsValidationSchema();
    expect(() => schema.parse({ apiKey: "test-key" })).to.not.throw;
    expect(() => schema.parse({})).to.throw;
  });
});

describe("@voice/tts/TextToSpeechFactory - CambAi", function () {
  it("should return a CambAi instance for tts.cambai", function () {
    const config = createTestConfig();
    const engine = TextToSpeechFactory.getEngine("tts.cambai", config);
    expect(engine.getName()).to.equal("tts.cambai");
    expect(engine).to.be.an.instanceOf(CambAi);
  });

  it("should throw for unknown engine", function () {
    expect(() =>
      TextToSpeechFactory.getEngine("tts.nonexistent", {})
    ).to.throw("Engine tts.nonexistent not found");
  });
});

describe("@voice/tts/CambAi - Integration", function () {
  it("should synthesize speech with real API", async function () {
    const apiKey = process.env.CAMB_API_KEY;
    if (!apiKey) {
      this.skip();
      return;
    }

    const config: CambAiTtsConfig = {
      credentials: { apiKey },
      config: {
        voice: "147320",
        model: "mars-flash",
        language: "en-us"
      }
    } as CambAiTtsConfig;

    const engine = new CambAi(config);
    const { ref, stream } = engine.synthesize("Hello from Fonoster test.", {
      voice: "147320"
    });

    expect(ref).to.be.a("string");

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const result = Buffer.concat(chunks);
    expect(result.length).to.be.greaterThan(100);
  });
});
