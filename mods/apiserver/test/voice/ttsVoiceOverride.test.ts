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
import { Readable } from "stream";
import { AzureVoice, DeepgramVoice, GoogleVoice } from "@fonoster/common";
import { expect } from "chai";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { createSandbox, SinonStub } from "sinon";
import { Azure } from "../../src/voice/tts/Azure";
import { Deepgram } from "../../src/voice/tts/Deepgram";
import { ElevenLabs } from "../../src/voice/tts/ElevenLabs";
import { Google } from "../../src/voice/tts/Google";
import { SynthOptions } from "../../src/voice/tts/types";
import { streamToBuffer } from "../../src/voice/tts/utils/streamToBuffer";

const sandbox = createSandbox();

// Consume the stream so every chunk is synthesized
async function drain(stream: Readable): Promise<void> {
  await streamToBuffer(stream);
}

// The Say verb forwards whatever the app passed as options, so the engines
// receive loosely typed objects such as `{}` or `{ playbackRef }`.
function opts(options: Record<string, unknown>): SynthOptions {
  return options as unknown as SynthOptions;
}

describe("@voice/tts per-call voice override", function () {
  afterEach(function () {
    sandbox.restore();
  });

  describe("Google", function () {
    let engine: Google;
    let synthesizeSpeech: SinonStub;

    beforeEach(function () {
      engine = new Google({
        credentials: { client_email: "tts-client", private_key: "key" },
        config: { voice: GoogleVoice.EN_US_STANDARD_A }
      });
      synthesizeSpeech = sandbox
        .stub()
        .resolves([{ audioContent: Buffer.alloc(64) }]);
      engine.client = {
        synthesizeSpeech
      } as unknown as Google["client"];
    });

    it("uses the voice passed in the say options", async function () {
      const { stream } = engine.synthesize(
        "Hello",
        opts({ voice: GoogleVoice.EN_US_NEURAL2_C })
      );
      await drain(stream);

      const [request] = synthesizeSpeech.firstCall.args;
      expect(request.voice).to.deep.equal({
        languageCode: "en-US",
        name: GoogleVoice.EN_US_NEURAL2_C
      });
    });

    it("derives the language code from the override voice", async function () {
      const { stream } = engine.synthesize(
        "Hola",
        opts({ voice: "es-ES-Standard-A" })
      );
      await drain(stream);

      const [request] = synthesizeSpeech.firstCall.args;
      expect(request.voice).to.deep.equal({
        languageCode: "es-ES",
        name: "es-ES-Standard-A"
      });
    });

    it("falls back to the configured voice when no voice is passed", async function () {
      const { stream } = engine.synthesize(
        "Hello",
        opts({ playbackRef: "ref" })
      );
      await drain(stream);

      const [request] = synthesizeSpeech.firstCall.args;
      expect(request.voice.name).to.equal(GoogleVoice.EN_US_STANDARD_A);
    });

    it("falls back to the configured voice for an unknown voice", async function () {
      const { stream } = engine.synthesize(
        "Hello",
        opts({ voice: "not-a-google-voice" })
      );
      await drain(stream);

      const [request] = synthesizeSpeech.firstCall.args;
      expect(request.voice).to.deep.equal({
        languageCode: "en-US",
        name: GoogleVoice.EN_US_STANDARD_A
      });
    });
  });

  describe("ElevenLabs", function () {
    let engine: ElevenLabs;
    let generate: SinonStub;

    beforeEach(function () {
      engine = new ElevenLabs({
        credentials: { apiKey: "key" },
        config: { voice: "configured-voice-id" }
      });
      generate = sandbox
        .stub()
        .callsFake(async () => Readable.from([Buffer.alloc(32, 0xff)]));
      engine.client = { generate } as unknown as ElevenLabs["client"];
    });

    it("uses the voice passed in the say options", async function () {
      const { stream } = engine.synthesize(
        "Hello",
        opts({ voice: "override-voice-id" })
      );
      await drain(stream);

      expect(generate.firstCall.args[0].voice).to.equal("override-voice-id");
    });

    it("falls back to the configured voice when no voice is passed", async function () {
      const { stream } = engine.synthesize("Hello", opts({}));
      await drain(stream);

      expect(generate.firstCall.args[0].voice).to.equal("configured-voice-id");
    });

    it("falls back to the configured voice for an empty voice", async function () {
      const { stream } = engine.synthesize("Hello", opts({ voice: "  " }));
      await drain(stream);

      expect(generate.firstCall.args[0].voice).to.equal("configured-voice-id");
    });
  });

  describe("Deepgram", function () {
    let engine: Deepgram;
    let request: SinonStub;

    beforeEach(function () {
      engine = new Deepgram({
        credentials: { apiKey: "key" },
        config: { voice: DeepgramVoice.AURA_ASTERIA_EN }
      });
      request = sandbox.stub().resolves({
        getStream: async () => Readable.from([Buffer.alloc(32)])
      });
      engine.client = {
        speak: { request }
      } as unknown as Deepgram["client"];
    });

    it("uses the voice passed in the say options", async function () {
      const { stream } = engine.synthesize(
        "Hello",
        opts({ voice: DeepgramVoice.AURA_2_ANDROMEDA_EN })
      );
      await drain(stream);

      expect(request.firstCall.args[1].model).to.equal(
        DeepgramVoice.AURA_2_ANDROMEDA_EN
      );
    });

    it("falls back to the configured voice when no voice is passed", async function () {
      const { stream } = engine.synthesize("Hello", opts({}));
      await drain(stream);

      expect(request.firstCall.args[1].model).to.equal(
        DeepgramVoice.AURA_ASTERIA_EN
      );
    });

    it("falls back to the configured voice for an unknown voice", async function () {
      const { stream } = engine.synthesize(
        "Hello",
        opts({ voice: "aura-unknown-en" })
      );
      await drain(stream);

      expect(request.firstCall.args[1].model).to.equal(
        DeepgramVoice.AURA_ASTERIA_EN
      );
    });
  });

  describe("Azure", function () {
    let speechConfig: { speechSynthesisVoiceName?: string };

    beforeEach(function () {
      speechConfig = {};
      sandbox
        .stub(sdk.SpeechConfig, "fromSubscription")
        .returns(speechConfig as unknown as sdk.SpeechConfig);
    });

    function synthesize(options: SynthOptions) {
      const engine = new Azure({
        credentials: { subscriptionKey: "key", serviceRegion: "eastus" },
        config: { voice: AzureVoice.EN_US_JENNY_NEURAL }
      });
      // Empty text produces no chunks, so no synthesizer is ever created
      const { stream } = engine.synthesize("", options);
      stream.resume();
    }

    it("uses the voice passed in the say options", function () {
      synthesize(opts({ voice: AzureVoice.EN_US_GUY_NEURAL }));

      expect(speechConfig.speechSynthesisVoiceName).to.equal(
        AzureVoice.EN_US_GUY_NEURAL
      );
    });

    it("falls back to the configured voice when no voice is passed", function () {
      synthesize(opts({}));

      expect(speechConfig.speechSynthesisVoiceName).to.equal(
        AzureVoice.EN_US_JENNY_NEURAL
      );
    });

    it("keeps passing voices outside the enum through to Azure", function () {
      synthesize(opts({ voice: "en-US-SomeNewNeural" }));

      expect(speechConfig.speechSynthesisVoiceName).to.equal(
        "en-US-SomeNewNeural"
      );
    });
  });
});
