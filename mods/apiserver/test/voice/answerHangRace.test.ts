/* eslint-disable new-cap */
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
import { StreamContent as SC, VoiceClientConfig } from "@fonoster/common";
import { CallDirection } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import { Channel, Client } from "ari-client";
import * as chai from "chai";
import { expect } from "chai";
import { NatsConnection } from "nats";
import { pickPort } from "pick-port";
import { createSandbox, SinonSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { createSession } from "../../../voice/src/createSession";
import { serviceDefinition } from "../../../voice/src/serviceDefinition";
import { AudioSocketHandler } from "../../src/voice/client/AudioSocketHandler";
import { VoiceClientImpl } from "../../src/voice/client/VoiceClientImpl";
import { VoiceDispatcher } from "../../src/voice/VoiceDispatcher";

chai.use(sinonChai);
const sandbox = createSandbox();

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor(predicate: () => boolean, timeoutMs = 5000) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("waitFor timed out");
    }
    await delay(5);
  }
}

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

/**
 * A real voice application: the same `serviceDefinition` and `createSession` the
 * production VoiceServer uses, so the verb machinery under test is genuine. Only the
 * thin VoiceServer wrapper (credentials + health check) is replaced, because it exposes
 * no way to shut the gRPC server down again.
 *
 * `delayBeforeVerbMs` models how fast the app answers. QCobro's pre-recorded handler
 * calls `answer()` with nothing in front of it, i.e. 0ms — the fastest possible app.
 */
