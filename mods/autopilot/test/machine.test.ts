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
    playDtmf: sandbox.stub().resolves().callsFake(() => {
      // Add a delay to emulate the dtmf tone
      return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 500);
      });
    }),
    stopSpeech: sandbox.stub().resolves(),
    // Add a delay to emulate the voice response
    say: sandbox.stub().resolves().callsFake((content: string) => {
      return new Promise<void>((resolve) => setTimeout(() => resolve(), 4000));
    }),
    hangup: sandbox.stub().resolves()
  } as unknown as Voice,
  conversationSettings: {
    firstMessage: FIRST_MESSAGE,
    goodbyeMessage: GOODBYE_MESSAGE,
    systemPrompt: "System template",
    systemErrorMessage: SYSTEM_ERROR_MESSAGE,
    maxSpeechWaitTimeout: 500,
    maxSessionDuration: 30 * 60 * 1000,
    initialDtmf: "1",
    allowUserBargeIn: true,
    idleOptions: {
      message: IDLE_MESSAGE,
      timeout: 30000,
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
  this.slow(30000);

  afterEach(() => sandbox.restore());
  
  it("should say the first message then set the state to 'idle'", async function () {
    // Arrange
    const { machine } = await import("../src/machine");

    const input = getActorInput();
    const actor = createActor(machine, {
      input
    });

    // Act
    actor.start();

    // Wait just enough time to say the first message
    await waitFor(4100);

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
    expect(context.idleTimeout).to.equal(30000);
    expect(context.maxSpeechWaitTimeout).to.equal(500);
    expect(context.transferMessage).to.equal("Transferring call");
    expect(context.transferPhoneNumber).to.equal("+1234567890");
    expect(context.maxIdleTimeoutCount).to.equal(3);
    expect(context.idleTimeoutCount).to.equal(0);
    expect(context.speechBuffer).to.equal("");
    expect(context.allowUserBargeIn).to.equal(true);

    // Cleanup
    actor.stop();
  }).timeout(20000);

  it("should set the state to 'idle' and then 'listeningToUser'", async function () {
    // Arrange
    const { machine } = await import("../src/machine");

    const input = getActorInput();
    const actor = createActor(machine, {
      input
    });

    // Act
    actor.start();
    actor.send({ type: "SPEECH_START" });

    // Assert
    const { context, value: state } = actor.getSnapshot();
    expect(state).to.equal("listeningToUser");
    expect(context.speechBuffer).to.equal("");
    expect(context.idleTimeoutCount).to.equal(0);
    expect(input.voice.stopSpeech).to.have.been.calledOnce;

    // Cleanup
    actor.stop();
  }).timeout(20000);

  it("should append the speech to the buffer and set the state to 'listeningToUser'", async function () {
    // Arrange
    const { machine } = await import("../src/machine");

    const input = getActorInput();
    const actor = createActor(machine, {
      input
    });

    // Act
    actor.start();

    actor.send({ type: "SPEECH_START" });
    actor.send({ type: "SPEECH_RESULT", speech: "Well, I personally think that the best way to learn is by doing", responseTime: 1000 });
    actor.send({ type: "SPEECH_START" });
    actor.send({ type: "SPEECH_RESULT", speech: "and yeah", responseTime: 1000 });

    await waitFor(50);

    // Goes to "waitingForSpeechTimeout"
    actor.send({ type: "SPEECH_RESULT", speech: "thats all", responseTime: 1000 });

    const { context, value: state } = actor.getSnapshot();
    expect(state).to.equal("waitingForSpeechTimeout");
    expect(context.speechBuffer).to.equal("Well, I personally think that the best way to learn is by doing and yeah thats all");
    expect(context.idleTimeoutCount).to.equal(0);

    // Cleanup
    actor.stop();
  }).timeout(20000);

  it("from 'listeningToUser' call SPEECH_RESULT process the request and goes back to 'listeningToUser'", async function () {
    // Arrange
    const { machine } = await import("../src/machine");

    const input = getActorInput();
    const actor = createActor(machine, {
      input
    });

    // Act
    actor.start();
    actor.send({ type: "SPEECH_START" });
    actor.send({ type: "SPEECH_RESULT", speech: "Hello", responseTime: 1000 });

    // Wait just enough to get a MAX_SPEECH_WAIT_TIMEOUT and process the request
    await waitFor(5500);

    // Assert
    const { context, value: state } = actor.getSnapshot();
    expect(state).to.equal("listeningToUser");
    expect(context.speechBuffer).to.equal("");
    expect(input.voice.say).to.have.been.calledWith(ASSISTANT_RESPONSE);

    // Cleanup
    actor.stop();
  }).timeout(20000);

  it("goes from 'processingUserRequest' back to 'processingUserRequest' when SPEECH_RESULT is received", async function () {
    // Arrange
    const { machine } = await import("../src/machine");

    const input = getActorInput();
    const actor = createActor(machine, {
      input
    });

    // Act
    actor.start();
    actor.send({ type: "SPEECH_START" });

    await waitFor(50);
    let { value: state0 } = actor.getSnapshot();
    expect(state0).to.equal("listeningToUser");

    actor.send({ type: "SPEECH_RESULT", speech: "Hello?", responseTime: 1000 });

    // Wait just enough to get a MAX_SPEECH_WAIT_TIMEOUT
    await waitFor(600);
    let { value: state1 } = actor.getSnapshot();
    expect(state1).to.equal("processingUserRequest");

    actor.send({ type: "SPEECH_RESULT", speech: "Hello!", responseTime: 1000 });

    // Just enough to be in the middle of processing the request
    await waitFor(2000);

    // Assert
    const { context, value: state } = actor.getSnapshot();
    expect(state).to.equal("processingUserRequest");
    expect(context.speechBuffer).to.equal("Hello? Hello!");
    expect(input.voice.say).to.have.been.calledWith(ASSISTANT_RESPONSE);

    // Cleanup
    actor.stop();
  }).timeout(20000);

  it("with barge-in off, SPEECH_START during processingUserRequest is ignored and AI completes via onDone", async function () {
    // Arrange: barge-in disabled
    const { machine } = await import("../src/machine");
    const input = getActorInput();
    input.conversationSettings.allowUserBargeIn = false;

    const actor = createActor(machine, { input });

    // Act: get to processingUserRequest
    actor.start();
    actor.send({ type: "SPEECH_START" });
    await waitFor(50);
    actor.send({ type: "SPEECH_RESULT", speech: "Hello", responseTime: 1000 });
    await waitFor(600);
    expect(actor.getSnapshot().value).to.equal("processingUserRequest");

    // Send SPEECH_START while AI is "speaking" (barge-in would interrupt if enabled)
    actor.send({ type: "SPEECH_START" });

    // Assert: still in processingUserRequest (guard blocked transition)
    expect(actor.getSnapshot().value).to.equal("processingUserRequest");

    // Wait for AI to finish; should transition via onDone only
    await waitFor(5500);

    const { context, value: state } = actor.getSnapshot();
    expect(state).to.equal("listeningToUser");
    expect(context.speechBuffer).to.equal("");
    expect(input.voice.say).to.have.been.calledWith(ASSISTANT_RESPONSE);
    expect(input.languageModel.invoke).to.have.been.calledOnce;

    actor.stop();
  }).timeout(20000);

  it("with barge-in off, SPEECH_RESULT during processingUserRequest is ignored and AI completes via onDone", async function () {
    // Arrange: barge-in disabled
    const { machine } = await import("../src/machine");
    const input = getActorInput();
    input.conversationSettings.allowUserBargeIn = false;

    const actor = createActor(machine, { input });

    // Act: get to processingUserRequest
    actor.start();
    actor.send({ type: "SPEECH_START" });
    await waitFor(50);
    actor.send({ type: "SPEECH_RESULT", speech: "Hello?", responseTime: 1000 });
    await waitFor(600);
    expect(actor.getSnapshot().value).to.equal("processingUserRequest");

    // Send late SPEECH_RESULT (would interrupt and reenter if barge-in were enabled)
    actor.send({ type: "SPEECH_RESULT", speech: "Hello!", responseTime: 1000 });
    await waitFor(2000);

    // Assert: still in processingUserRequest, buffer unchanged, no reenter (invoke only once)
    let snapshot = actor.getSnapshot();
    expect(snapshot.value).to.equal("processingUserRequest");
    expect(snapshot.context.speechBuffer).to.equal("Hello?");
    expect(input.languageModel.invoke).to.have.been.calledOnce;

    // Wait for AI to finish via onDone
    await waitFor(5500);
    snapshot = actor.getSnapshot();
    expect(snapshot.value).to.equal("listeningToUser");
    expect(input.voice.say).to.have.been.calledWith(ASSISTANT_RESPONSE);
    expect(input.languageModel.invoke).to.have.been.calledOnce;

    actor.stop();
  }).timeout(20000);

  it("should idletimeout and then hangup", async function () {
    // Arrange
    const { machine } = await import("../src/machine");

    const input = getActorInput();

    // 500ms is not a realistic timeout, but kept low for testing purposes
    input.conversationSettings.idleOptions.timeout = 500;

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
