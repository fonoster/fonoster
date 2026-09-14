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
import { AmdStatus } from "@fonoster/common";
import { AudioStream } from "@fonoster/streams";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { runProbe } from "../../src/probe/runProbe";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

// slin @ 8 kHz mono: 16 bytes per ms, 320 bytes per 20 ms frame.
const BYTES_PER_MS = 16;
const SPEECH_THRESHOLD = 256;
// Every sample 0x0404 = 1028, well above the threshold.
const speech = (ms: number) => Buffer.alloc(ms * BYTES_PER_MS, 4);
const silence = (ms: number) => Buffer.alloc(ms * BYTES_PER_MS);

/**
 * AudioStream exposes no way to inspect or remove a specific listener (see
 * collectPcm.ts), so this fake only needs to record the callbacks and let the
 * test fire them — there is nothing to assert about listener cleanup here.
 */
function fakeAudioStream() {
  let dataCb: ((data: Buffer) => void) | undefined;
  let closeCb: (() => void) | undefined;

  return {
    onData(cb: (data: Buffer) => void) {
      dataCb = cb;
      return this;
    },
    onClose(cb: () => void) {
      closeCb = cb;
      return this;
    },
    onError() {
      return this;
    },
    emitData(chunk: Buffer) {
      dataCb?.(chunk);
    },
    emitClose() {
      closeCb?.();
    }
  };
}

const probeWith = (
  stream: ReturnType<typeof fakeAudioStream>,
  options: { probeMs: number; timeoutMs: number; classify: sinon.SinonStub }
) =>
  runProbe({
    stream: stream as unknown as AudioStream,
    speechThreshold: SPEECH_THRESHOLD,
    ...options
  });

