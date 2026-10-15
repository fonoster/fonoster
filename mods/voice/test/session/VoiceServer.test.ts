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
import * as http from "http";
import { AddressInfo } from "net";
import { expect } from "chai";
import { FakeGateway, Peer } from "@fonoster/conformance";
import {
  RemovedMethodError,
  Session,
  SessionEndedError,
  VoiceServer
} from "../../src/session";
import {
  LegacyRequest,
  LegacyResponse,
  createLegacyResponse
} from "../../src/session/legacy";

const SECRET = "unit-secret";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const START = {
  type: "session.start",
  protocol: "fonoster.session.v1",
  sessionRef: "s1",
  callRef: "c1",
  appRef: "a1",
  direction: "inbound",
  from: "+1",
  to: "+2",
  metadata: {},
  handoff: null,
  audio: { codec: "pcm16", rate: 16000 },
  tracks: [{ id: 1, side: "inbound", kind: "audio", codec: "pcm16" }],
  speech: { voice: "fake/default", language: "en-US" }
};

const json = (peer: Peer) =>
  peer.frames.items
    .filter((f) => f.kind === "json")
    .map((f) => f.data as Record<string, unknown>);

async function waitFor<T>(fn: () => T | undefined, ms = 2000): Promise<T> {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v !== undefined) return v;
    if (Date.now() > deadline) throw new Error("timed out");
    await sleep(10);
  }
}

describe("@voice/session VoiceServer", function () {
  let server: VoiceServer | undefined;
  afterEach(async () => server?.close());

  const url = () => `ws://127.0.0.1:${server!.port}/`;

  async function standalone(handler: (s: Session) => Promise<void>) {
    let calls = 0;
    server = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      signingSecret: SECRET
    }).listen(async (s) => {
      calls++;
      await handler(s);
    });
    return () => calls;
  }

  it("runs the handler once per session with a valid signature", async function () {
    const calls = await standalone(async () => undefined);
    const peer = await new FakeGateway({ signingSecret: SECRET }).dial(url());
    peer.sendJson(START);
    await sleep(50);
    expect(calls()).to.equal(1);
  });

  it("accepts a signature over the app URL without a trailing slash", async function () {
    const calls = await standalone(async () => undefined);
    const bare = url().replace(/\/$/, "");
    const peer = await new FakeGateway({ signingSecret: SECRET }).dial(bare);
    peer.sendJson(START);
    await sleep(50);
    expect(calls()).to.equal(1);
  });

  for (const [name, options] of [
    ["a wrong secret", { signingSecret: "wrong" }],
    ["no signature", {}],
    [
      "a stale timestamp",
      { signingSecret: SECRET, timestamp: Math.floor(Date.now() / 1000) - 600 }
    ]
  ] as const) {
    it(`rejects ${name} before the handler runs`, async function () {
      const calls = await standalone(async () => undefined);
      let error: Error | undefined;
      await new FakeGateway(options).dial(url()).catch((e) => (error = e));
      expect(error?.message).to.contain("401");
      expect(calls()).to.equal(0);
    });
  }

  it("accepts unsigned connections only when verification is off", async function () {
    server = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      verifySignature: false
    }).listen(async () => undefined);
    const peer = await new FakeGateway().dial(url());
    expect(peer).to.exist;
    expect(() => new VoiceServer({ port: 0 })).to.throw("signingSecret");
  });

  it("mounts into an existing HTTP server on a path", async function () {
    const httpServer = http.createServer((_req, res) => res.end("app"));
    await new Promise<void>((r) => httpServer.listen(0, "127.0.0.1", r));
    let ran = 0;
    new VoiceServer({ path: "/voice", signingSecret: SECRET }).attach(
      httpServer,
      async () => {
        ran++;
      }
    );
    const port = (httpServer.address() as AddressInfo).port;
    const peer = await new FakeGateway({ signingSecret: SECRET }).dial(
      `ws://127.0.0.1:${port}/voice`
    );
    peer.sendJson(START);
    await sleep(50);
    expect(ran).to.equal(1);
    peer.close();
    httpServer.close();
  });

  it("rejects a pending gather and emits end when the caller hangs up", async function () {
    let outcome: unknown;
    let endReason: string | undefined;
    await standalone(async (s) => {
      s.on("end", (e) => (endReason = e.reason));
      outcome = await s.gather({ timeout: 5000 }).catch((e) => e);
    });
    const peer = await new FakeGateway({ signingSecret: SECRET }).dial(url());
    peer.sendJson(START);
    await sleep(30);
    peer.sendJson({ type: "session.end", reason: "caller_hangup" });
    await waitFor(() => outcome);
    expect(outcome).to.be.instanceOf(SessionEndedError);
    expect(endReason).to.equal("caller_hangup");
  });

  it("hangs up when the handler throws", async function () {
    await standalone(async () => {
      throw new Error("boom");
    });
    const peer = await new FakeGateway({ signingSecret: SECRET }).dial(url());
    peer.sendJson(START);
    await waitFor(() => json(peer).find((m) => m.type === "hangup"));
  });

  it("dispatches legacy (req, res) handlers by arity with request fields", async function () {
    let req: LegacyRequest | undefined;
    server = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      signingSecret: SECRET
    }).listen(async (r: LegacyRequest, _res: LegacyResponse) => {
      req = r;
    });
    const peer = await new FakeGateway({ signingSecret: SECRET }).dial(url());
    peer.sendJson(START);
    await waitFor(() => req);
    expect(req).to.include({
      callRef: "c1",
      callerNumber: "+1",
      ingressNumber: "+2",
      callDirection: "FROM_PSTN"
    });
  });
});

