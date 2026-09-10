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
import { Stream } from "stream";
import { AmdStatus } from "@fonoster/common";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { runAmdProbe } from "../../../src/voice/amd/runAmdProbe";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

// 100 ms of slin16 @ 16 kHz mono = 0.1 * 16000 * 2 = 3200 bytes
const pcmChunk = (bytes: number) => Buffer.alloc(bytes, 1);

describe("@voice/amd/runAmdProbe", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("returns the classifier verdict when confidence clears the threshold", async function () {
    const classify = sandbox.stub().resolves({
      status: AmdStatus.VOICEMAIL,
      confidence: 0.95,
      detector: "test-detector"
    });
    const audio = new Stream();

    const probe = runAmdProbe({
      audio,
      probeMs: 100,
      timeoutMs: 1000,
      minConfidence: 0.8,
      classify
    });
    audio.emit("data", pcmChunk(4000));
    const result = await probe;

    expect(result.status).to.equal(AmdStatus.VOICEMAIL);
    expect(result.confidence).to.equal(0.95);
    expect(result.detector).to.equal("test-detector");
    expect(result.latencyMs).to.be.a("number");
    expect(classify).to.have.been.calledOnce;
    expect(audio.listenerCount("data")).to.equal(0);
  });

  it("downgrades a low-confidence verdict to UNKNOWN but keeps the score", async function () {
    const classify = sandbox
      .stub()
      .resolves({ status: AmdStatus.VOICEMAIL, confidence: 0.42, detector: "d" });
    const audio = new Stream();

    const probe = runAmdProbe({
      audio,
      probeMs: 100,
      timeoutMs: 1000,
      minConfidence: 0.8,
      classify
    });
    audio.emit("data", pcmChunk(4000));
    const result = await probe;

    expect(result.status).to.equal(AmdStatus.UNKNOWN);
    expect(result.confidence).to.equal(0.42);
    expect(result.detector).to.equal("d");
  });

  it("fails open to UNKNOWN when the classifier throws", async function () {
    const classify = sandbox.stub().rejects(new Error("model load failed"));
    const audio = new Stream();

    const probe = runAmdProbe({
      audio,
      probeMs: 100,
      timeoutMs: 1000,
      minConfidence: 0.8,
      classify
    });
    audio.emit("data", pcmChunk(4000));
    const result = await probe;

    expect(result.status).to.equal(AmdStatus.UNKNOWN);
    expect(result.confidence).to.equal(0);
    expect(audio.listenerCount("data")).to.equal(0);
  });

  it("returns UNKNOWN when classification outlasts the deadline", async function () {
    // classify never resolves within the deadline (simulates a cold model load
    // or a hung inference).
    const classify = sandbox
      .stub()
      .returns(new Promise(() => undefined) as Promise<never>);
    const audio = new Stream();
    const startedAt = Date.now();

    const probe = runAmdProbe({
      audio,
      probeMs: 40,
      timeoutMs: 150,
      minConfidence: 0.8,
      classify
    });
    audio.emit("data", pcmChunk(4000));
    const result = await probe;

    expect(result.status).to.equal(AmdStatus.UNKNOWN);
    expect(classify).to.have.been.calledOnce;
    expect(Date.now() - startedAt).to.be.lessThan(1000);
    expect(audio.listenerCount("data")).to.equal(0);
  });

  it("returns UNKNOWN within the deadline when no audio arrives", async function () {
    const classify = sandbox
      .stub()
      .resolves({ status: AmdStatus.HUMAN, confidence: 1, detector: "d" });
    const audio = new Stream();
    const startedAt = Date.now();

    const result = await runAmdProbe({
      audio,
      probeMs: 5000,
      timeoutMs: 120,
      minConfidence: 0.8,
      classify
    });

    expect(result.status).to.equal(AmdStatus.UNKNOWN);
    expect(Date.now() - startedAt).to.be.lessThan(1000);
    expect(classify).to.not.have.been.called;
    expect(audio.listenerCount("data")).to.equal(0);
  });

  it("classifies with a partial window when the probe timer fires first", async function () {
    const classify = sandbox
      .stub()
      .resolves({ status: AmdStatus.HUMAN, confidence: 0.9, detector: "d" });
    const audio = new Stream();

    const probe = runAmdProbe({
      audio,
      probeMs: 60,
      timeoutMs: 1000,
      minConfidence: 0.8,
      classify
    });
    audio.emit("data", pcmChunk(640)); // 20 ms, less than a full probe window
    const result = await probe;

    expect(classify).to.have.been.calledOnce;
    expect(result.status).to.equal(AmdStatus.HUMAN);
  });
});
