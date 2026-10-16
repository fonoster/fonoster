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
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { assistantSchema } from "@fonoster/common";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { dump as dumpYaml } from "js-yaml";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { Autopilot } from "../src/Autopilot";
import { loadAndValidateAssistant } from "../src/assistants/loadAndValidateAssistant";

chai.use(chaiAsPromised);
chai.use(sinonChai);

const assistant = {
  conversationSettings: {
    firstMessage: "Hola",
    systemPrompt: "You are a helpful assistant",
    goodbyeMessage: "Adiós",
    systemErrorMessage: "Error",
    idleOptions: { message: "¿Sigues ahí?" }
  },
  languageModel: {
    provider: "openai",
    model: "gpt-4o",
    apiKey: "sk-test",
    temperature: 0.2,
    maxTokens: 300
  }
};

const audioFilters = [
  { name: "aiCoustics", options: { enhancementLevel: 0.8 } }
];

describe("@autopilot/audioFilters", function () {
  let dir: string;

  beforeEach(function () {
    dir = mkdtempSync(join(tmpdir(), "fonoster-assistant-"));
  });

  afterEach(function () {
    rmSync(dir, { recursive: true, force: true });
  });

  it("should read audioFilters from a YAML assistant", function () {
    // Arrange
    const file = join(dir, "assistant.yaml");
    writeFileSync(file, dumpYaml({ ...assistant, audioFilters }));

    // Act
    const config = loadAndValidateAssistant(file);

    // Assert
    expect(config.audioFilters).to.deep.equal(audioFilters);
  });

  it("should read the same assistant from JSON", function () {
    // Arrange
    const yamlFile = join(dir, "assistant.yaml");
    const jsonFile = join(dir, "assistant.json");
    writeFileSync(yamlFile, dumpYaml({ ...assistant, audioFilters }));
    writeFileSync(jsonFile, JSON.stringify({ ...assistant, audioFilters }));

    // Act & Assert
    expect(loadAndValidateAssistant(yamlFile)).to.deep.equal(
      loadAndValidateAssistant(jsonFile)
    );
  });

  it("should default to no filters", function () {
    // Arrange
    const file = join(dir, "assistant.json");
    writeFileSync(file, JSON.stringify(assistant));

    // Act
    const config = loadAndValidateAssistant(file);

    // Assert
    expect(config.audioFilters).to.deep.equal([]);
  });

  it("should reject a filter without a name", function () {
    expect(
      assistantSchema.safeParse({ ...assistant, audioFilters: [{ name: "" }] })
        .success
    ).to.be.false;
  });

  it("should reject options that are not an object", function () {
    expect(
      assistantSchema.safeParse({
        ...assistant,
        audioFilters: [{ name: "aiCoustics", options: "loud" }]
      }).success
    ).to.be.false;
  });
});

describe("@autopilot/audioFilters requesting", function () {
  const sandbox = createSandbox();

  afterEach(function () {
    return sandbox.restore();
  });

  // Autopilot.start() also boots VAD and the state machine, which need a model
  // file and a live session. The filter request is the first thing it does, so
  // driving it directly keeps the test to the behavior under test.
  function getAutopilot(filters?: { name: string }[]) {
    const voice = {
      setAudioFilters: sandbox.stub().resolves(),
      answer: sandbox.stub().resolves()
    };
    const autopilot = Object.create(Autopilot.prototype) as Autopilot & {
      params: unknown;
      setupAudioFilters: () => Promise<void>;
    };
    autopilot.params = { voice, audioFilters: filters };
    return { autopilot, voice };
  }

  it("should request the assistant's filters", async function () {
    // Arrange
    const { autopilot, voice } = getAutopilot([{ name: "aiCoustics" }]);

    // Act
    await autopilot["setupAudioFilters"]();

    // Assert
    expect(voice.setAudioFilters).to.have.been.calledOnceWith([
      { name: "aiCoustics" }
    ]);
  });

  it("should request nothing when the assistant declares no filters", async function () {
    // Arrange
    const { autopilot, voice } = getAutopilot();

    // Act
    await autopilot["setupAudioFilters"]();

    // Assert
    expect(voice.setAudioFilters).to.not.have.been.called;
  });

  it("should continue the call when the media server refuses", async function () {
    // Arrange
    const { autopilot, voice } = getAutopilot([{ name: "nope" }]);
    voice.setAudioFilters.rejects(new Error("Unknown audio filter"));

    // Act & Assert: swallowed, so the call still goes ahead
    await expect(autopilot["setupAudioFilters"]()).to.be.fulfilled;
  });
});
