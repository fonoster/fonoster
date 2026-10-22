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
import { ChildProcess, spawn } from "child_process";
import * as path from "path";
import { expect } from "chai";
import { NatsConnection, connect } from "nats";
import { FakeSessionCall, FakesHarness, Peer } from "@fonoster/conformance";
import { Session, VoiceServer } from "@fonoster/voice";
import { AppBridge, AppConfig, MemoryCallRecordSink } from "../src";

// Catalog area XFR (mods/conformance/catalog/areas/transfers.md): transfers, hold and keypresses
// end to end. A real AppBridge serves the call's control stream from a real Roomr node in
// roomr-fake, whose phone is the caller (and the new party of a transfer); each case checks what
// the phone got (its call still up or ended, on hold, the audio it heard, the keys it received)
// as well as what the app saw. The app is the protocol itself (a fonoster or twilio WebSocket
// peer), the TypeScript SDK, or the Python SDK. Needs NATS: CONFORMANCE_NATS_URL; the Python cases
// need fonoster-voice installed in $PYTHON (default python3).
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const PYTHON = process.env.PYTHON ?? "python3";
const SECRET = "xfr-secret";
const CALLER = "+15550001111";
const NUMBER = "+15550002222";
const TARGET = "+15551234567";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function json(peer: Peer) {
  return peer.frames.items
    .filter((f) => f.kind === "json")
    .map((f) => f.data as Record<string, unknown>);
}

async function waitFor<T>(
  fn: () => T | undefined | false | Promise<T | undefined | false>,
  ms: number,
  what: string
): Promise<T> {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(25);
  }
}

