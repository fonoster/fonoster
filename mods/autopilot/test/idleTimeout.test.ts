/* eslint-disable no-invalid-this */
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
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { createActor, SimulatedClock } from "xstate";
import { LanguageModel } from "../src/models";
import { Voice } from "../src/voice";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const FIRST_MESSAGE = "Welcome message";
const GOODBYE_MESSAGE = "Goodbye message";
const IDLE_MESSAGE = "Idle message";
const ASSISTANT_RESPONSE = "Assistant response";
const IDLE_TIMEOUT = 4500;
const MAX_SPEECH_WAIT_TIMEOUT = 500;

// Let the machine drain microtasks (promise actors resolve asynchronously)
const flush = () => new Promise((resolve) => setImmediate(resolve));

// Every call to voice.say returns a promise that only resolves when the test
// calls finishPlayback(). This models the real Voice API, where say resolves
// once the audio has been fully played, and lets the test hold the assistant
// "mid-sentence" for as long as it wants.
const createDeferredSay = () => {
  const pending: Array<() => void> = [];
  const say = sandbox
    .stub()
    .callsFake(() => new Promise<void>((resolve) => pending.push(resolve)));
  const finishPlayback = async () => {
    const resolve = pending.shift();
    if (!resolve) throw new Error("no playback in progress");
    resolve();
    await flush();
  };
  return { say, finishPlayback, pendingPlaybacks: () => pending.length };
};

const getActorInput = (overrides: { maxTimeoutCount?: number } = {}) => {
  const deferred = createDeferredSay();

  return {
    deferred,
    languageModel: {
      invoke: sandbox.stub().resolves({
        type: "say",
        content: ASSISTANT_RESPONSE
      })
    } as unknown as LanguageModel,
    voice: {
      mediaSessionRef: "mediaSessionRef",
      answer: sandbox.stub().resolves(),
      sgather: sandbox.stub().resolves({
        stop: sandbox.stub().resolves(),
        onData: sandbox.stub()
      }),
      stream: sandbox.stub().resolves({
        stop: sandbox.stub().resolves(),
        onData: sandbox.stub()
      }),
      playDtmf: sandbox.stub().resolves(),
      stopSpeech: sandbox.stub().resolves(),
      say: deferred.say,
      hangup: sandbox.stub().resolves()
    } as unknown as Voice,
    conversationSettings: {
      firstMessage: FIRST_MESSAGE,
      goodbyeMessage: GOODBYE_MESSAGE,
      systemPrompt: "System template",
      systemErrorMessage: "System error message",
      maxSpeechWaitTimeout: MAX_SPEECH_WAIT_TIMEOUT,
      maxSessionDuration: 30 * 60 * 1000,
      allowUserBargeIn: true,
      idleOptions: {
        message: IDLE_MESSAGE,
        timeout: IDLE_TIMEOUT,
        maxTimeoutCount: overrides.maxTimeoutCount ?? 2
      },
      vad: {
        activationThreshold: 0.3,
        deactivationThreshold: 0.2,
        debounceFrames: 3
      }
    }
  };
};

const sayCallsWith = (say: sinon.SinonStub, text: string) =>
  say.getCalls().filter((call) => call.args[0] === text).length;

// Drives the machine with a simulated clock, so the only way time advances is
// clock.increment(). If the idle clock were still running while the assistant
// speaks, these tests would observe extra idle announcements (or a hangup)
// while a say() is still pending.
const startActor = async (input: ReturnType<typeof getActorInput>) => {
  const { machine } = await import("../src/machine");
  const clock = new SimulatedClock();
  const actor = createActor(machine, {
    clock,
    input: {
      voice: input.voice,
      languageModel: input.languageModel,
      conversationSettings: input.conversationSettings
    }
  });
  actor.start();
  await flush();
  const advance = async (ms: number) => {
    clock.increment(ms);
    await flush();
  };
  return { actor, advance };
};

