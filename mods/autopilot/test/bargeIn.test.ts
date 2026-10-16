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

const flush = () => new Promise((resolve) => setImmediate(resolve));

// Same deferred playback harness as the idle timeout suite: voice.say only
// resolves when the test says so, which keeps the assistant "mid-sentence"
// for as long as the test needs.
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
  return { say, finishPlayback };
};

const getActorInput = (allowUserBargeIn: boolean) => {
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
      allowUserBargeIn,
      idleOptions: {
        message: IDLE_MESSAGE,
        timeout: IDLE_TIMEOUT,
        maxTimeoutCount: 3
      },
      vad: {
        activationThreshold: 0.3,
        deactivationThreshold: 0.2,
        debounceFrames: 3
      }
    }
  };
};

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

// Move an actor to "announcingIdleTimeout" with the idle message playing.
const reachIdleAnnouncement = async (
  input: ReturnType<typeof getActorInput>,
  advance: (ms: number) => Promise<void>
) => {
  await input.deferred.finishPlayback();
  await advance(IDLE_TIMEOUT);
};

describe("@autopilot/machine barge-in", function () {
  afterEach(() => sandbox.restore());

  it("does not cut the greeting short when barge-in is disabled", async function () {
    // Arrange
    const input = getActorInput(false);
    const { actor } = await startActor(input);
    expect(actor.getSnapshot().value).to.equal("greeting");

    // Act
    actor.send({ type: "SPEECH_START" });
    await flush();

    // Assert
    expect(actor.getSnapshot().value).to.equal("greeting");
    expect(input.voice.stopSpeech).to.not.have.been.called;

    await input.deferred.finishPlayback();
    expect(actor.getSnapshot().value).to.equal("idle");

    actor.stop();
  });

  it("does not cut the idle message short when barge-in is disabled", async function () {
    // Arrange
    const input = getActorInput(false);
    const { actor, advance } = await startActor(input);
    await reachIdleAnnouncement(input, advance);
    expect(actor.getSnapshot().value).to.equal("announcingIdleTimeout");

    // Act
    actor.send({ type: "SPEECH_START" });
    await flush();

    // Assert
    expect(actor.getSnapshot().value).to.equal("announcingIdleTimeout");
    expect(input.voice.stopSpeech).to.not.have.been.called;

    await input.deferred.finishPlayback();
    expect(actor.getSnapshot().value).to.equal("idle");

    actor.stop();
  });

  it("still processes speech produced during the greeting once it finishes", async function () {
    // Arrange
    const input = getActorInput(false);
    const { actor, advance } = await startActor(input);

    // Act: the caller answers over the greeting
    actor.send({ type: "SPEECH_START" });
    actor.send({ type: "SPEECH_RESULT", speech: "Hello", responseTime: 100 });
    await flush();
    expect(actor.getSnapshot().value).to.equal("greeting");

    await input.deferred.finishPlayback();

    // Assert
    expect(actor.getSnapshot().value).to.equal("waitingForSpeechTimeout");
    expect(actor.getSnapshot().context.speechBuffer).to.equal("Hello");

    await advance(MAX_SPEECH_WAIT_TIMEOUT);
    expect(actor.getSnapshot().value).to.equal("processingUserRequest");
    expect(input.languageModel.invoke).to.have.been.calledOnce;
    expect(input.deferred.say).to.have.been.calledWith(ASSISTANT_RESPONSE);

    actor.stop();
  });

  it("still processes speech produced during the idle message once it finishes", async function () {
    // Arrange
    const input = getActorInput(false);
    const { actor, advance } = await startActor(input);
    await reachIdleAnnouncement(input, advance);
    expect(actor.getSnapshot().value).to.equal("announcingIdleTimeout");

    // Act
    actor.send({ type: "SPEECH_START" });
    actor.send({
      type: "SPEECH_RESULT",
      speech: "Yes, I am here",
      responseTime: 100
    });
    await flush();
    expect(actor.getSnapshot().value).to.equal("announcingIdleTimeout");

    await input.deferred.finishPlayback();

    // Assert
    expect(actor.getSnapshot().value).to.equal("waitingForSpeechTimeout");
    expect(actor.getSnapshot().context.speechBuffer).to.equal("Yes, I am here");

    await advance(MAX_SPEECH_WAIT_TIMEOUT);
    expect(actor.getSnapshot().value).to.equal("processingUserRequest");
    expect(input.languageModel.invoke).to.have.been.calledOnce;

    actor.stop();
  });

  it("processes a speech result that lands just after playback ended", async function () {
    // Arrange: the VAD start event was consumed while the greeting played, so
    // the machine is already in "idle" when the transcript arrives.
    const input = getActorInput(false);
    const { actor, advance } = await startActor(input);
    await input.deferred.finishPlayback();
    expect(actor.getSnapshot().value).to.equal("idle");

    // Act
    actor.send({ type: "SPEECH_RESULT", speech: "Hello", responseTime: 100 });
    await flush();

    // Assert
    expect(actor.getSnapshot().value).to.equal("waitingForSpeechTimeout");
    expect(actor.getSnapshot().context.speechBuffer).to.equal("Hello");

    await advance(MAX_SPEECH_WAIT_TIMEOUT);
    expect(actor.getSnapshot().value).to.equal("processingUserRequest");
    expect(input.languageModel.invoke).to.have.been.calledOnce;

    actor.stop();
  });

  it("keeps cutting the greeting and the idle message short when barge-in is enabled", async function () {
    // Arrange
    const input = getActorInput(true);
    const { actor, advance } = await startActor(input);

    // Act and assert: the greeting is interrupted
    actor.send({ type: "SPEECH_START" });
    await flush();
    expect(actor.getSnapshot().value).to.equal("listeningToUser");
    expect(input.voice.stopSpeech).to.have.been.calledOnce;

    // Act and assert: so is the idle message
    await advance(IDLE_TIMEOUT);
    expect(actor.getSnapshot().value).to.equal("announcingIdleTimeout");
    actor.send({ type: "SPEECH_START" });
    await flush();
    expect(actor.getSnapshot().value).to.equal("listeningToUser");
    expect(input.voice.stopSpeech).to.have.been.calledTwice;
    expect(input.deferred.say).to.have.been.calledWith(IDLE_MESSAGE);

    actor.stop();
  });
});
