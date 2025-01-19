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
import { createActor } from "xstate";
import { LanguageModel } from "../src/models";
import { Voice } from "../src/voice";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const waitFor = async (time: number) => new Promise((r) => setTimeout(r, time));

const FIRST_MESSAGE = "Welcome message";
const GOODBYE_MESSAGE = "Goodbye message";
const SYSTEM_ERROR_MESSAGE = "System error message";
const IDLE_MESSAGE = "Idle message";
const ASSISTANT_RESPONSE = "Assistant response";

const getActorInput = () => ({
  languageModel: {
    invoke: sandbox.stub().resolves({
      type: "say",
      content: ASSISTANT_RESPONSE
    })
  } as unknown as LanguageModel,
  voice: {
    sessionRef: "sessionRef",
    answer: sandbox.stub().resolves(),
    sgather: sandbox.stub().resolves({
      stop: sandbox.stub().resolves(),
      onData: sandbox.stub()
    }),
    stream: sandbox.stub().resolves({
      stop: sandbox.stub().resolves(),
      onData: sandbox.stub()
    }),
    stopSpeech: sandbox.stub().resolves(),
    say: sandbox.stub().resolves(),
    hangup: sandbox.stub().resolves()
  } as unknown as Voice,
  conversationSettings: {
    firstMessage: FIRST_MESSAGE,
    goodbyeMessage: GOODBYE_MESSAGE,
    systemTemplate: "System template",
    systemErrorMessage: SYSTEM_ERROR_MESSAGE,
    maxSpeechWaitTimeout: 5000,
    initialDtmf: "1",
    idleOptions: {
      message: IDLE_MESSAGE,
      timeout: 3000,
      maxTimeoutCount: 3
    },
    transferOptions: {
      phoneNumber: "+1234567890",
      message: "Transferring call"
    },
    vad: {
      activationThreshold: 0.3,
      deactivationThreshold: 0.2,
      debounceFrames: 3
    }
  }
});

describe("@autopilot/machine", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should say the first message then set the state to 'idle'", async function () {
    // Arrange
    const { machine } = await import("../src/machine");
    this.slow(30000);

    const input = getActorInput();
    const actor = createActor(machine, {
      input
    });

    // Act
    actor.start();

    await waitFor(500);

    // Assert
    const { context, value: state } = actor.getSnapshot();
    expect(state).to.equal("idle");
    expect(input.voice.answer).to.have.been.calledOnce;
    expect(input.voice.say).to.have.been.calledOnceWith(FIRST_MESSAGE);
    expect(input.voice.hangup).to.not.have.been.called;
    expect(context.firstMessage).to.equal(FIRST_MESSAGE);
    expect(context.goodbyeMessage).to.equal(GOODBYE_MESSAGE);
    expect(context.systemErrorMessage).to.equal(SYSTEM_ERROR_MESSAGE);
    expect(context.idleMessage).to.equal(IDLE_MESSAGE);
    expect(context.idleTimeout).to.equal(3000);
    expect(context.maxSpeechWaitTimeout).to.equal(5000);
    expect(context.transferMessage).to.equal("Transferring call");
    expect(context.transferPhoneNumber).to.equal("+1234567890");
    expect(context.maxIdleTimeoutCount).to.equal(3);
    expect(context.idleMessage).to.equal(IDLE_MESSAGE);
    expect(context.idleTimeout).to.equal(3000);
    expect(context.idleTimeoutCount).to.equal(0);
    expect(context.speechBuffer).to.equal("");
    expect(context.isSpeaking).to.equal(false);

    // Cleanup
    actor.stop();
  }).timeout(20000);

  it("should set the state to 'idle' and then 'updatingSpeech'", async function () {
    // Arrange
    const { machine } = await import("../src/machine");
    this.slow(30000);

    const input = getActorInput();
    const actor = createActor(machine, {
      input
    });

    // Act
    actor.start();
    actor.send({ type: "SPEECH_START" });

    // Assert
    const { context, value: state } = actor.getSnapshot();
    expect(state).to.equal("updatingSpeech");
    expect(context.speechBuffer).to.equal("");
    expect(context.idleTimeoutCount).to.equal(0);
    expect(context.isSpeaking).to.equal(true);
    expect(input.voice.stopSpeech).to.have.been.calledOnce;

    // Cleanup
    actor.stop();
  }).timeout(20000);

  it("should append the speech to the buffer and set the state to 'idle'", async function () {
    // Arrange
    const { machine } = await import("../src/machine");
    this.slow(30000);

    const input = getActorInput();
    const actor = createActor(machine, {
      input
    });

    // Act
    actor.start();

    await waitFor(50);

    actor.send({ type: "SPEECH_START" });
    actor.send({ type: "SPEECH_RESULT", speech: "Well, I personally think that" });
    actor.send({ type: "SPEECH_END" });

    await waitFor(50);

    actor.send({ type: "SPEECH_RESULT", speech: "the best way to learn is by doing" });

    await waitFor(50);

    // Assert
    const { context, value: state } = actor.getSnapshot();
    expect(state).to.equal("idle");
    expect(context.speechBuffer).to.equal("Well, I personally think that the best way to learn is by doing");
    expect(context.idleTimeoutCount).to.equal(0);
    expect(context.isSpeaking).to.equal(false);
    expect(input.voice.say).to.have.been.calledTwice;
    expect(input.voice.say).to.have.been.calledWith(ASSISTANT_RESPONSE);

    // Cleanup
    actor.stop();
  }).timeout(20000);

  it("from updatingSpeech call SPEECH_RESULT and wait to move to 'processingUserRequest'", async function () {
    // Arrange
    const { machine } = await import("../src/machine");
    this.slow(30000);

    const input = getActorInput();
    const actor = createActor(machine, {
      input
    });

    // Act
    actor.start();
    actor.send({ type: "SPEECH_START" });
    actor.send({ type: "SPEECH_RESULT", speech: "Hello" });
    actor.send({ type: "SPEECH_END" });

    // Goes to "processingUserRequest" then to "idle" because of MAX_SPEECH_WAIT_TIMEOUT
    await waitFor(6000);

    // // Assert
    const { context, value: state } = actor.getSnapshot();
    expect(state).to.equal("idle");
    expect(context.speechBuffer).to.equal("Hello");
    expect(context.idleTimeoutCount).to.equal(0);
    expect(context.isSpeaking).to.equal(false);
    expect(input.voice.say).to.have.been.calledTwice;
    expect(input.voice.say).to.have.been.calledWith(ASSISTANT_RESPONSE);

    // Cleanup
    actor.stop();
  }).timeout(20000);

  it("should timeout three times and then hangup", async function () {
    this.slow(30000);

    // Arrange
    const { machine } = await import("../src/machine");

    const input = getActorInput();
    const actor = createActor(machine, {
      input
    });

    // Act
    actor.start();

    await waitFor(13000);

    // Assert
    const { context, value: state } = actor.getSnapshot();
    expect(state).to.equal("hangup");
    expect(context.idleTimeoutCount).to.equal(3);
    expect(input.voice.say).to.have.been.callCount(5);
    expect(input.voice.say).to.have.been.calledWith(FIRST_MESSAGE);
    expect(input.voice.say).to.have.been.calledWith(IDLE_MESSAGE);
    expect(input.voice.say).to.have.been.calledWith(GOODBYE_MESSAGE);
    expect(input.voice.hangup).to.have.been.calledOnce;

    // Cleanup
    actor.stop();
  }).timeout(20000);
});
