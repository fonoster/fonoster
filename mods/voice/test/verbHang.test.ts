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
import { EventEmitter } from "events";
import { StreamEvent, VoiceSessionStreamServer } from "@fonoster/common";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { voiceRequest } from "./helpers";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Reports how a promise settled, or "pending" if it never did. A verb that hangs
 * forever would otherwise surface as an opaque mocha timeout; this makes the failure
 * message say exactly what went wrong.
 */
async function settleWithin(promise: Promise<unknown>, ms: number) {
  return Promise.race([
    promise.then(
      () => "resolved" as const,
      () => "rejected" as const
    ),
    delay(ms).then(() => "pending" as const)
  ]);
}

/**
 * An EventEmitter-backed stand-in for the gRPC session stream, so the test can end or
 * fail the stream the way the transport does. `fire` refuses to emit an ERROR nobody
 * is listening for: a bare EventEmitter throws in that case, which would mask the
 * behaviour under test behind an unrelated exception.
 */
function createStreamFake() {
  const emitter = new EventEmitter();
  const stream = {
    on: (event: string, cb: (...args: unknown[]) => void) => emitter.on(event, cb),
    once: (event: string, cb: (...args: unknown[]) => void) =>
      emitter.once(event, cb),
    removeListener: (event: string, cb: (...args: unknown[]) => void) =>
      emitter.removeListener(event, cb),
    write: sandbox.stub(),
    end: sandbox.stub()
  };
  return {
    stream: stream as unknown as VoiceSessionStreamServer,
    fire: (event: StreamEvent, payload?: unknown) => {
      if (emitter.listenerCount(event) === 0) return false;
      return emitter.emit(event, payload);
    },
    listenerCount: (event: StreamEvent) => emitter.listenerCount(event)
  };
}

describe("@voice/verbs/stream termination", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("resolves when the matching response arrives (CONTROL)", async function () {
    const voice = createStreamFake();
    const { Answer } = await import("../src/verbs");
    const answer = new Answer(voiceRequest, voice.stream);

    const running = answer.run();
    voice.fire(StreamEvent.DATA, { content: "answerResponse" });

    expect(await settleWithin(running, 300)).to.equal("resolved");
  });

  it("REGRESSION: rejects when the session ends before the response arrives", async function () {
    // The caller hangs up mid-verb. Verb.run() resolves only from its DATA listener
    // and rejects only from the synchronous try/catch, so the promise is abandoned:
    // never resolved, never rejected. The application awaits it forever, which is why
    // a dropped call leaves a gestión stuck instead of failing.
    const voice = createStreamFake();
    const { Answer } = await import("../src/verbs");
    const answer = new Answer(voiceRequest, voice.stream);

    const running = answer.run();
    voice.fire(StreamEvent.END);

    expect(await settleWithin(running, 300)).to.equal("rejected");
  });

  it("REGRESSION: rejects when the session errors before the response arrives", async function () {
    const voice = createStreamFake();
    const { Answer } = await import("../src/verbs");
    const answer = new Answer(voiceRequest, voice.stream);

    const running = answer.run();
    voice.fire(StreamEvent.ERROR, new Error("stream failed"));

    expect(await settleWithin(running, 300)).to.equal("rejected");
  });

  it("REGRESSION: removes its listeners when the session ends", async function () {
    // The resolve path removes the DATA listener; no other path does. Every dropped
    // call therefore leaks a listener and the closure it holds.
    const voice = createStreamFake();
    const { Answer } = await import("../src/verbs");
    const answer = new Answer(voiceRequest, voice.stream);

    const running = answer.run();
    expect(voice.listenerCount(StreamEvent.DATA)).to.equal(1);

    voice.fire(StreamEvent.END);
    await settleWithin(running, 300);

    expect(voice.listenerCount(StreamEvent.DATA)).to.equal(0);
  });

  it("REGRESSION: a rejecting handler must not escape as an unhandled rejection", async function () {
    // createSession awaits the handler inside an async `once` callback. EventEmitter
    // ignores the returned promise, so a handler that throws — which is exactly what a
    // verb rejecting on stream end now causes — becomes an unhandled rejection and
    // takes the whole process down under Node's default policy.
    const voice = createStreamFake();
    const { createSession } = await import("../src/createSession");

    const escaped: unknown[] = [];
    const onUnhandled = (reason: unknown) => escaped.push(reason);
    process.on("unhandledRejection", onUnhandled);

    try {
      const session = createSession(async () => {
        throw new Error("verb failed because the session ended");
      })(voice.stream);

      voice.fire(StreamEvent.DATA, { request: voiceRequest });
      const outcome = await settleWithin(session, 300);

      expect(escaped, "handler rejection escaped the session").to.be.empty;
      expect(outcome, "session promise never settled").to.not.equal("pending");
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }
  });
});
