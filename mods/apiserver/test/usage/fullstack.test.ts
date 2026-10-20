/**
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
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { generateKeyPairSync } from "crypto";
import {
  CallRecordWriter,
  fsStores,
  RecordEntry,
  RecordIndexEntry
} from "@fonoster/callrecord";
import { FakesHarness, fakeUsage } from "@fonoster/conformance";
import { VoiceServer } from "@fonoster/voice";
import { Metadata } from "@grpc/grpc-js";
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import { AppBridge } from "../../../appbridge/src";
import { createAutopilotHandler } from "../../../autopilot/src/session";
import { createIndexRecord } from "../../src/records/createIndexRecord";
import { RecordsDb } from "../../src/records/types";
import { createGetUsage } from "../../src/usage/createGetUsage";
import { createTestDb, TestDb } from "../../../common/test/persistence/testDb";

// Usage end to end (add-usage-metering 7.1): an Autopilot call through the real AppBridge on
// the fakes, sealed with the real record writer, indexed twice (a replay), and read back with
// GetUsage. Token counts must equal the fake LLM's fixed counts, also for an interrupted reply.
// Needs CONFORMANCE_NATS_URL and PERSISTENCE_TEST_DATABASE_URL.

const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const SECRET = "usage-fullstack";
const WS = "WOusageFS000000000000000000000000".slice(0, 32);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

async function waitFor<T>(
  fn: () => T | undefined | false,
  ms: number,
  what: string
) {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(25);
  }
}

type Line = {
  meter: string;
  quantity: number;
  provider?: string;
  model?: string;
  keySource?: string;
};

describe("@apiserver/usage end to end", function () {
  this.timeout(60_000);
  let nc: NatsConnection;
  let db: TestDb | undefined;

  before(async function () {
    if (!NATS_URL) return this.skip();
    db = await createTestDb();
    if (!db) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => {
    await nc?.close();
    await db?.drop();
  });

  beforeEach(async () => {
    await db?.prisma.$executeRawUnsafe(
      "TRUNCATE usage_events, usage_daily, call_records"
    );
  });

  /** Runs one Autopilot call and returns its sealed index entry and the LLM's conversations. */
  async function call(options: {
    reply: string;
    chunkDelayMs?: number;
    bargeIn?: boolean;
  }) {
    const harness = await new FakesHarness().start();
    harness.roomrNode.attachNats(nc);
    harness.stt.configure({
      script: [{ atMs: 600, text: "What are your hours?" }]
    });
    harness.llm.configure({
      script: [{ content: options.reply, chunkDelayMs: options.chunkDelayMs }]
    });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "usage-fullstack-"));
    const sealed: RecordIndexEntry[] = [];
    const appended: RecordEntry[] = [];
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const writer = new CallRecordWriter({
      ...fsStores(dir),
      key: {
        kid: "k",
        privateKeyPem: privateKey
          .export({ type: "pkcs8", format: "pem" })
          .toString()
      },
      region: "default",
      onSealed: (e) => sealed.push(e)
    });
    const append = writer.append.bind(writer);
    writer.append = (callRef: string, entry: RecordEntry) => {
      appended.push(entry);
      append(callRef, entry);
    };
    const autopilot = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      signingSecret: SECRET
    }).listen(
      createAutopilotHandler({
        agent: {
          conversationSettings: {
            systemPrompt: "You are the receptionist of a dental clinic.",
            goodbyeMessage: "Goodbye!",
            systemErrorMessage: "Sorry, something went wrong."
          },
          languageModel: { model: "fake/llm" }
        },
        providers: { fake: { baseUrl: harness.llm.url } }
      })
    );
    const urls = harness.providerUrls;
    const appbridge = await new AppBridge({
      nats: nc,
      record: writer,
      config: {
        nats: { url: NATS_URL! },
        apps: [
          {
            ref: "autopilot",
            type: "AUTOPILOT",
            workspaceRef: WS,
            url: `ws://127.0.0.1:${autopilot.port}/`,
            protocol: "fonoster",
            signingSecret: SECRET,
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
    try {
      const { roomRef } = harness.roomrNode.offerCall({
        from: "+15550001111",
        to: "+15550002222"
      });
      harness.caller({ audio: { kind: "tone", ms: 700 } });
      await waitFor(
        () => appended.find((e) => e.message.type === "output.started"),
        10_000,
        "the reply"
      );
      if (options.bargeIn) {
        await sleep(300);
        harness.caller({ audio: { kind: "tone", ms: 900 } });
        await waitFor(
          () => appended.find((e) => e.message.type === "output.interrupted"),
          8000,
          "the interruption"
        );
      }
      await waitFor(
        () => appended.find((e) => e.message.type === "usage.report"),
        10_000,
        "usage.report"
      );
      await sleep(300);
      harness.roomrNode.callerHangup(roomRef);
      await waitFor(() => sealed[0], 10_000, "the sealed record");
      return {
        entry: sealed[0],
        conversations: harness.llm.conversations,
        appended
      };
    } finally {
      await appbridge.stop();
      await autopilot.close();
      await harness.stop();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  async function usageOf(entry: RecordIndexEntry) {
    const index = createIndexRecord(db!.prisma as RecordsDb, {
      directory: () => ({ workspace: async () => ({ ownerRef: "owner" }) })
    });
    await index(entry);
    await index(entry);
    const metadata = new Metadata();
    metadata.set("accessKeyId", WS);
    const response = await new Promise<{
      rows: { meter: string; keySource: string; quantity: number }[];
    }>((resolve, reject) =>
      createGetUsage(db!.prisma)(
        {
          request: {
            fromDay: new Date(Date.now() - 86_400_000)
              .toISOString()
              .slice(0, 10),
            toDay: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
            groupBy: ["key_source"]
          },
          metadata
        } as never,
        (e: unknown, r: never) => (e ? reject(e) : resolve(r))
      )
    );
    return { events: await db!.prisma.usageEvent.count(), rows: response.rows };
  }

  it("meters an Autopilot call exactly, from the sealed record to GetUsage", async () => {
    const reply = "We open at nine. We close at five.";
    const { entry, conversations } = await call({ reply });
    const lines = entry.usage as Line[];
    const counts = fakeUsage(conversations[0].messages, { content: reply });
    const line = (meter: string) => lines.find((l) => l.meter === meter);
    expect(line("llm.tokens.in")).to.deep.equal({
      meter: "llm.tokens.in",
      quantity: counts.prompt_tokens,
      provider: "fake",
      model: "fake/llm",
      keySource: "platform"
    });
    expect(line("llm.tokens.out")!.quantity).to.equal(words(reply));
    expect(line("tts.characters")!.quantity).to.equal(reply.length);
    expect(line("stt.seconds")!.quantity).to.be.at.least(1);
    expect(line("call.seconds")!.quantity).to.be.at.least(1);
    expect(entry.origin).to.equal("call");

    const { events, rows } = await usageOf(entry);
    expect(events).to.equal(lines.length);
    expect(
      Object.fromEntries(rows.map((r) => [r.meter, r.quantity]))
    ).to.deep.equal(
      Object.fromEntries(lines.map((l) => [l.meter, l.quantity]))
    );
  });

  it("meters the whole request of a reply the caller cut into", async () => {
    const reply =
      "We open at nine in the morning. We close at five in the afternoon. On Saturdays we open at ten and close at two. On Sundays the clinic stays closed.";
    const { entry, conversations, appended } = await call({
      reply,
      chunkDelayMs: 500,
      bargeIn: true
    });
    expect(
      appended.some((e) => e.message.type === "output.interrupted")
    ).to.equal(true);
    const lines = entry.usage as Line[];
    const counts = fakeUsage(conversations[0].messages, { content: reply });
    expect(
      lines.find((l) => l.meter === "llm.tokens.in")!.quantity
    ).to.be.at.least(counts.prompt_tokens);
    expect(
      lines.find((l) => l.meter === "llm.tokens.out")!.quantity
    ).to.be.at.least(words(reply));
    expect(
      appended.some(
        (e) =>
          (e.message as { data?: { type?: string } }).data?.type ===
          "usage_missing"
      )
    ).to.equal(false);
  });
});
