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

// 100 ms of slin16 @ 16 kHz mono = 0.1 * 16000 * 2 = 3200 bytes
const pcmChunk = (bytes: number) => Buffer.alloc(bytes, 1);

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

    const probe = runProbe({
      stream: stream as unknown as AudioStream,
      probeMs: 100,
      timeoutMs: 1000,
      classify
    });
    stream.emitData(pcmChunk(4000));
    const result = await probe;

    expect(result.kind).to.equal("classified");
    if (result.kind !== "classified") return;
    expect(result.status).to.equal(AmdStatus.VOICEMAIL);
    expect(result.confidence).to.equal(0.12);
    expect(result.detector).to.equal("test-detector");
    expect(result.latencyMs).to.be.a("number");
    expect(classify).to.have.been.calledOnce;
  });

  it("fails open to unknown/ML-ERROR when the classifier throws", async function () {
    const classify = sandbox.stub().rejects(new Error("model load failed"));
    const stream = fakeAudioStream();

    const probe = runProbe({
      stream: stream as unknown as AudioStream,
      probeMs: 100,
      timeoutMs: 1000,
      classify
    });
    stream.emitData(pcmChunk(4000));
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

    const probe = runProbe({
      stream: stream as unknown as AudioStream,
      probeMs: 40,
      timeoutMs: 150,
      classify
    });
    stream.emitData(pcmChunk(4000));
    const result = await probe;

    expect(result).to.include({ kind: "unknown", cause: "ML-TIMEOUT" });
    expect(classify).to.have.been.calledOnce;
    expect(Date.now() - startedAt).to.be.lessThan(1000);
  });

  it("returns unknown/ML-TIMEOUT within the deadline when no audio arrives", async function () {
    // The 120 ms deadline fires well before the 5 s probe window would, so
    // this is a timeout, not a "probe window closed with nothing" case (see
    // the ML-NO-AUDIO test below for that one).
    const classify = sandbox
      .stub()
      .resolves({ status: AmdStatus.HUMAN, confidence: 1, detector: "d" });
    const stream = fakeAudioStream();
    const startedAt = Date.now();

    const result = await runProbe({
      stream: stream as unknown as AudioStream,
      probeMs: 5000,
      timeoutMs: 120,
      classify
    });

    expect(result).to.include({ kind: "unknown", cause: "ML-TIMEOUT" });
    expect(Date.now() - startedAt).to.be.lessThan(1000);
    expect(classify).to.not.have.been.called;
  });

  it("returns unknown/ML-NO-AUDIO when the stream closes empty before the deadline", async function () {
    const classify = sandbox
      .stub()
      .resolves({ status: AmdStatus.HUMAN, confidence: 1, detector: "d" });
    const stream = fakeAudioStream();

    const probe = runProbe({
      stream: stream as unknown as AudioStream,
      probeMs: 5000,
      timeoutMs: 2000,
      classify
    });
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

    const probe = runProbe({
      stream: stream as unknown as AudioStream,
      probeMs: 60,
      timeoutMs: 1000,
      classify
    });
    stream.emitData(pcmChunk(640)); // 20 ms, less than a full probe window
    const result = await probe;

    expect(classify).to.have.been.calledOnce;
    expect(result).to.include({ kind: "classified", status: AmdStatus.HUMAN });
  });

  it("resolves via onClose when the stream ends before the probe window fills", async function () {
    const classify = sandbox
      .stub()
      .resolves({ status: AmdStatus.HUMAN, confidence: 1, detector: "d" });
    const stream = fakeAudioStream();

    const probe = runProbe({
      stream: stream as unknown as AudioStream,
      probeMs: 5000,
      timeoutMs: 2000,
      classify
    });
    stream.emitData(pcmChunk(640));
    stream.emitClose();
    const result = await probe;

    expect(classify).to.have.been.calledOnce;
    expect(result).to.include({ kind: "classified", status: AmdStatus.HUMAN });
  });
});
