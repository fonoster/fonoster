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
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import {
  AudioFilter,
  createAudioFilterChain
} from "../../../src/voice/filters";

chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = createSandbox();

function mapFilter(name: string, fn: (s: number) => number): AudioFilter {
  return {
    name,
    delayMs: 0,
    process: (frame) => frame.map(fn)
  };
}

describe("@voice/filters/createAudioFilterChain", function () {
  afterEach(function () {
    sandbox.restore();
  });

  it("returns the input frame when there are no filters", async function () {
    // Arrange
    const chain = createAudioFilterChain([]);
    const frame = Int16Array.from([1, 2, 3]);

    // Act
    const output = await chain.process(frame);

    // Assert
    expect(output).to.equal(frame);
  });

  it("runs filters in the configured order", async function () {
    // Arrange
    const chain = createAudioFilterChain([
      mapFilter("addOne", (s) => s + 1),
      mapFilter("double", (s) => s * 2)
    ]);

    // Act
    const output = await chain.process(Int16Array.from([1, 5]));

    // Assert: (1 + 1) * 2 = 4, not 1 * 2 + 1 = 3
    expect(Array.from(output)).to.deep.equal([4, 12]);
  });

  it("keeps frame order when a filter is async and callers don't await", async function () {
    // Arrange
    const slow: AudioFilter = {
      name: "slow",
      delayMs: 0,
      process: (frame) =>
        new Promise((resolve) =>
          setTimeout(() => resolve(frame), Math.random() * 5)
        )
    };
    const chain = createAudioFilterChain([slow]);
    const completed: number[] = [];

    // Act
    const pending = Array.from({ length: 20 }, (_, i) =>
      chain.process(Int16Array.from([i])).then((out) => {
        completed.push(out[0]);
      })
    );
    await Promise.all(pending);

    // Assert
    expect(completed).to.deep.equal(Array.from({ length: 20 }, (_, i) => i));
  });

  it("passes the input through and disables a filter that throws", async function () {
    // Arrange
    const process = sandbox.stub().throws(new Error("boom"));
    const chain = createAudioFilterChain([
      { name: "broken", delayMs: 0, process },
      mapFilter("addOne", (s) => s + 1)
    ]);

    // Act
    const first = await chain.process(Int16Array.from([1]));
    const second = await chain.process(Int16Array.from([2]));

    // Assert
    expect(Array.from(first)).to.deep.equal([2]);
    expect(Array.from(second)).to.deep.equal([3]);
    expect(process).to.have.been.calledOnce;
    const stats = chain.getStats().filters[0];
    expect(stats.failures).to.equal(1);
    expect(stats.disabled).to.be.true;
    expect(stats.error).to.equal("boom");
  });

  it("disables a filter that rejects", async function () {
    // Arrange
    const chain = createAudioFilterChain([
      {
        name: "rejects",
        delayMs: 0,
        process: () => Promise.reject(new Error("async boom"))
      }
    ]);

    // Act
    const output = await chain.process(Int16Array.from([7]));

    // Assert
    expect(Array.from(output)).to.deep.equal([7]);
    expect(chain.getStats().filters[0].disabled).to.be.true;
  });

  it("disables a filter that changes the frame length", async function () {
    // Arrange
    const chain = createAudioFilterChain([
      {
        name: "truncates",
        delayMs: 0,
        process: (frame) => frame.slice(1)
      },
      mapFilter("addOne", (s) => s + 1)
    ]);

    // Act
    const output = await chain.process(Int16Array.from([1, 2, 3]));

    // Assert
    expect(Array.from(output)).to.deep.equal([2, 3, 4]);
    expect(chain.getStats().filters[0].disabled).to.be.true;
  });

  it("reports timing stats, delay and each filter's own stats", async function () {
    // Arrange
    const chain = createAudioFilterChain([
      {
        name: "counted",
        delayMs: 10,
        process: (frame) => frame,
        getStats: () => ({ custom: 42 })
      },
      { name: "other", delayMs: 30, process: (frame) => frame }
    ]);

    // Act
    await Promise.all(
      Array.from({ length: 50 }, () => chain.process(new Int16Array(320)))
    );

    // Assert
    const stats = chain.getStats();
    expect(stats.total.frames).to.equal(50);
    expect(stats.total.delayMs).to.equal(40);
    expect(stats.total.p50Ms).to.be.at.most(stats.total.p95Ms);
    expect(stats.total.p95Ms).to.be.at.most(stats.total.maxMs);
    expect(stats.filters[0]).to.include({
      name: "counted",
      frames: 50,
      failures: 0,
      disabled: false
    });
    expect(stats.filters[0].filter).to.deep.equal({ custom: 42 });
  });

  it("returns inspect values only for filters that support it", function () {
    // Arrange
    const chain = createAudioFilterChain([
      { name: "plain", delayMs: 0, process: (f) => f },
      {
        name: "inspectable",
        delayMs: 0,
        process: (f) => f,
        inspect: () => ({ gainDb: -3 })
      }
    ]);

    // Act & Assert
    expect(chain.inspect()).to.deep.equal({ inspectable: { gainDb: -3 } });
  });

  it("waits for filters to be ready and disables ones that fail to start", async function () {
    // Arrange
    const ready = sandbox.stub().resolves();
    const chain = createAudioFilterChain([
      { name: "slowStart", delayMs: 0, ready, process: (f) => f },
      {
        name: "brokenStart",
        delayMs: 0,
        ready: () => Promise.reject(new Error("no license")),
        process: (f) => f.map((s) => s + 1)
      }
    ]);

    // Act
    await chain.ready();
    const output = await chain.process(Int16Array.from([5]));

    // Assert
    expect(ready).to.have.been.calledOnce;
    expect(Array.from(output)).to.deep.equal([5]);
    expect(chain.getStats().filters[1].disabled).to.be.true;
  });

  it("closes every filter even if one throws on close", function () {
    // Arrange
    const closeA = sandbox.stub().throws(new Error("close failed"));
    const closeB = sandbox.stub();
    const chain = createAudioFilterChain([
      { name: "a", delayMs: 0, process: (f) => f, close: closeA },
      { name: "b", delayMs: 0, process: (f) => f, close: closeB }
    ]);

    // Act
    chain.close();

    // Assert
    expect(closeA).to.have.been.calledOnce;
    expect(closeB).to.have.been.calledOnce;
  });
});
