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
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import {
  AiCousticsSdk,
  createAiCousticsFilter,
  createAudioFilterChain
} from "../../../src/voice/filters";
import { sineAtDb, toFrames } from "./signals";

chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = createSandbox();

const BLOCK_SIZE = 240;
const MODEL_DIR = "/tmp/fonoster-aic-test-models";
const DOWNLOADED_NAME = "quail_vf_2_2_s_16khz_gf70x7zf_v14.aicmodel";

// Stands in for @ai-coustics/aic-sdk: halves every sample so the effect of
// processing is visible, and records how it was driven. It mirrors the real
// API shape, including ProcessorAsync.getContext() being async.
function fakeSdk(overrides: Partial<{ gain: number }> = {}) {
  const gain = overrides.gain ?? 0.5;
  const parameters = new Map<number, number>();
  const blocks: number[] = [];
  const dispose = sandbox.stub();
  // The real SDK returns a hashed, versioned file name
  const downloadedFile = join(MODEL_DIR, DOWNLOADED_NAME);
  const download = sandbox.stub().resolves(downloadedFile);
  const fromFile = sandbox.stub().callsFake(() => ({
    getOptimalSampleRate: () => 16000,
    getOptimalBlockSize: () => BLOCK_SIZE
  }));

  const processor = {
    withConfig: sandbox.stub().callsFake(function (this: unknown) {
      return Promise.resolve(processor);
    }),
    process: sandbox.stub().callsFake((audio: Float32Array) => {
      blocks.push(audio.length);
      return Promise.resolve(audio.map((s) => s * gain));
    }),
    getContext: () =>
      Promise.resolve({
        setParameter: (parameter: number, value: number) =>
          parameters.set(parameter, value),
        getParameter: (parameter: number) => parameters.get(parameter) ?? 0,
        getAudioDelay: () => 480,
        reset: sandbox.stub()
      }),
    dispose
  };

  const sdk: AiCousticsSdk = {
    Model: { fromFile, download },
    ProcessorAsync: function () {
      return processor;
    } as unknown as AiCousticsSdk["ProcessorAsync"]
  };

  return {
    sdk,
    blocks,
    parameters,
    dispose,
    download,
    downloadedFile,
    fromFile,
    processor
  };
}