describe("@autopilot/machine idle timeout", function () {
  afterEach(() => sandbox.restore());

  it("does not start the idle clock until the greeting has finished playing", async function () {
    // Arrange
    const input = getActorInput();
    const { actor, advance } = await startActor(input);

    expect(actor.getSnapshot().value).to.equal("greeting");
    expect(input.deferred.say).to.have.been.calledOnceWith(FIRST_MESSAGE);

    // Act: the greeting is still playing; advance far beyond the idle timeout
    await advance(IDLE_TIMEOUT * 10);

    // Assert: nothing idle-related may have happened
    expect(actor.getSnapshot().value).to.equal("greeting");
    expect(sayCallsWith(input.deferred.say, IDLE_MESSAGE)).to.equal(0);
    expect(input.voice.hangup).to.not.have.been.called;

    // Act: the greeting finishes; the idle clock starts now
    await input.deferred.finishPlayback();
    expect(actor.getSnapshot().value).to.equal("idle");

    await advance(IDLE_TIMEOUT - 1);
    expect(sayCallsWith(input.deferred.say, IDLE_MESSAGE)).to.equal(0);

    await advance(1);
    expect(sayCallsWith(input.deferred.say, IDLE_MESSAGE)).to.equal(1);
    expect(actor.getSnapshot().value).to.equal("announcingIdleTimeout");
    expect(actor.getSnapshot().context.idleTimeoutCount).to.equal(1);

    actor.stop();
  });

  it("does not run the idle clock while the idle message is playing (no back-to-back announcements)", async function () {
    // Arrange: get to the first idle announcement
    const input = getActorInput();
    const { actor, advance } = await startActor(input);
    await input.deferred.finishPlayback(); // greeting done
    await advance(IDLE_TIMEOUT);
    expect(sayCallsWith(input.deferred.say, IDLE_MESSAGE)).to.equal(1);
    expect(actor.getSnapshot().value).to.equal("announcingIdleTimeout");

    // Act: the idle message is still playing; advance far beyond the timeout
    await advance(IDLE_TIMEOUT * 10);

    // Assert: no second announcement, no hangup, count unchanged
    expect(sayCallsWith(input.deferred.say, IDLE_MESSAGE)).to.equal(1);
    expect(sayCallsWith(input.deferred.say, GOODBYE_MESSAGE)).to.equal(0);
    expect(input.voice.hangup).to.not.have.been.called;
    expect(actor.getSnapshot().value).to.equal("announcingIdleTimeout");
    expect(actor.getSnapshot().context.idleTimeoutCount).to.equal(1);

    // Act: the idle message finishes; only now does a fresh idle period start
    await input.deferred.finishPlayback();
    expect(actor.getSnapshot().value).to.equal("idle");

    await advance(IDLE_TIMEOUT - 1);
    expect(sayCallsWith(input.deferred.say, IDLE_MESSAGE)).to.equal(1);

    await advance(1);
    expect(sayCallsWith(input.deferred.say, IDLE_MESSAGE)).to.equal(2);
    expect(actor.getSnapshot().context.idleTimeoutCount).to.equal(2);

    actor.stop();
  });

  it("hangs up only after maxTimeoutCount silent periods, each measured after the assistant stops talking", async function () {
    // Arrange
    const input = getActorInput({ maxTimeoutCount: 2 });
    const { actor, advance } = await startActor(input);
    await input.deferred.finishPlayback(); // greeting done

    // Act: two full idle periods, each followed by the idle message playing
    for (let i = 1; i <= 2; i++) {
      await advance(IDLE_TIMEOUT);
      expect(sayCallsWith(input.deferred.say, IDLE_MESSAGE)).to.equal(i);
      expect(actor.getSnapshot().value).to.equal("announcingIdleTimeout");
      await input.deferred.finishPlayback();
      expect(actor.getSnapshot().value).to.equal("idle");
      expect(input.voice.hangup).to.not.have.been.called;
    }

    // One more silent period exceeds maxTimeoutCount
    await advance(IDLE_TIMEOUT - 1);
    expect(sayCallsWith(input.deferred.say, GOODBYE_MESSAGE)).to.equal(0);

    await advance(1);

    // Assert
    expect(actor.getSnapshot().value).to.equal("hangup");
    expect(actor.getSnapshot().context.idleTimeoutCount).to.equal(2);
    expect(sayCallsWith(input.deferred.say, IDLE_MESSAGE)).to.equal(2);
    expect(sayCallsWith(input.deferred.say, GOODBYE_MESSAGE)).to.equal(1);
    await input.deferred.finishPlayback(); // goodbye done
    expect(input.voice.hangup).to.have.been.calledOnce;

    actor.stop();
  });

  it("starts the idle clock only after the assistant's response has finished playing", async function () {
    // Arrange: complete a conversational turn
    const input = getActorInput();
    const { actor, advance } = await startActor(input);
    await input.deferred.finishPlayback(); // greeting done

    actor.send({ type: "SPEECH_START" });
    actor.send({ type: "SPEECH_RESULT", speech: "Hello", responseTime: 100 });
    await advance(MAX_SPEECH_WAIT_TIMEOUT);
    expect(actor.getSnapshot().value).to.equal("processingUserRequest");
    expect(input.deferred.say).to.have.been.calledWith(ASSISTANT_RESPONSE);

    // Act: the response is still playing; advance far beyond the idle timeout
    await advance(IDLE_TIMEOUT * 10);

    // Assert: still processing, no idle announcement
    expect(actor.getSnapshot().value).to.equal("processingUserRequest");
    expect(sayCallsWith(input.deferred.say, IDLE_MESSAGE)).to.equal(0);

    // Act: the response finishes; the idle clock starts now
    await input.deferred.finishPlayback();
    expect(actor.getSnapshot().value).to.equal("listeningToUser");

    await advance(IDLE_TIMEOUT - 1);
    expect(sayCallsWith(input.deferred.say, IDLE_MESSAGE)).to.equal(0);

    await advance(1);
    expect(sayCallsWith(input.deferred.say, IDLE_MESSAGE)).to.equal(1);
    expect(actor.getSnapshot().value).to.equal("announcingIdleTimeout");

    actor.stop();
  });

  it("interrupts the idle message and resets the count when the user speaks", async function () {
    // Arrange: get to the first idle announcement
    const input = getActorInput();
    const { actor, advance } = await startActor(input);
    await input.deferred.finishPlayback(); // greeting done
    await advance(IDLE_TIMEOUT);
    expect(actor.getSnapshot().value).to.equal("announcingIdleTimeout");
    expect(actor.getSnapshot().context.idleTimeoutCount).to.equal(1);

    // Act
    actor.send({ type: "SPEECH_START" });
    await flush();

    // Assert
    expect(actor.getSnapshot().value).to.equal("listeningToUser");
    expect(actor.getSnapshot().context.idleTimeoutCount).to.equal(0);
    expect(input.voice.stopSpeech).to.have.been.calledOnce;

    // The abandoned playback finishing later must not affect the machine
    await input.deferred.finishPlayback();
    expect(actor.getSnapshot().value).to.equal("listeningToUser");

    actor.stop();
  });

  it("recovers and keeps counting when the idle message fails to play", async function () {
    // Arrange
    const input = getActorInput();
    const { actor, advance } = await startActor(input);
    await input.deferred.finishPlayback(); // greeting done

    input.deferred.say.callsFake((text: string) =>
      text === IDLE_MESSAGE
        ? Promise.reject(new Error("tts failure"))
        : new Promise<void>(() => {})
    );

    // Act
    await advance(IDLE_TIMEOUT);

    // Assert: back to idle with the count kept, and the clock keeps running
    expect(actor.getSnapshot().value).to.equal("idle");
    expect(actor.getSnapshot().context.idleTimeoutCount).to.equal(1);

    await advance(IDLE_TIMEOUT);
    expect(actor.getSnapshot().value).to.equal("idle");
    expect(actor.getSnapshot().context.idleTimeoutCount).to.equal(2);

    await advance(IDLE_TIMEOUT);
    expect(actor.getSnapshot().value).to.equal("hangup");
    expect(sayCallsWith(input.deferred.say, GOODBYE_MESSAGE)).to.equal(1);

    actor.stop();
  });
});