describe("@probe/runProbe", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("returns the raw classification untouched, with no confidence policy applied", async function () {
    const classify = sandbox.stub().resolves({
      status: AmdStatus.VOICEMAIL,
      confidence: 0.12, // deliberately low — runProbe must not downgrade this
      detector: "test-detector"
    });
    const stream = fakeAudioStream();

    const probe = probeWith(stream, { probeMs: 100, timeoutMs: 1000, classify });
    stream.emitData(speech(250));
    const result = await probe;

    expect(result.kind).to.equal("classified");
    if (result.kind !== "classified") return;
    expect(result.status).to.equal(AmdStatus.VOICEMAIL);
    expect(result.confidence).to.equal(0.12);
    expect(result.detector).to.equal("test-detector");
    expect(result.latencyMs).to.be.a("number");
    expect(result.speechOnsetMs).to.equal(0);
    expect(classify).to.have.been.calledOnce;
  });

  it("starts the window at speech onset and reports the silence before it", async function () {
    const classify = sandbox
      .stub()
      .resolves({ status: AmdStatus.VOICEMAIL, confidence: 0.9, detector: "d" });
    const stream = fakeAudioStream();

    const probe = probeWith(stream, { probeMs: 100, timeoutMs: 2000, classify });
    // Arrives in 20 ms frames, like AudioSocket.
    const audio = Buffer.concat([silence(1000), speech(200)]);
    for (let i = 0; i < audio.length; i += 320) {
      stream.emitData(audio.subarray(i, i + 320));
    }
    const result = await probe;

    expect(result).to.include({ kind: "classified", speechOnsetMs: 1000 });
    // 100 ms of 8 kHz speech, upsampled to 16 kHz: none of the silence.
    const classified = classify.firstCall.args[0] as Buffer;
    expect(classified.length).to.equal(100 * BYTES_PER_MS * 2);
    expect(classified.every((b) => b === 4)).to.equal(true); // no silent samples
  });

  it("does not start the window on a single loud frame", async function () {
    const classify = sandbox
      .stub()
      .resolves({ status: AmdStatus.HUMAN, confidence: 0.9, detector: "d" });
    const stream = fakeAudioStream();

    const probe = probeWith(stream, { probeMs: 100, timeoutMs: 2000, classify });
    stream.emitData(Buffer.concat([silence(200), speech(20), silence(200), speech(200)]));
    const result = await probe;

    expect(result).to.include({ kind: "classified", speechOnsetMs: 420 });
  });

  it("returns unknown/ML-NO-SPEECH when only silence arrives before the stream ends", async function () {
    const classify = sandbox.stub();
    const stream = fakeAudioStream();

    const probe = probeWith(stream, { probeMs: 100, timeoutMs: 2000, classify });
    stream.emitData(silence(3000));
    stream.emitClose();
    const result = await probe;

    expect(result).to.include({ kind: "unknown", cause: "ML-NO-SPEECH" });
    expect(result).to.not.have.property("speechOnsetMs");
    expect(classify).to.not.have.been.called;
  });

  it("returns unknown/ML-NO-SPEECH at the deadline when silence never turns into speech", async function () {
    const classify = sandbox.stub();
    const stream = fakeAudioStream();
    const startedAt = Date.now();

    const probe = probeWith(stream, { probeMs: 100, timeoutMs: 120, classify });
    stream.emitData(silence(60));
    const result = await probe;

    expect(result).to.include({ kind: "unknown", cause: "ML-NO-SPEECH" });
    expect(Date.now() - startedAt).to.be.lessThan(1000);
    expect(classify).to.not.have.been.called;
  });

  it("returns unknown/ML-TIMEOUT with the onset when speech starts but the deadline hits mid-window", async function () {
    const classify = sandbox.stub();
    const stream = fakeAudioStream();

    const probe = probeWith(stream, { probeMs: 5000, timeoutMs: 120, classify });
    stream.emitData(Buffer.concat([silence(40), speech(60)]));
    const result = await probe;

    expect(result).to.include({ kind: "unknown", cause: "ML-TIMEOUT", speechOnsetMs: 40 });
    expect(classify).to.not.have.been.called;
  });

  it("fails open to unknown/ML-ERROR when the classifier throws", async function () {
    const classify = sandbox.stub().rejects(new Error("model load failed"));
    const stream = fakeAudioStream();

    const probe = probeWith(stream, { probeMs: 100, timeoutMs: 1000, classify });
    stream.emitData(speech(250));
    const result = await probe;

    expect(result).to.include({ kind: "unknown", cause: "ML-ERROR" });
  });

  it("returns unknown/ML-TIMEOUT when classification outlasts the deadline", async function () {
    // classify never resolves within the deadline (simulates a cold model load
    // or a hung inference).
    const classify = sandbox
      .stub()
      .returns(new Promise(() => undefined) as Promise<never>);
    const stream = fakeAudioStream();
    const startedAt = Date.now();

    const probe = probeWith(stream, { probeMs: 100, timeoutMs: 150, classify });
    stream.emitData(speech(250));
    const result = await probe;

    expect(result).to.include({ kind: "unknown", cause: "ML-TIMEOUT" });
    expect(classify).to.have.been.calledOnce;
    expect(Date.now() - startedAt).to.be.lessThan(1000);
  });

  it("returns unknown/ML-NO-AUDIO when no audio arrives at all", async function () {
    const classify = sandbox.stub();
    const stream = fakeAudioStream();

    const probe = probeWith(stream, { probeMs: 5000, timeoutMs: 2000, classify });
    stream.emitClose();
    const result = await probe;

    expect(result).to.include({ kind: "unknown", cause: "ML-NO-AUDIO" });
    expect(classify).to.not.have.been.called;
  });

  it("classifies with a partial window when the probe timer fires first", async function () {
    const classify = sandbox
      .stub()
      .resolves({ status: AmdStatus.HUMAN, confidence: 0.9, detector: "d" });
    const stream = fakeAudioStream();

    const probe = probeWith(stream, { probeMs: 200, timeoutMs: 1000, classify });
    stream.emitData(speech(60)); // less than a full probe window
    const result = await probe;

    expect(classify).to.have.been.calledOnce;
    expect(result).to.include({ kind: "classified", status: AmdStatus.HUMAN });
  });

  it("resolves via onClose when the stream ends before the probe window fills", async function () {
    const classify = sandbox
      .stub()
      .resolves({ status: AmdStatus.HUMAN, confidence: 1, detector: "d" });
    const stream = fakeAudioStream();

    const probe = probeWith(stream, { probeMs: 5000, timeoutMs: 2000, classify });
    stream.emitData(speech(60));
    stream.emitClose();
    const result = await probe;

    expect(classify).to.have.been.calledOnce;
    expect(result).to.include({ kind: "classified", status: AmdStatus.HUMAN });
  });
});