describe("@voice/filters/createAiCousticsFilter", function () {
  beforeEach(function () {
    process.env.AIC_SDK_LICENSE = "test-license";
  });

  afterEach(function () {
    delete process.env.AIC_SDK_LICENSE;
    rmSync(MODEL_DIR, { recursive: true, force: true });
    sandbox.restore();
  });

  it("requires a license key in the environment", function () {
    // Arrange
    delete process.env.AIC_SDK_LICENSE;
    const { sdk } = fakeSdk();

    // Act & Assert
    expect(() =>
      createAiCousticsFilter({ modelDir: MODEL_DIR }, { loadSdk: () => sdk })
    ).to.throw(/AIC_SDK_LICENSE/);
  });

  it("reads the key from a custom environment variable", function () {
    // Arrange
    process.env.OTHER_KEY = "other";
    const { sdk } = fakeSdk();

    // Act & Assert
    expect(() =>
      createAiCousticsFilter(
        { modelDir: MODEL_DIR, licenseEnv: "OTHER_KEY" },
        { loadSdk: () => sdk }
      )
    ).to.not.throw();
    delete process.env.OTHER_KEY;
  });

  it("passes audio through untouched before the model is ready", async function () {
    // Arrange
    const { sdk } = fakeSdk();
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR },
      { loadSdk: () => sdk }
    );
    const frame = sineAtDb(-20, 20);

    // Act: no await on ready()
    const output = await filter.process(frame);

    // Assert
    expect(output).to.equal(frame);
    expect(filter.getStats!().framesPassedThrough).to.equal(1);
  });

  it("feeds the model whole blocks of its optimal size", async function () {
    // Arrange
    const { sdk, blocks } = fakeSdk();
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR },
      { loadSdk: () => sdk }
    );
    await filter.ready!();

    // Act: five 320-sample frames = 1600 samples = six 240-sample blocks
    await toFrames(sineAtDb(-20, 100)).reduce(
      (previous, frame) => previous.then(() => filter.process(frame)),
      Promise.resolve(new Int16Array(0) as Int16Array)
    );

    // Assert
    expect(blocks).to.deep.equal([
      BLOCK_SIZE,
      BLOCK_SIZE,
      BLOCK_SIZE,
      BLOCK_SIZE,
      BLOCK_SIZE,
      BLOCK_SIZE
    ]);
  });

  it("returns the enhanced audio one block later, same length", async function () {
    // Arrange
    const { sdk } = fakeSdk({ gain: 0.5 });
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR },
      { loadSdk: () => sdk }
    );
    await filter.ready!();
    const frames = toFrames(sineAtDb(-20, 200));

    // Act
    const outputs = await frames.reduce(
      async (previous, frame) => {
        const list = await previous;
        return [...list, await filter.process(frame)];
      },
      Promise.resolve([] as Int16Array[])
    );

    // Assert: every frame keeps its length, the first is the primed silence,
    // and later frames carry the halved signal
    outputs.forEach((output, i) =>
      expect(output.length, `frame ${i}`).to.equal(frames[i].length)
    );
    expect(Array.from(outputs[0].slice(0, BLOCK_SIZE))).to.deep.equal(
      new Array(BLOCK_SIZE).fill(0)
    );
    const inputPeak = Math.max(...Array.from(frames[5], Math.abs));
    const outputPeak = Math.max(...Array.from(outputs[5], Math.abs));
    expect(outputPeak).to.be.closeTo(inputPeak * 0.5, inputPeak * 0.1);
  });

  it("applies enhancement level and bypass to the processor", async function () {
    // Arrange
    const { sdk, parameters } = fakeSdk();

    // Act
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR, enhancementLevel: 0.6, bypass: true },
      { loadSdk: () => sdk }
    );
    await filter.ready!();

    // Assert: 1 = EnhancementLevel, 0 = Bypass
    expect(parameters.get(1)).to.equal(0.6);
    expect(parameters.get(0)).to.equal(1);
  });

  it("reports the delay the SDK measures", async function () {
    // Arrange
    const { sdk } = fakeSdk();
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR },
      { loadSdk: () => sdk }
    );

    // Act
    await filter.ready!();

    // Assert: 480 samples at 16 kHz
    expect(filter.delayMs).to.equal(30);
    expect(filter.getStats!().blockSize).to.equal(BLOCK_SIZE);
  });

  it("downloads the model when it isn't on disk and loads what it returns", async function () {
    // Arrange
    const { sdk, download, fromFile, downloadedFile } = fakeSdk();
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR, model: "quail-vf-2.2-s-16khz" },
      { loadSdk: () => sdk }
    );

    // Act
    await filter.ready!();

    // Assert
    expect(download).to.have.been.calledWith("quail-vf-2.2-s-16khz", MODEL_DIR);
    expect(fromFile).to.have.been.calledWith(downloadedFile);
  });

  it("reuses a downloaded model instead of fetching it again", async function () {
    // Arrange: the file on disk carries a hash and version, not the model id
    mkdirSync(MODEL_DIR, { recursive: true });
    writeFileSync(join(MODEL_DIR, DOWNLOADED_NAME), "model");
    const { sdk, download, fromFile } = fakeSdk();
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR, model: "quail-vf-2.2-s-16khz" },
      { loadSdk: () => sdk }
    );

    // Act
    await filter.ready!();

    // Assert
    expect(download).to.not.have.been.called;
    expect(fromFile).to.have.been.calledWith(join(MODEL_DIR, DOWNLOADED_NAME));
  });

  it("loads an explicit model file when one is given", async function () {
    // Arrange
    const { sdk, download, fromFile } = fakeSdk();
    const filter = createAiCousticsFilter(
      { modelFile: "/opt/models/pinned.aicmodel", autoDownload: false },
      { loadSdk: () => sdk }
    );

    // Act
    await filter.ready!();

    // Assert
    expect(download).to.not.have.been.called;
    expect(fromFile).to.have.been.calledWith("/opt/models/pinned.aicmodel");
  });

  it("fails to start when downloads are off and the model is missing", async function () {
    // Arrange
    const { sdk } = fakeSdk();
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR, autoDownload: false },
      { loadSdk: () => sdk }
    );

    // Act & Assert
    await expect(filter.ready!()).to.be.rejectedWith(/not found/);
  });

  it("rejects a model that doesn't match the call sample rate", async function () {
    // Arrange
    const { sdk } = fakeSdk();
    sdk.Model.fromFile = () => ({
      getOptimalSampleRate: () => 48000,
      getOptimalBlockSize: () => 480
    });

    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR },
      { loadSdk: () => sdk }
    );

    // Act & Assert
    await expect(filter.ready!()).to.be.rejectedWith(/48000 Hz.*16000 Hz/);
  });

  it("explains how to install the SDK when it is missing", async function () {
    // Arrange
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR },
      {
        loadSdk: () => {
          throw new Error(
            '@ai-coustics/aic-sdk is not installed. Run "npm install @ai-coustics/aic-sdk" to use the aiCoustics filter.'
          );
        }
      }
    );

    // Act & Assert
    await expect(filter.ready!()).to.be.rejectedWith(/npm install/);
  });

  it("is disabled by the chain when it cannot start, and audio still flows", async function () {
    // Arrange
    const { sdk } = fakeSdk();
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR, autoDownload: false },
      { loadSdk: () => sdk }
    );
    const chain = createAudioFilterChain([filter]);
    const frame = sineAtDb(-20, 20);

    // Act
    await chain.ready();
    const output = await chain.process(frame);

    // Assert
    expect(output).to.equal(frame);
    expect(chain.getStats().filters[0].disabled).to.be.true;
  });

  it("fails with a clear message when the context is not what the SDK promises", async function () {
    // Arrange: an SDK version whose context lacks setParameter
    const { sdk, processor } = fakeSdk();
    processor.getContext = () => Promise.resolve({}) as never;
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR },
      { loadSdk: () => sdk }
    );

    // Act & Assert
    await expect(filter.ready!()).to.be.rejectedWith(
      /unexpected processor context/
    );
  });

  it("records why the chain disabled it", async function () {
    // Arrange
    const { sdk } = fakeSdk();
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR, autoDownload: false },
      { loadSdk: () => sdk }
    );
    const chain = createAudioFilterChain([filter]);

    // Act
    await chain.ready();

    // Assert
    expect(chain.getStats().filters[0].error).to.match(/not found/);
  });

  it("disposes a processor that arrives after close", async function () {
    // Arrange: close lands while the model is still loading
    const { sdk, dispose, download } = fakeSdk();
    let finishDownload: (path: string) => void = () => {};
    download.callsFake(
      () => new Promise<string>((resolve) => (finishDownload = resolve))
    );
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR },
      { loadSdk: () => sdk }
    );
    const ready = filter.ready!();

    // Act
    filter.close!();
    finishDownload(join(MODEL_DIR, DOWNLOADED_NAME));
    await ready;

    // Assert: nothing is left holding a native handle
    expect(dispose).to.have.been.calledOnce;
  });

  it("disposes the processor on close", async function () {
    // Arrange
    const { sdk, dispose } = fakeSdk();
    const filter = createAiCousticsFilter(
      { modelDir: MODEL_DIR },
      { loadSdk: () => sdk }
    );
    await filter.ready!();

    // Act
    filter.close!();

    // Assert
    expect(dispose).to.have.been.calledOnce;
  });
});
