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
import { expect } from "chai";
import { NatsConnection, connect } from "nats";
import { FakeSessionCall, FakesHarness } from "@fonoster/conformance";
import { AppBridge, MemoryCallRecordSink } from "@fonoster/appbridge";
import { VoiceServer } from "@fonoster/voice";
import { createAutopilotHandler } from "../../src/session";

// Catalog area XFR (mods/conformance/catalog/areas/transfers.md): Autopilot's built-in transfer
// and hangup tools, end to end. The fake LLM calls the tool; Autopilot runs over the session
// protocol against the real AppBridge, which serves the call from a real Roomr node in
// roomr-fake; the node's phone is the caller (and the new party). Needs NATS: CONFORMANCE_NATS_URL.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const SECRET = "xfr-autopilot";
const OPERATOR = "+15551234567";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

describe("@autopilot built-in transfer and hangup end to end (XFR)", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let autopilot: VoiceServer | undefined;
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

  afterEach(async function () {
    await appbridge?.stop();
    await autopilot?.close();
    await harness?.stop();
  });

  /** Autopilot whose model calls `tool` after the caller's first turn, on a call from the phone. */
  async function callAgent(tool: "transfer" | "hangup") {
    harness = await new FakesHarness().start();
    record = new MemoryCallRecordSink();
    harness.stt.configure({ script: [{ atMs: 600, text: "I want a human." }] });
    harness.llm.configure({
      script: [{ tool_calls: [{ name: tool, arguments: {} }] }]
    });
    autopilot = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      signingSecret: SECRET
    }).listen(
      createAutopilotHandler({
        agent: {
          conversationSettings: {
            systemPrompt: "You are the receptionist of a dental clinic.",
            goodbyeMessage: "Goodbye, and thanks for calling.",
            systemErrorMessage: "Sorry, something went wrong.",
            transferOptions: {
              phoneNumber: OPERATOR,
              message: "Transferring you to a person, please hold."
            }
          },
          languageModel: { model: "fake/llm" }
        },
        providers: { fake: { baseUrl: harness.llm.url } }
      })
    );
    const urls = harness.providerUrls;
    appbridge = await new AppBridge({
      nats: nc,
      record,
      config: {
        nats: { url: NATS_URL! },
        session: { listen: "127.0.0.1:0" },
        apps: [
          {
            ref: "autopilot",
            type: "AUTOPILOT",
            url: `ws://127.0.0.1:${autopilot.port}/`,
            protocol: "fonoster",
            signingSecret: SECRET,
            workspaceRef: "W1",
            speech: {
              voice: "fake/default",
              language: "en-US",
              silenceTimeoutMs: 400
            }
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
    const c = await harness.roomrNode.offerCall({
      from: "+15550001111",
      to: "+15550002222"
    });
    await harness.roomrNode.answered(c.callRef);
    harness.caller({ audio: { kind: "tone", ms: 700 } });
    return c;
  }

  const entries = () => [...record.records.values()][0] ?? [];
  const nodeCommands = async () =>
    (await harness.roomrNode.freshCommands()).map((c) => c.command);

  /** When the message's speech finished playing to the caller (output.done in the record). */
  async function spoken(c: FakeSessionCall, text: string) {
    const speak = await waitFor(
      () =>
        entries().find(
          (e) =>
            e.source === "app" &&
            e.message.type === "speak" &&
            String(e.message.text).includes(text)
        ),
      10000,
      `"${text}" to be spoken`
    );
    const done = await waitFor(
      () =>
        entries().find(
          (e) =>
            e.message.type === "output.done" &&
            e.message.id === speak.message.id
        ),
      10000,
      `"${text}" to finish playing`
    );
    const heard = (await c.fake.status(speak.at)).phone!.audibleMsSince;
    return { at: done.at, heard };
  }

  it("[XFR-015] the transfer tool speaks the transfer message, then leaves the caller with the operator", async function () {
    const c = await callAgent("transfer");
    const message = await spoken(c, "Transferring you to a person");
    // The caller heard the whole message before the node was asked to transfer.
    expect(message.heard).to.be.greaterThan(1000);
    const transfer = await waitFor(
      async () =>
        (await harness.roomrNode.freshCommands()).find(
          (r) => r.command.type === "transfer"
        ),
      5000,
      "the node's Transfer"
    );
    expect(transfer.at).to.be.at.least(message.at);
    expect(transfer.command.to).to.deep.equal({
      uri: OPERATOR,
      headers: { "X-Dod-Number": "+15550002222", "X-Access-Key-Id": "W1" }
    });
    // The operator answers: Autopilot's session ends with transfer and the caller stays on.
    await waitFor(
      () =>
        entries().find(
          (e) =>
            e.message.type === "session.end" && e.message.reason === "transfer"
        ),
      5000,
      "session.end with reason transfer"
    );
    await sleep(800);
    const after = await c.fake.status();
    expect(after.state).to.equal("answered");
    expect(after.phone!.state).to.equal("answered");
    expect((await nodeCommands()).map((m) => m.type)).to.not.include("hangup");
  });

  it("[XFR-016] the hangup tool says goodbye, then hangs the phone up", async function () {
    const c = await callAgent("hangup");
    const goodbye = await spoken(c, "Goodbye, and thanks");
    expect(goodbye.heard).to.be.greaterThan(1000);
    const ended = await harness.roomrNode.ended(c.callRef, 5000);
    // The node removed the call at the app's hang-up, after the goodbye played.
    expect(ended.cause).to.equal("removed");
    const hangup = (await harness.roomrNode.freshCommands()).find(
      (r) => r.command.type === "hangup"
    );
    expect(hangup?.at).to.be.at.least(goodbye.at);
    await waitFor(
      async () => (await c.fake.status()).phone?.state !== "answered",
      3000,
      "the phone's leg to end"
    );
    const end = entries().find((e) => e.message.type === "session.end");
    expect(end?.message.reason).to.equal("app_hangup");
  });
});