async function startVoiceApp(params: { delayBeforeVerbMs: number }) {
  const port = await pickPort({ type: "tcp" });
  let requestsSeen = 0;

  const server = new grpc.Server();
  server.addService(serviceDefinition, {
    createSession: createSession(async (_req, res) => {
      requestsSeen += 1;
      if (params.delayBeforeVerbMs > 0) {
        await delay(params.delayBeforeVerbMs);
      }
      // Deliberately not awaited: when the verb is dropped this promise never
      // settles — that is the production symptom being reproduced.
      void (res.answer() as Promise<unknown>).catch(() => undefined);
    })
  });

  await new Promise<void>((resolve, reject) => {
    server.bindAsync(
      `127.0.0.1:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err) => (err ? reject(err) : resolve())
    );
  });

  return {
    port,
    get requestsSeen() {
      return requestsSeen;
    },
    stop: () => server.forceShutdown()
  };
}

function createAriStub(sbx: SinonSandbox) {
  return {
    Bridge: sbx.stub().returns({
      id: "bridge-id",
      create: sbx.stub().resolves(),
      addChannel: sbx.stub().resolves(),
      destroy: sbx.stub().resolves()
    }),
    Channel: sbx.stub().returns({
      externalMedia: sbx.stub().resolves(),
      once: sbx.stub(),
      on: sbx.stub()
    }),
    channels: {
      answer: sbx.stub().resolves(),
      hangup: sbx.stub().resolves(),
      play: sbx.stub().resolves()
    },
    on: sbx.stub(),
    once: sbx.stub(),
    start: sbx.stub(),
    removeListener: sbx.stub()
  } as unknown as Client;
}

function createChannelStub(mediaSessionRef: string) {
  return {
    id: mediaSessionRef,
    getChannelVar: async ({ variable }: { variable: string }) => {
      if (variable === "APP_REF") return { value: "app-ref" };
      if (variable === "FROM_EXTERNAL_MEDIA") return { value: "false" };
      return { value: "" };
    },
    on: () => undefined,
    once: () => undefined
  } as unknown as Channel;
}

function createConfig(port: number, mediaSessionRef: string): VoiceClientConfig {
  return {
    appRef: "app-ref",
    accessKeyId: "WO00000000000000000000000000000000",
    endpoint: `127.0.0.1:${port}`,
    ingressNumber: "+18297340812",
    callerName: "Test",
    callerNumber: "+18095551234",
    mediaSessionRef,
    callRef: "call-ref",
    sessionToken: "token",
    callDirection: CallDirection.FROM_PSTN,
    metadata: {}
  };
}

describe("@voice/answer-hang race", function () {
  let app: Awaited<ReturnType<typeof startVoiceApp>>;
  let audioSocketGate: ReturnType<typeof createDeferred>;

  beforeEach(function () {
    // The controllable gap. In production this is pickPort + setupAudioSocket +
    // setupExternalMedia inside connect() — 10-30ms of async I/O that happens AFTER
    // the request has already been written to the app. Holding it open makes the
    // race deterministic instead of timing-dependent.
    audioSocketGate = createDeferred();
    sandbox
      .stub(AudioSocketHandler.prototype, "setupAudioSocket")
      .callsFake(async () => {
        await audioSocketGate.promise;
      });
    sandbox
      .stub(AudioSocketHandler.prototype, "getAudioStream")
      .returns({} as never);
  });

  afterEach(function () {
    audioSocketGate.resolve();
    app?.stop();
    sandbox.restore();
  });

  it("delivers the app's first verb when it arrives before handlers register (CONTROL)", async function () {
    // Identical machinery to the failing case below; the ONLY difference is that the
    // listener is attached before connect() writes the request. If this passes and the
    // next one fails, ordering is the sole variable.
    app = await startVoiceApp({ delayBeforeVerbMs: 0 });
    const ari = createAriStub(sandbox);
    const config = createConfig(app.port, "media-session-control");
    const vc = new VoiceClientImpl({
      ari,
      config,
      tts: {} as never,
      stt: {} as never
    });

    const answerSpy = sandbox.stub();
    vc.on(SC.ANSWER_REQUEST, answerSpy);

    setTimeout(() => audioSocketGate.resolve(), 50);
    await vc.connect();
    await waitFor(() => app.requestsSeen === 1);
    await delay(200);

    expect(answerSpy).to.have.been.calledOnce;
  });

  it("delivers the first verb when the app pauses before sending it (STOPGAP)", async function () {
    // Validates the qcobro-side mitigation: an app that waits before its first verb
    // loses the race far less often, with no change to Fonoster.
    app = await startVoiceApp({ delayBeforeVerbMs: 250 });
    const ari = createAriStub(sandbox);
    const config = createConfig(app.port, "media-session-stopgap");
    const vc = new VoiceClientImpl({
      ari,
      config,
      tts: {} as never,
      stt: {} as never
    });

    const dispatcher = new VoiceDispatcher(
      ari,
      {} as NatsConnection,
      sandbox.stub().resolves(vc)
    );

    // Let connect() finish immediately, so handlers are registered well before the
    // app's delayed verb arrives.
    audioSocketGate.resolve();
    await dispatcher.handleStasisStart(
      {} as never,
      createChannelStub("media-session-stopgap")
    );
    await waitFor(() => app.requestsSeen === 1);
    await delay(600);

    expect(ari.channels.answer).to.have.been.calledOnce;
  });

  it("REGRESSION: handleStasisStart must not drop a verb sent before its handlers register", async function () {
    // The production path, verbatim: VoiceDispatcher.handleStasisStart awaits
    // vc.connect() — which writes the request to the app at its START — and only
    // registers vc.on(ANSWER_REQUEST, ...) after connect() has fully returned.
    //
    // A fast app replies inside that window, verbsStream.emit() finds no listener,
    // and Node's EventEmitter discards the event silently. The app's answer() promise
    // then never settles and the call hangs.
    //
    // FAILS on current code. Passes once the request is written after the handlers
    // are registered.
    app = await startVoiceApp({ delayBeforeVerbMs: 0 });
    const ari = createAriStub(sandbox);
    const config = createConfig(app.port, "media-session-regression");
    const vc = new VoiceClientImpl({
      ari,
      config,
      tts: {} as never,
      stt: {} as never
    });

    const dispatcher = new VoiceDispatcher(
      ari,
      {} as NatsConnection,
      sandbox.stub().resolves(vc)
    );

    const starting = dispatcher.handleStasisStart(
      {} as never,
      createChannelStub("media-session-regression")
    );

    // Hold connect() open for 100ms. On the unfixed ordering the request has already
    // gone out and the app's answerRequest lands in this window, with no listener
    // attached yet. Once fixed, the listeners exist first and the request is not sent
    // until the gate opens, so the same 100ms is simply setup time.
    setTimeout(() => audioSocketGate.resolve(), 100);
    await starting;
    await waitFor(() => app.requestsSeen === 1);
    await delay(300);

    expect(ari.channels.answer).to.have.been.calledOnce;
  });
});