describe("@voice/session removed methods", function () {
  it("throw errors naming the replacement", function () {
    const session = new Session(START as never, {
      sendJson: () => undefined,
      sendBinary: () => undefined,
      close: () => undefined
    });
    const res = createLegacyResponse(session) as unknown as Record<
      string,
      () => void
    >;
    expect(() => res.record()).to.throw(
      RemovedMethodError,
      "recording is now an app policy"
    );
    expect(() => res.setAudioFilters()).to.throw("app's configuration");
    expect(() => res.mute()).to.throw("hold()");
    expect(() => res.unmute()).to.throw("resume()");
  });
});

describe("@voice/session deprecated legacy shims", function () {
  function setup() {
    const sent: { json?: Record<string, unknown>; binary?: Buffer }[] = [];
    const session = new Session(START as never, {
      sendJson: (m) => sent.push({ json: m }),
      sendBinary: (b) => sent.push({ binary: b }),
      close: () => undefined
    });
    return { session, sent, res: createLegacyResponse(session) };
  }

  it("res.stream() delivers caller audio and sends agent audio", function () {
    const { session, sent, res } = setup();
    const stream = res.stream();
    const payloads: unknown[] = [];
    stream.onPayload((p) => payloads.push(p));
    session.receive(Buffer.from([1, 9, 9]), true);
    expect(payloads[0]).to.deep.include({
      type: "AUDIO_IN",
      format: "WAV",
      mediaSessionRef: "s1"
    });
    stream.write({ data: new Uint8Array([7, 7]) });
    expect(sent.at(-1)?.binary).to.deep.equal(Buffer.from([7, 7]));
    stream.close();
    session.receive(Buffer.from([1, 1, 1]), true);
    expect(payloads).to.have.length(1);
  });

  it("res.sgather() reports speech and digits and starts listening", function () {
    const { session, sent, res } = setup();
    const gather = res.sgather({ source: "speech,dtmf" });
    const payloads: { speech?: string; digit?: string }[] = [];
    gather.onPayload((p) => payloads.push(p));
    expect(sent[0].json).to.deep.include({ type: "subscribe", events: [] });
    session.receive(
      Buffer.from(
        JSON.stringify({
          type: "turn.ended",
          text: "billing",
          language: "en",
          confidence: 1,
          durationMs: 1
        })
      ),
      false
    );
    session.receive(
      Buffer.from(JSON.stringify({ type: "dtmf", digit: "5" })),
      false
    );
    expect(payloads.map((p) => p.speech ?? p.digit)).to.deep.equal([
      "billing",
      "5"
    ]);
    gather.close();
    session.receive(
      Buffer.from(JSON.stringify({ type: "dtmf", digit: "6" })),
      false
    );
    expect(payloads).to.have.length(2);
  });
});
