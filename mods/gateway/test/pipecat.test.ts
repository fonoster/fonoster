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
import * as net from "net";
import * as path from "path";
import { expect } from "chai";
import { NatsConnection, connect } from "nats";
import { FakesHarness } from "@fonoster/conformance";
import { Gateway, MemoryCallRecordSink } from "../src";

// Golden test (task 1.6, conformance 3.3): an unmodified Pipecat bot (TwilioFrameSerializer +
// FastAPIWebsocketTransport) against the twilio flavor. Needs NATS and a Python with pipecat-ai:
// CONFORMANCE_NATS_URL=nats://127.0.0.1:4222 PIPECAT_PYTHON=python/.venv-pipecat/bin/python
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const PYTHON = process.env.PIPECAT_PYTHON;
const BOT = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "python",
  "pipecat-golden",
  "golden_bot.py"
);
// Built at run time so it never looks like a real Twilio SID to secret scanners.
const ACCOUNT_SID = `AC${"0".repeat(31)}1`;
const AUTH_TOKEN = "golden-token";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, "127.0.0.1", () => {
      const port = (s.address() as net.AddressInfo).port;
      s.close(() => resolve(port));
    });
  });
}

async function waitFor<T>(
  fn: () => T | undefined | false,
  ms = 10000,
  what = "condition"
): Promise<T> {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(25);
  }
}

class Bot {
  readonly events: Record<string, unknown>[] = [];
  private proc: ChildProcess;

  constructor(port: number, baseUrl: string, autoHangUp: boolean) {
    const args = [
      BOT,
      "--port",
      String(port),
      "--base-url",
      baseUrl,
      "--account-sid",
      ACCOUNT_SID,
      "--auth-token",
      AUTH_TOKEN
    ];
    if (autoHangUp) args.push("--auto-hang-up");
    this.proc = spawn(PYTHON!, args, { stdio: ["ignore", "pipe", "pipe"] });
    let buffer = "";
    this.proc.stdout!.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop()!;
      for (const line of lines) {
        try {
          this.events.push(JSON.parse(line));
        } catch {
          // Pipecat's own log lines
        }
      }
    });
    this.proc.stderr!.on("data", () => undefined);
  }

  saw(event: string) {
    return this.events.find((e) => e.event === event);
  }

  async ready(port: number) {
    await waitFor(() => this.saw("listening"), 20000, "the bot to start");
    await waitFor(
      () =>
        new Promise<boolean>((resolve) => {
          const s = net.connect(port, "127.0.0.1", () => {
            s.end();
            resolve(true);
          });
          s.on("error", () => resolve(false));
        }),
      1
    ).catch(() => undefined);
    for (let i = 0; i < 100; i++) {
      const open = await new Promise<boolean>((resolve) => {
        const s = net.connect(port, "127.0.0.1", () => {
          s.end();
          resolve(true);
        });
        s.on("error", () => resolve(false));
      });
      if (open) return;
      await sleep(100);
    }
    throw new Error("the bot never listened");
  }

  stop() {
    this.proc.stdout?.destroy();
    this.proc.stderr?.destroy();
    this.proc.kill("SIGKILL");
    this.proc.unref();
  }
}

describe("@gateway Pipecat golden test (twilio flavor)", function () {
  this.timeout(60000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let gateway: Gateway;
  let bot: Bot;
  let record: MemoryCallRecordSink;

  before(async function () {
    if (!NATS_URL || !PYTHON) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  afterEach(async function () {
    bot?.stop();
    await gateway?.stop();
    await harness?.stop();
  });

  async function setup(autoHangUp: boolean) {
    harness = await new FakesHarness().start();
    harness.mediaNode.attachNats(nc);
    harness.mediaNode.configure({ callerAudio: { kind: "tone", ms: 3000 } });
    const botPort = await freePort();
    const httpPort = await freePort();
    record = new MemoryCallRecordSink();
    gateway = await new Gateway({
      nats: nc,
      record,
      config: {
        nats: { url: NATS_URL! },
        testMode: true,
        http: {
          host: "127.0.0.1",
          port: httpPort,
          accountSid: ACCOUNT_SID,
          authToken: AUTH_TOKEN
        },
        apps: [
          {
            ref: "pipecat",
            url: `ws://127.0.0.1:${botPort}/ws`,
            flavor: "twilio",
            signingSecret: "unused-by-pipecat",
            speech: { voice: "fake/default", language: "en-US" }
          }
        ],
        providers: {}
      }
    }).start();
    bot = new Bot(botPort, `http://127.0.0.1:${httpPort}`, autoHangUp);
    await bot.ready(botPort);
  }

  const commands = () => harness.mediaNode.commands.map((c) => c.command.type);
  const endEvents = () =>
    [...record.records.values()].flat().map((e) => e.message.type as string);

  it("hears the caller, is heard, barges in with clear, reads DTMF and hangs up through base_url", async function () {
    await setup(true);
    const since = Date.now();
    harness.mediaNode.offerCall();

    const connected = await waitFor(
      () => bot.saw("connected"),
      10000,
      "the bot to get the stream"
    );
    expect(connected).to.include({ transport: "twilio" });
    await waitFor(
      () => bot.saw("caller_audio"),
      10000,
      "caller audio at the bot"
    );
    await waitFor(
      () => harness.mediaNode.outputAudioMs(since) > 500,
      10000,
      "the bot's audio at the caller"
    );

    harness.mediaNode.pressKey("1");
    await waitFor(() => bot.saw("interrupted"), 5000, "the bot to interrupt");
    const cut = Date.now();
    await sleep(400);
    // The 4 s tone stopped: nothing audible arrived well after the clear.
    expect(harness.mediaNode.outputSilentWithinMs(cut)).to.be.lessThan(200);

    harness.mediaNode.pressKey("9");
    await waitFor(() => commands().includes("hangup"), 10000, "the hang-up");
    expect(bot.events.map((e) => e.event)).to.include.members([
      "dtmf",
      "ending"
    ]);
    // Hung up through the Calls endpoint (app_hangup), not by a dropped socket.
    expect(endEvents()).not.to.include("app.dropped");
  });

  it("hangs up when the bot closes its socket", async function () {
    await setup(false);
    harness.mediaNode.offerCall();
    await waitFor(
      () => bot.saw("connected"),
      10000,
      "the bot to get the stream"
    );
    harness.mediaNode.pressKey("9");
    await waitFor(
      () => commands().includes("hangup"),
      10000,
      "the hang-up"
    ).catch((e) => {
      throw new Error(
        `${e.message}; bot events: ${JSON.stringify(bot.events)}`
      );
    });
    expect(endEvents()).to.include("app.dropped");
  });
});
