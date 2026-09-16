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
  AudioFilterChain,
  createAudioFilterSession
} from "../../../src/voice/filters";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const flush = () => new Promise((resolve) => setImmediate(resolve));

function fakeChain(
  overrides: {
    ready?: () => Promise<void>;
    disabled?: { name: string; error: string }[];
  } = {}
) {
  const close = sandbox.stub();
  const drain = sandbox.stub().resolves();
  const chain = {
    ready: overrides.ready ?? (() => Promise.resolve()),
    drain,
    process: sandbox.stub(),
    inspect: () => ({}),
    close,
    getStats: () => ({
      total: { frames: 3, p50Ms: 0, p95Ms: 0, maxMs: 0, delayMs: 30 },
      filters: (overrides.disabled ?? []).map((filter) => ({
        name: filter.name,
        delayMs: 0,
        frames: 0,
        p50Ms: 0,
        p95Ms: 0,
        maxMs: 0,
        failures: 1,
        disabled: true,
        error: filter.error,
        filter: {}
      }))
    })
  } as unknown as AudioFilterChain;

  return { chain, close, drain };
}

describe("@voice/filters/createAudioFilterSession", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("installs a chain the audio path can pick up", async function () {
    // Arrange
    const { chain } = fakeChain();
    const session = createAudioFilterSession({ createChain: () => chain });

    // Act
    await session.set([{ name: "aiCoustics" }]);

    // Assert
    expect(session.current()).to.equal(chain);
  });

  it("drains a replaced chain before closing it", async function () {
    // Arrange
    const first = fakeChain();
    const second = fakeChain();
    const chains = [first.chain, second.chain];
    const session = createAudioFilterSession({
      createChain: () => chains.shift()!
    });
    await session.set([{ name: "a" }]);

    // Act
    await session.set([{ name: "b" }]);
    await flush();

    // Assert: the new chain is live and the old one was drained, then closed
    expect(session.current()).to.equal(second.chain);
    expect(first.drain).to.have.been.calledBefore(first.close);
    expect(first.close).to.have.been.calledOnce;
    expect(second.close).to.not.have.been.called;
  });

  it("clears the filters on an empty list", async function () {
    // Arrange
    const { chain, close } = fakeChain();
    const session = createAudioFilterSession({ createChain: () => chain });
    await session.set([{ name: "aiCoustics" }]);

    // Act
    await session.set([]);
    await flush();

    // Assert
    expect(session.current()).to.be.null;
    expect(close).to.have.been.calledOnce;
  });

  it("reports filters that failed to start, and keeps them out of the call", async function () {
    // Arrange: ready() resolves even when a filter could not start
    const { chain, close } = fakeChain({
      disabled: [{ name: "aiCoustics", error: "license rejected" }]
    });
    const session = createAudioFilterSession({ createChain: () => chain });

    // Act & Assert
    await expect(session.set([{ name: "aiCoustics" }])).to.be.rejectedWith(
      /aiCoustics: license rejected/
    );
    expect(session.current()).to.be.null;
    expect(close).to.have.been.calledOnce;
  });

  it("keeps the previous filters when the new ones cannot start", async function () {
    // Arrange
    const good = fakeChain();
    const bad = fakeChain({
      disabled: [{ name: "nope", error: "model missing" }]
    });
    const chains = [good.chain, bad.chain];
    const session = createAudioFilterSession({
      createChain: () => chains.shift()!
    });
    await session.set([{ name: "a" }]);

    // Act
    await expect(session.set([{ name: "b" }])).to.be.rejected;

    // Assert
    expect(session.current()).to.equal(good.chain);
    expect(good.close).to.not.have.been.called;
  });

  it("closes a chain that becomes ready after the call ended", async function () {
    // Arrange: a slow model load, the caller hangs up meanwhile
    let finishReady: () => void = () => {};
    const { chain, close } = fakeChain({
      ready: () => new Promise<void>((resolve) => (finishReady = resolve))
    });
    const session = createAudioFilterSession({ createChain: () => chain });

    // Act
    const pending = session.set([{ name: "aiCoustics" }]);
    session.close();
    finishReady();
    await pending;

    // Assert: nothing installed on a dead session, and nothing left running
    expect(session.current()).to.be.null;
    expect(close).to.have.been.calledOnce;
  });

  it("ignores filters set after the session closed", async function () {
    // Arrange
    const createChain = sandbox.stub();
    const session = createAudioFilterSession({ createChain });
    session.close();

    // Act
    await session.set([{ name: "aiCoustics" }]);

    // Assert
    expect(createChain).to.not.have.been.called;
  });

  it("closes a chain that rejects while starting", async function () {
    // Arrange
    const { chain, close } = fakeChain({
      ready: () => Promise.reject(new Error("boom"))
    });
    const session = createAudioFilterSession({ createChain: () => chain });

    // Act & Assert
    await expect(session.set([{ name: "aiCoustics" }])).to.be.rejectedWith(
      /boom/
    );
    expect(close).to.have.been.calledOnce;
    expect(session.current()).to.be.null;
  });

  it("returns the stats of the chain it was running on close", async function () {
    // Arrange
    const { chain, drain, close } = fakeChain();
    const session = createAudioFilterSession({ createChain: () => chain });
    await session.set([{ name: "aiCoustics" }]);

    // Act
    const stats = session.close();
    await flush();

    // Assert
    expect(stats?.total.frames).to.equal(3);
    expect(drain).to.have.been.calledBefore(close);
    expect(session.current()).to.be.null;
  });

  it("returns no stats when the call never used filters", function () {
    const session = createAudioFilterSession({ createChain: sandbox.stub() });
    expect(session.close()).to.be.null;
  });
});
