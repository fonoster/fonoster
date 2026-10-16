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
import { Stream } from "stream";
import { expect } from "chai";
import { createSandbox } from "sinon";
import {
  AudioFilterChain,
  createAudioFilterChain
} from "../../src/voice/filters";
import { transcribeOnConnection } from "../../src/voice/transcribeOnConnection";

const sandbox = createSandbox();

// Stands in for the AudioSocket stream: captures the data callback so a test
// can push frames the way Asterisk would
function getAudioStream() {
  let onData: (data: Buffer) => void = () => {};

  const stream = {
    onData(cb: (data: Buffer) => void) {
      onData = cb;
      return stream;
    },
    onError() {
      return stream;
    }
  };

  return { stream, push: (data: Buffer) => onData(data) };
}

function collect(target: Stream) {
  const received: Buffer[] = [];
  target.on("data", (data: Buffer) => received.push(data));
  return received;
}

function frameOf(value: number, samples = 4) {
  const frame = Buffer.alloc(samples * 2);
  Array.from({ length: samples }).forEach((_, i) =>
    frame.writeInt16LE(value, i * 2)
  );
  return frame;
}

describe("@voice/transcribeOnConnection", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should pass audio through untouched when there are no filters", async function () {
    // Arrange
    const target = new Stream();
    const received = collect(target);
    const { stream, push } = getAudioStream();
    await transcribeOnConnection(target)(null, stream as never);
    const frame = frameOf(1000);

    // Act
    push(frame);

    // Assert: the very same buffer, not a copy
    expect(received).to.have.lengthOf(1);
    expect(received[0]).to.equal(frame);
  });

  it("should emit filtered audio when the session has a chain", async function () {
    // Arrange
    const chain = createAudioFilterChain([
      {
        name: "half",
        delayMs: 0,
        process: (samples) => samples.map((sample) => sample / 2)
      }
    ]);
    const target = new Stream();
    const received = collect(target);
    const { stream, push } = getAudioStream();
    await transcribeOnConnection(target, () => chain)(null, stream as never);

    // Act
    push(frameOf(1000));
    await new Promise((resolve) => setImmediate(resolve));

    // Assert
    expect(received).to.have.lengthOf(1);
    expect(received[0].readInt16LE(0)).to.equal(500);
  });

  it("should keep frames in order", async function () {
    // Arrange
    const chain = createAudioFilterChain([
      {
        name: "slow",
        delayMs: 0,
        process: (samples) =>
          new Promise((resolve) =>
            setTimeout(() => resolve(samples), Math.random() * 5)
          )
      }
    ]);
    const target = new Stream();
    const received = collect(target);
    const { stream, push } = getAudioStream();
    await transcribeOnConnection(target, () => chain)(null, stream as never);

    // Act
    Array.from({ length: 10 }).forEach((_, i) => push(frameOf(i + 1)));
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Assert
    expect(received.map((frame) => frame.readInt16LE(0))).to.deep.equal(
      Array.from({ length: 10 }, (_, i) => i + 1)
    );
  });

  it("should fall back to raw audio if the chain rejects", async function () {
    // Arrange
    const chain = {
      process: () => Promise.reject(new Error("boom"))
    } as unknown as AudioFilterChain;
    const target = new Stream();
    const received = collect(target);
    const { stream, push } = getAudioStream();
    await transcribeOnConnection(target, () => chain)(null, stream as never);
    const frame = frameOf(1234);

    // Act
    push(frame);
    await new Promise((resolve) => setImmediate(resolve));

    // Assert
    expect(received).to.deep.equal([frame]);
  });

  it("should not emit a frame twice when a consumer throws", async function () {
    // Arrange: a listener that throws, like an STT write after close
    const chain = createAudioFilterChain([
      { name: "passthrough", delayMs: 0, process: (samples) => samples }
    ]);
    const target = new Stream();
    const seen: number[] = [];
    target.on("data", (data: Buffer) => {
      seen.push(data.readInt16LE(0));
      throw new Error("consumer blew up");
    });
    const { stream, push } = getAudioStream();
    await transcribeOnConnection(target, () => chain)(null, stream as never);

    // Act
    push(frameOf(4321));
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Assert: exactly one delivery, and no unhandled rejection
    expect(seen).to.deep.equal([4321]);
  });

  it("should keep order when the filters are cleared mid-call", async function () {
    // Arrange: frame 1 is still inside the chain when the filters go away
    let release: () => void = () => {};
    let chain: AudioFilterChain | null = createAudioFilterChain([
      {
        name: "slow",
        delayMs: 0,
        process: (samples) =>
          new Promise((resolve) => (release = () => resolve(samples)))
      }
    ]);
    const target = new Stream();
    const received = collect(target);
    const { stream, push } = getAudioStream();
    await transcribeOnConnection(target, () => chain)(null, stream as never);

    // Act
    push(frameOf(1));
    chain = null;
    push(frameOf(2));
    release();
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Assert: 2 must not overtake 1 on the now-unfiltered path
    expect(received.map((frame) => frame.readInt16LE(0))).to.deep.equal([1, 2]);
  });

  it("should skip the filters when they fall behind real time", async function () {
    // Arrange: a chain that never finishes a frame
    const chain = createAudioFilterChain([
      {
        name: "stuck",
        delayMs: 0,
        process: () => new Promise<Int16Array>(() => {})
      }
    ]);
    const target = new Stream();
    const received = collect(target);
    const { stream, push } = getAudioStream();
    await transcribeOnConnection(target, () => chain)(null, stream as never);

    // Act: well past the in-flight cap
    Array.from({ length: 120 }).forEach((_, i) => push(frameOf(i + 1)));
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Assert: audio keeps flowing instead of queueing without bound
    expect(received.length).to.be.greaterThan(0);
  });

  it("should follow the session's current chain", async function () {
    // Arrange
    let chain: AudioFilterChain | null = null;
    const target = new Stream();
    const received = collect(target);
    const { stream, push } = getAudioStream();
    await transcribeOnConnection(target, () => chain)(null, stream as never);

    // Act: unfiltered, then filtered after the application sets a chain
    push(frameOf(1000));
    chain = createAudioFilterChain([
      {
        name: "mute",
        delayMs: 0,
        process: (samples) => samples.map(() => 0)
      }
    ]);
    push(frameOf(1000));
    await new Promise((resolve) => setImmediate(resolve));

    // Assert
    expect(received.map((frame) => frame.readInt16LE(0))).to.deep.equal([
      1000, 0
    ]);
  });
});
