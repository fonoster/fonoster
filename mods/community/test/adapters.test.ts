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
import { adapterFor, ADAPTERS } from "../src";
import { DeepgramSttAdapter, DeepgramTtsAdapter } from "../src/deepgram";
import { ElevenLabsTtsAdapter } from "../src/elevenlabs";
import { FakeSttAdapter, FakeTtsAdapter } from "../src/fake";
import { OpenAiCompatibleThink } from "../src/openai";

describe("@fonoster/community adapter table", function () {
  it("builds the speech adapters by catalog adapter id", function () {
    const deepgram = adapterFor("deepgram")!;
    expect(deepgram.tts!({ apiKey: "k" })).to.be.instanceOf(DeepgramTtsAdapter);
    expect(deepgram.stt!({ apiKey: "k" })).to.be.instanceOf(DeepgramSttAdapter);
    const eleven = adapterFor("elevenlabs")!;
    expect(eleven.tts!({ apiKey: "k" })).to.be.instanceOf(ElevenLabsTtsAdapter);
    expect(eleven.stt).to.equal(undefined);
  });

  it("builds fake speech adapters only with an endpoint, and without a key", function () {
    const fake = adapterFor("fake")!;
    expect(fake.keyless).to.equal(true);
    expect(fake.tts!({})).to.equal(undefined);
    expect(fake.stt!({})).to.equal(undefined);
    expect(fake.tts!({ url: "http://x" })).to.be.instanceOf(FakeTtsAdapter);
    expect(fake.stt!({ url: "http://x" })).to.be.instanceOf(FakeSttAdapter);
  });

  it("serves language models through OpenAI-compatible adapters", function () {
    for (const id of ["openai", "groq", "ollama", "fake"]) {
      const llm = adapterFor(id)!.llm!;
      expect(
        llm.create({ baseUrl: "http://x" }, "m", {
          temperature: 0,
          maxTokens: 1
        })
      ).to.be.instanceOf(OpenAiCompatibleThink);
    }
    expect(adapterFor("openai")!.llm!.defaultEndpoint).to.equal(
      "https://api.openai.com"
    );
    expect(adapterFor("fake")!.llm!.defaultEndpoint).to.equal(undefined);
    expect(adapterFor("ollama")!.keyless).to.equal(true);
    expect(adapterFor("openai")!.keyless).to.equal(undefined);
  });

  it("knows nothing about adapters it does not ship", function () {
    expect(adapterFor("azure")).to.equal(undefined);
    expect(adapterFor("toString")).to.equal(undefined);
    expect(Object.keys(ADAPTERS).sort()).to.deep.equal([
      "deepgram",
      "elevenlabs",
      "fake",
      "groq",
      "ollama",
      "openai"
    ]);
  });
});