describe("@appbridge transfers and keypresses end to end (XFR)", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let appbridge: AppBridge | undefined;
  let record: MemoryCallRecordSink;

  // A pr-tier area of its own: without its bus it fails, it never skips.
  before(async function () {
    if (!NATS_URL)
      throw new Error(
        "CONFORMANCE_NATS_URL is not set: the XFR cases need NATS"
      );
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  beforeEach(async function () {
    harness = await new FakesHarness().start();
    record = new MemoryCallRecordSink();
    appbridge = undefined;
  });

  afterEach(async function () {
    await appbridge?.stop();
    await harness?.stop();
  });

  async function start(app: Partial<AppConfig> = {}) {
    const urls = harness.providerUrls;
    appbridge = await new AppBridge({
      nats: nc,
      record,
      config: {
        nats: { url: NATS_URL! },
        session: { listen: "127.0.0.1:0" },
        apps: [
          {
            ref: "xfr",
            url: harness.app.url,
            protocol: "fonoster",
            signingSecret: SECRET,
            workspaceRef: "W1",
            speech: { voice: "fake/default", language: "en-US" },
            ...app
          }
        ],
        providers: {
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          }
        }
      }
    }).start();
    harness.roomrNode.configure({ endpoint: appbridge.sessionEndpoint });
  }

  /** The phone calls the number; resolves with the call and the app's session once it started. */
  async function call(to = NUMBER) {
    const c = await harness.roomrNode.offerCall({ from: CALLER, to });
    const { peer } = await harness.app.nextConnection();
    await waitFor(
      () =>
        json(peer).find(
          (m) => m.type === "session.start" || m.event === "start"
        ),
      5000,
      "the session to start"
    );
    await harness.roomrNode.answered(c.callRef);
    return { c, peer };
  }

  const status = (c: FakeSessionCall, since?: number) => c.fake.status(since);
  /** What AppBridge sent the node on the call's control stream, read from the node now. */
  const nodeCommands = async () =>
    (await harness.roomrNode.freshCommands()).map((c) => c.command);
  const recordTypes = () =>
    ([...record.records.values()][0] ?? []).map((e) =>
      [e.source, e.message.type, e.message.reason].filter(Boolean).join(":")
    );

  /** The app speaks; resolves once the caller's phone heard it (audible ms since `since`). */
  async function heardSpeech(peer: Peer, c: FakeSessionCall, id: string) {
    const since = Date.now();
    peer.sendJson({
      type: "speak",
      id,
      text: "Thanks for waiting, I am back."
    });
    await waitFor(
      () => json(peer).find((m) => m.type === "output.done" && m.id === id),
      8000,
      `output.done for ${id}`
    );
    return waitFor(
      async () => (await status(c, since)).phone!.audibleMsSince > 300,
      3000,
      "the caller to hear the app"
    );
  }

  // ---- the Fonoster protocol ------------------------------------------------------------

  describe("the Fonoster protocol", function () {
    it("[XFR-001] a cold transfer leaves the caller with the new party, and the call goes on", async function () {
      await start();
      harness.roomrNode.configure({ answerAfterMs: 1200 });
      const { c, peer } = await call();
      const sent = Date.now();
      peer.sendJson({
        type: "transfer",
        id: "t1",
        to: TARGET,
        headers: { "X-Customer-Id": "c-42" }
      });
      const transfer = await waitFor(
        async () => (await nodeCommands()).find((m) => m.type === "transfer"),
        3000,
        "the node's Transfer"
      );
      expect(transfer.mode).to.equal("cold");
      expect(transfer.to).to.deep.equal({
        uri: TARGET,
        headers: {
          "X-Customer-Id": "c-42",
          "X-Dod-Number": NUMBER,
          "X-Access-Key-Id": "W1"
        }
      });
      // The session stays while the new party rings, and ends once it answers.
      const end = await waitFor(
        () => json(peer).find((m) => m.type === "session.end"),
        5000,
        "session.end"
      );
      expect(end.reason).to.equal("transfer");
      expect(Date.now() - sent).to.be.greaterThan(1000);
      // The caller's call goes on, in the same room, off hold, with no hang-up sent.
      await sleep(1000);
      const after = await status(c);
      expect(after.state).to.equal("answered");
      expect(after.phone!.state).to.equal("answered");
      expect(after.held).to.equal(false);
      expect(after.roomRef).to.equal(c.roomRef);
      expect((await nodeCommands()).map((m) => m.type)).to.not.include(
        "hangup"
      );
      // The record keeps the call until the room ends: the caller's hang-up comes after the transfer.
      harness.roomrNode.callerHangup(c.callRef);
      await harness.roomrNode.ended(c.callRef);
      const types = await waitFor(
        () =>
          recordTypes().includes("event:call.ended:caller_hangup") &&
          recordTypes(),
        3000,
        "call.ended in the record"
      );
      expect(types.indexOf("event:session.transferred")).to.be.greaterThan(-1);
      expect(types.indexOf("event:call.ended:caller_hangup")).to.be.greaterThan(
        types.indexOf("appbridge:session.end:transfer")
      );
    });

    it("[XFR-002] a warm transfer holds the caller while the agent briefs the new party, then connects them", async function () {
      await start();
      // The new party answers 1.5 s after the dial.
      harness.roomrNode.configure({ answerAfterMs: 1500 });
      const { c, peer } = await call();
      const sent = Date.now();
      peer.sendJson({ type: "transfer", id: "t2", to: TARGET, mode: "warm" });
      await waitFor(
        async () => (await status(c)).held,
        3000,
        "the caller on hold"
      );
      // Completing while the new party rings is refused: the session, the hold and the dial go on.
      peer.sendJson({ type: "transfer.complete", id: "t2" });
      const refused = await waitFor(
        () => json(peer).find((m) => m.type === "error"),
        2000,
        "the refusal"
      );
      expect(refused).to.include({
        code: "transfer_not_answered",
        fatal: false,
        relatesTo: "t2"
      });
      await sleep(200);
      expect((await nodeCommands()).map((m) => m.type)).to.not.include(
        "transferComplete"
      );
      expect((await status(c)).held).to.equal(true);
      expect(json(peer).some((m) => m.type === "session.end")).to.equal(false);
      // The new party answers: the app is told, once.
      const answered = await waitFor(
        () =>
          peer.frames.items.find(
            (f) => f.kind === "json" && f.data.type === "transfer.answered"
          ),
        5000,
        "transfer.answered"
      );
      expect(answered.data).to.deep.equal({
        type: "transfer.answered",
        relatesTo: "t2"
      });
      expect(answered.at - sent).to.be.greaterThan(1400);
      // The briefing plays to the room, and the held caller hears none of it.
      const briefing = Date.now();
      peer.sendJson({
        type: "speak",
        id: "b1",
        text: "I have a caller asking about a refund."
      });
      await waitFor(
        () => json(peer).find((m) => m.type === "output.done" && m.id === "b1"),
        8000,
        "the briefing to play"
      );
      expect((await status(c, briefing)).phone!.audibleMsSince).to.equal(0);
      expect(json(peer).some((m) => m.type === "session.end")).to.equal(false);
      expect(
        json(peer).filter((m) => m.type === "transfer.answered")
      ).to.have.length(1);
      // Completed after the answer: the caller and the new party are connected.
      peer.sendJson({ type: "transfer.complete", id: "t2" });
      const end = await waitFor(
        () => json(peer).find((m) => m.type === "session.end"),
        3000,
        "session.end"
      );
      expect(end.reason).to.equal("transfer");
      // The caller comes off hold, connected to the new party; the call goes on.
      await waitFor(
        async () => !(await status(c)).held,
        3000,
        "the caller off hold"
      );
      await sleep(500);
      const after = await status(c);
      expect(after.state).to.equal("answered");
      expect(after.phone!.state).to.equal("answered");
      expect((await nodeCommands()).map((m) => m.type)).to.include.members([
        "transfer",
        "transferComplete"
      ]);
    });

    it("[XFR-003] a warm transfer nobody answers in 30 seconds fails and gives the caller back to the app", async function () {
      this.timeout(60000);
      await start();
      const { c, peer } = await call();
      // The new party rings and never answers.
      await harness.roomrNode.callee("no_answer");
      const sent = Date.now();
      peer.sendJson({ type: "transfer", id: "t2", to: TARGET, mode: "warm" });
      await waitFor(
        async () => (await status(c)).held,
        3000,
        "the caller on hold"
      );
      const error = await waitFor(
        () => json(peer).find((m) => m.type === "error"),
        40000,
        "transfer_failed"
      );
      expect(error).to.include({ code: "transfer_failed", relatesTo: "t2" });
      expect(Date.now() - sent).to.be.within(29000, 36000);
      // The caller is off hold and hears the app again; the session goes on.
      await waitFor(
        async () => !(await status(c)).held,
        3000,
        "the caller off hold"
      );
      await heardSpeech(peer, c, "s1");
      expect(json(peer).some((m) => m.type === "session.end")).to.equal(false);
      expect((await status(c)).state).to.equal("answered");
    });

    for (const outcome of ["busy", "failed"] as const) {
      it(`[XFR-004] a transfer to a ${outcome} party fails and the session goes on`, async function () {
        await start();
        harness.roomrNode.configure({ dialOutcome: outcome });
        const { c, peer } = await call();
        peer.sendJson({ type: "transfer", id: "t1", to: TARGET });
        const error = await waitFor(
          () => json(peer).find((m) => m.type === "error"),
          5000,
          "transfer_failed"
        );
        expect(error).to.include({ code: "transfer_failed", relatesTo: "t1" });
        // The caller is still on the call with the app, and hears it.
        await heardSpeech(peer, c, "s1");
        expect(json(peer).some((m) => m.type === "session.end")).to.equal(
          false
        );
        const after = await status(c);
        expect(after.state).to.equal("answered");
        expect(after.held).to.equal(false);
      });
    }

    it("[XFR-005] a transfer by SIP REFER hands the call off and the node lets it go", async function () {
      await start();
      const { c, peer } = await call();
      peer.sendJson({ type: "transfer", id: "t3", to: TARGET, mode: "refer" });
      const end = await waitFor(
        () => json(peer).find((m) => m.type === "session.end"),
        5000,
        "session.end"
      );
      expect(end.reason).to.equal("transfer");
      expect(
        (await nodeCommands()).find((m) => m.type === "transfer")
      ).to.include({
        mode: "refer"
      });
      // The phone accepted the REFER; the node no longer carries the call and never hung it up
      // as the app's own hang-up.
      const ended = await harness.roomrNode.ended(c.callRef);
      expect(ended.cause).to.equal("removed");
      expect((await nodeCommands()).map((m) => m.type)).to.not.include(
        "hangup"
      );
      // The record notes the transfer, then the call ends as transferred (recording ends there).
      const types = await waitFor(
        () =>
          recordTypes().includes("event:call.ended:transfer") && recordTypes(),
        3000,
        "call.ended in the record"
      );
      expect(types).to.include("event:session.transferred");
    });

    for (const [name, transfer] of [
      [
        "a reserved header",
        { to: TARGET, headers: { "X-Dod-Number": "+15550009999" } }
      ],
      [
        "a target with parameters",
        { to: "sip:agent@example.com;transport=tcp" }
      ]
    ] as const) {
      it(`[XFR-006] a transfer with ${name} is refused and the caller stays with the app`, async function () {
        await start();
        const { c, peer } = await call();
        peer.sendJson({ type: "transfer", id: "t4", ...transfer });
        const error = await waitFor(
          () => json(peer).find((m) => m.type === "error"),
          3000,
          "the refusal"
        );
        expect(error).to.include({ code: "bad_message", relatesTo: "t4" });
        await heardSpeech(peer, c, "s1");
        expect((await nodeCommands()).map((m) => m.type)).to.not.include(
          "transfer"
        );
        const after = await status(c);
        expect(after.state).to.equal("answered");
        expect(after.held).to.equal(false);
      });
    }

    it("[XFR-007] hold silences the call both ways until resume, and keys still arrive", async function () {
      await start();
      const { c, peer } = await call();
      peer.sendJson({ type: "listen.update" });
      peer.sendJson({ type: "hold", id: "h1" });
      await waitFor(
        async () => (await status(c)).held,
        3000,
        "the caller on hold"
      );
      await sleep(200);
      const held = Date.now();
      // The caller talks and presses a key while held: the app gets the key, no audio, no turn.
      harness.roomrNode.callerSpeaks({ kind: "tone", ms: 800 });
      await c.fake.dtmf("4");
      peer.sendJson({ type: "speak", id: "s0", text: "Are you there?" });
      await sleep(1500);
      const during = peer.frames.items.filter((f) => f.at >= held);
      expect(during.filter((f) => f.kind === "binary")).to.have.length(0);
      const messages = during
        .filter((f) => f.kind === "json")
        .map((f) => f.data as Record<string, unknown>);
      expect(
        messages.filter((m) => String(m.type).startsWith("turn."))
      ).to.deep.equal([]);
      expect(messages.find((m) => m.type === "dtmf")).to.include({
        digit: "4"
      });
      expect(messages.find((m) => m.type === "error")).to.include({
        code: "on_hold",
        relatesTo: "s0"
      });
      expect((await status(c, held)).phone!.audibleMsSince).to.equal(0);
      // Resumed: the caller hears the app and the app hears the caller again.
      peer.sendJson({ type: "resume", id: "h2" });
      await waitFor(
        async () => !(await status(c)).held,
        3000,
        "the caller off hold"
      );
      const resumed = Date.now();
      await heardSpeech(peer, c, "s1");
      harness.roomrNode.callerSpeaks({ kind: "tone", ms: 400 });
      await waitFor(
        () =>
          peer.frames.items.some((f) => f.kind === "binary" && f.at > resumed),
        3000,
        "caller audio at the app"
      );
    });

    it("[XFR-008] the caller's keys reach the app at once, and the app's keys reach the phone", async function () {
      await start();
      const { c, peer } = await call();
      // Keys while the agent speaks, sent as RFC 4733 events and as SIP INFO.
      peer.sendJson({
        type: "speak",
        id: "r1",
        text: "Please listen carefully, as our menu options have recently changed."
      });
      await waitFor(
        () => json(peer).find((m) => m.type === "output.started"),
        5000,
        "the agent to speak"
      );
      const pressed = Date.now();
      await c.fake.dtmf("0", "rfc4733");
      const first = await waitFor(
        () =>
          peer.frames.items.find(
            (f) => f.kind === "json" && f.data.type === "dtmf"
          ),
        2000,
        "the first key"
      );
      expect(first.data).to.include({ digit: "0" });
      expect(first.at - pressed).to.be.lessThan(1000);
      expect(json(peer).some((m) => m.type === "output.done")).to.equal(false);
      // The phone sends each key when asked (POST /dtmf returns at once): one key at a time.
      await c.fake.dtmf("7", "info");
      await waitFor(
        () => json(peer).filter((m) => m.type === "dtmf").length >= 2,
        3000,
        "the second key"
      );
      await c.fake.dtmf("#", "rfc4733");
      await waitFor(
        () => json(peer).filter((m) => m.type === "dtmf").length >= 3,
        3000,
        "the third key"
      );
      await sleep(300);
      expect(
        json(peer)
          .filter((m) => m.type === "dtmf")
          .map((m) => m.digit)
      ).to.deep.equal(["0", "7", "#"]);
      // The app's keys: the phone receives them as RFC 4733 events, in order.
      peer.sendJson({ type: "dtmf.send", id: "d1", digits: "12#" });
      await waitFor(
        async () => (await status(c)).phone!.digits === "12#",
        5000,
        "the phone to receive 12#"
      );
      expect(json(peer).some((m) => m.type === "error")).to.equal(false);
    });
  });

  // ---- the Twilio Media Streams flavor -------------------------------------------------

  describe("the Twilio Media Streams flavor", function () {
    it("[XFR-009] the caller's keys reach a Twilio stream as dtmf events", async function () {
      await start({ protocol: "twilio" });
      const { c, peer } = await call();
      await c.fake.dtmf("5", "rfc4733");
      await waitFor(
        () => json(peer).find((m) => m.event === "dtmf"),
        3000,
        "the first dtmf event"
      );
      await c.fake.dtmf("9", "info");
      await waitFor(
        () => json(peer).filter((m) => m.event === "dtmf").length >= 2,
        3000,
        "the dtmf events"
      );
      const events = json(peer).filter((m) => m.event === "dtmf");
      const start1 = json(peer).find((m) => m.event === "start")!;
      expect(events.map((m) => m.dtmf)).to.deep.equal([
        { track: "inbound_track", digit: "5" },
        { track: "inbound_track", digit: "9" }
      ]);
      expect(events[0].streamSid).to.equal(start1.streamSid);
    });

    it("[XFR-010] a Twilio stream can't transfer, hold or send keys: the call goes on", async function () {
      await start({ protocol: "twilio" });
      const { c, peer } = await call();
      const streamSid = json(peer).find((m) => m.event === "start")!.streamSid;
      peer.sendJson({ event: "transfer", streamSid, to: TARGET });
      peer.sendJson({ type: "transfer", id: "t1", to: TARGET });
      peer.sendJson({ event: "hold", streamSid });
      peer.sendJson({ type: "hold", id: "h1" });
      peer.sendJson({ type: "dtmf.send", id: "d1", digits: "1" });
      await sleep(1500);
      const types = (await nodeCommands()).map((m) => m.type);
      expect(types).to.not.include("transfer");
      expect(types).to.not.include("hold");
      expect(types).to.not.include("sendDtmf");
      const after = await status(c);
      expect(after.state).to.equal("answered");
      expect(after.held).to.equal(false);
      expect(after.phone!.digits ?? "").to.equal("");
      expect(json(peer).some((m) => m.event === "stop")).to.equal(false);
      // The stream still works: the caller's keys arrive.
      await c.fake.dtmf("3");
      await waitFor(
        () => json(peer).find((m) => m.event === "dtmf"),
        3000,
        "a key after the ignored events"
      );
    });
  });

  // ---- the Voice SDKs ------------------------------------------------------------------

  // Both SDKs run the same fixture: the number called picks what it does (a cold transfer with a
  // header, a warm transfer completed after a briefing, or keys and hold driven by the caller's
  // keys). Each logs what its promises and events gave it.
  const COLD = "+15550003001";
  const WARM = "+15550003002";
  const KEYS = "+15550003003";

  type Fixture = { url: string; log: string[]; stop(): Promise<void> };

  async function typescriptApp(): Promise<Fixture> {
    const log: string[] = [];
    const server = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      signingSecret: SECRET
    }).listen(async (session: Session) => {
      if (session.to === COLD) {
        await session.transfer(TARGET, {
          headers: { "X-Customer-Id": "c-42" }
        });
        log.push("transfer resolved");
      } else if (session.to === WARM) {
        const answered = new Promise<void>((resolve) =>
          session.on("transfer.answered", () => resolve())
        );
        const done = session.transfer(TARGET, { mode: "warm" });
        // Too early: the new party is still ringing.
        await session.completeTransfer().then(
          () => log.push("early complete resolved"),
          (e: { code?: string }) => log.push(`early complete refused ${e.code}`)
        );
        await answered;
        log.push("transfer answered");
        await session.say("I have a caller about a refund.");
        await session.completeTransfer();
        await done;
        log.push("warm transfer resolved");
      } else if (session.to === KEYS) {
        session.on("dtmf", ({ digit }) => {
          log.push(`dtmf ${digit}`);
          if (digit === "5") void session.playDtmf("12#");
          if (digit === "7") void session.hold();
          if (digit === "8")
            void session
              .resume()
              .then(() => session.say("Thanks for waiting."))
              .then(() => log.push("said after resume"));
        });
        await new Promise<void>((resolve) => {
          session.on("end", () => resolve());
          setTimeout(resolve, 20000);
        });
      }
    });
    return {
      url: `ws://127.0.0.1:${server.port}/`,
      log,
      stop: () => server.close()
    };
  }

  async function pythonApp(): Promise<Fixture> {
    const log: string[] = [];
    const proc: ChildProcess = spawn(
      PYTHON,
      [path.join(__dirname, "xfr", "app.py")],
      {
        env: { ...process.env, XFR_SECRET: SECRET, XFR_TARGET: TARGET },
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    let stderr = "";
    proc.stderr!.on("data", (d) => (stderr += d.toString()));
    const port = await new Promise<number>((resolve, reject) => {
      let buffer = "";
      const timer = setTimeout(
        () => reject(new Error(`the Python app did not start: ${stderr}`)),
        15000
      );
      proc.once("exit", (code) =>
        reject(new Error(`the Python app exited (${code}): ${stderr}`))
      );
      proc.stdout!.on("data", (d) => {
        buffer += d.toString();
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          const listening = /^listening (\d+)$/.exec(line);
          if (listening) {
            clearTimeout(timer);
            resolve(Number(listening[1]));
          } else if (line) log.push(line);
        }
      });
    });
    return {
      url: `ws://127.0.0.1:${port}/`,
      log,
      stop: async () => {
        proc.kill();
        await sleep(50);
      }
    };
  }

  describe("the Voice SDKs", function () {
    let app: Fixture | undefined;

    afterEach(async () => {
      await app?.stop();
      app = undefined;
    });

    /** The phone calls the fixture app at `to`. */
    async function sdkCall(to: string) {
      await start({ url: app!.url });
      const c = await harness.roomrNode.offerCall({ from: CALLER, to });
      await harness.roomrNode.answered(c.callRef);
      return c;
    }

    /** transfer() (cold, with a header), then transfer() warm and completeTransfer(). */
    async function transfers(fixture: () => Promise<Fixture>) {
      app = await fixture();
      const log = app.log;
      // A cold transfer: transfer() resolves once the session ends with reason transfer.
      const cold = await sdkCall(COLD);
      await waitFor(
        () => log.includes("transfer resolved"),
        8000,
        "transfer() to resolve"
      );
      const transfer = (await nodeCommands()).find(
        (m) => m.type === "transfer"
      )!;
      expect(transfer.mode).to.equal("cold");
      expect(transfer.to).to.deep.include({ uri: TARGET });
      expect(
        (transfer.to as { headers: Record<string, string> }).headers
      ).to.include({
        "X-Customer-Id": "c-42"
      });
      await sleep(500);
      expect((await status(cold)).state).to.equal("answered");
      expect((await status(cold)).held).to.equal(false);
      await appbridge!.stop();
      appbridge = undefined;
      harness.roomrNode.callerHangup(cold.callRef);

      // A warm transfer: completing before the answer is refused, the caller is held through
      // the briefing, then connected once the app was told the new party answered.
      harness.roomrNode.configure({ answerAfterMs: 1500 });
      const warm = await sdkCall(WARM);
      await waitFor(
        async () => (await status(warm)).held,
        5000,
        "the caller on hold"
      );
      await waitFor(
        () => log.includes("warm transfer resolved"),
        10000,
        "the warm transfer to resolve"
      );
      expect(log.slice(log.indexOf("transfer resolved") + 1)).to.deep.equal([
        "early complete refused transfer_not_answered",
        "transfer answered",
        "warm transfer resolved"
      ]);
      expect((await nodeCommands()).map((m) => m.type)).to.include(
        "transferComplete"
      );
      await waitFor(
        async () => !(await status(warm)).held,
        3000,
        "the caller off hold"
      );
      expect((await status(warm)).state).to.equal("answered");
    }

    /** The dtmf listener, playDtmf, hold and resume, driven by the caller's keys. */
    async function keys(fixture: () => Promise<Fixture>) {
      app = await fixture();
      const log = app.log;
      const c = await sdkCall(KEYS);
      await sleep(300);
      // The caller's keys reach the handler's dtmf listener, one at a time.
      await c.fake.dtmf("1");
      await waitFor(() => log.includes("dtmf 1"), 3000, "the handler to see 1");
      await c.fake.dtmf("5");
      await waitFor(() => log.includes("dtmf 5"), 3000, "the handler to see 5");
      expect(log.filter((l) => l.startsWith("dtmf"))).to.deep.equal([
        "dtmf 1",
        "dtmf 5"
      ]);
      // playDtmf("12#") on 5: the phone receives the app's keys.
      await waitFor(
        async () => (await status(c)).phone!.digits === "12#",
        5000,
        "the phone to receive 12#"
      );
      // hold() on 7, resume() and say() on 8: the phone's call is held, back, and hears the app.
      await c.fake.dtmf("7");
      await waitFor(
        async () => (await status(c)).held,
        3000,
        "the caller on hold"
      );
      const resumed = Date.now();
      await c.fake.dtmf("8");
      await waitFor(
        async () => !(await status(c)).held,
        3000,
        "the caller off hold"
      );
      await waitFor(
        () => log.includes("said after resume"),
        8000,
        "say() after resume"
      );
      expect(
        (await status(c, resumed)).phone!.audibleMsSince
      ).to.be.greaterThan(300);
    }

    it("[XFR-011] TypeScript: transfer() and completeTransfer() move the caller to the new party", () =>
      transfers(typescriptApp));

    it("[XFR-012] TypeScript: dtmf events, playDtmf, hold and resume reach the phone", () =>
      keys(typescriptApp));

    it("[XFR-013] Python: transfer() and complete_transfer() move the caller to the new party", () =>
      transfers(pythonApp));

    it("[XFR-014] Python: dtmf events, play_dtmf, hold and resume reach the phone", () =>
      keys(pythonApp));
  });
});
