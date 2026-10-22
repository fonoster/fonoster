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
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import { struct } from "pb-util";
import { z } from "zod";
import { FakesHarness, Peer } from "@fonoster/conformance";
import { AppBridge, MemoryCallRecordSink, PrismaAppStore } from "../src";
import { AudioFilterFactory } from "../src/filters";
import {
  createTestDb,
  TestDb,
  testDatabaseUrl
} from "../../common/test/persistence/testDb";
import { createCreateApplication } from "../../apiserver/src/applications/createCreateApplication";
import { createGetApplication } from "../../apiserver/src/applications/createGetApplication";
import { createUpdateApplication } from "../../apiserver/src/applications/createUpdateApplication";
import { createCall } from "../../apiserver/src/calls/createCall";
import { TEST_TOKEN } from "../../apiserver/test/utils";

// Apps as the Applications API writes them and AppBridge reads them from the same database: an
// Autopilot agent is an ordinary app, audio filters set through the API run on the next call,
// and CreateCall asks for admission before placing anything. Needs NATS (CONFORMANCE_NATS_URL)
// and a throwaway Postgres (PERSISTENCE_TEST_DATABASE_URL).
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The workspace the apiserver's test token can access. */
const WS = "GRahn02s8tgdfghz72vb0fz538qpb5z35p";

const AGENT = {
  conversationSettings: {
    firstMessage: "Hi, this is Ada.",
    systemPrompt: "You are a helpful receptionist.",
    goodbyeMessage: "Bye!",
    systemErrorMessage: "Sorry, something went wrong."
  },
  languageModel: { model: "openai/gpt-4o-mini" }
};

type Handler = (
  call: unknown,
  callback: (err: unknown, res?: unknown) => void
) => Promise<void> | void;

function invoke<T = Record<string, unknown>>(
  handler: Handler,
  request: unknown
): Promise<T> {
  const metadata = new grpc.Metadata();
  metadata.set("token", TEST_TOKEN);
  metadata.set("accessKeyId", WS);
  return new Promise((resolve, reject) => {
    void handler({ metadata, request }, (err, res) =>
      err ? reject(err) : resolve(res as T)
    );
  });
}

const json = (peer: Peer) =>
  peer.frames.items
    .filter((f) => f.kind === "json")
    .map((f) => f.data as Record<string, unknown>);

async function waitFor<T>(fn: () => T | undefined | false, ms = 4000) {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error("timed out");
    await sleep(20);
  }
}

describe("@appbridge apps from the Applications API (database)", function () {
  this.timeout(60_000);
  let db: TestDb;
  let nc: NatsConnection;
  let harness: FakesHarness;
  let appbridge: AppBridge | undefined;
  let store: PrismaAppStore | undefined;
  let allowed: string | undefined;

  before(async function () {
    if (!NATS_URL || !testDatabaseUrl()) return this.skip();
    db = (await createTestDb())!;
    await db.prisma.product.create({
      data: { ref: "llm.openai", name: "OpenAI", vendor: "OPENAI", type: "LLM" }
    });
    nc = await connect({ servers: NATS_URL });
    // The fake apps listen on loopback, which tenant apps may not use unless allowed.
    allowed = process.env.FONOSTER_ALLOWED_DESTINATIONS;
    process.env.FONOSTER_ALLOWED_DESTINATIONS = "127.0.0.1";
  });

  after(async function () {
    if (allowed === undefined) delete process.env.FONOSTER_ALLOWED_DESTINATIONS;
    else process.env.FONOSTER_ALLOWED_DESTINATIONS = allowed;
    await nc?.close();
    await db?.drop();
  });

  beforeEach(async function () {
    harness = await new FakesHarness().start();
    harness.roomrNode.configure({ callerAudio: { kind: "tone", ms: 400 } });
  });

  afterEach(async function () {
    await appbridge?.stop();
    appbridge = undefined;
    store?.stop();
    store = undefined;
    await harness?.stop();
  });

  /** The apiserver's view: Autopilot agents point at the hosted Autopilot (here, the fake app). */
  const config = () => ({
    autopilotUrl: harness.app.url,
    allowedDestinations: ["127.0.0.1"]
  });

  /** AppBridge reading apps from the database the apiserver writes. */
  async function start(record = new MemoryCallRecordSink()) {
    store = await PrismaAppStore.open(db.prisma, { cacheMs: 0 });
    const urls = harness.providerUrls;
    appbridge = await new AppBridge({
      config: {
        nats: { url: NATS_URL! },
        session: { listen: "127.0.0.1:0" },
        retry: { windowMs: 300, intervalMs: 100 },
        providers: {
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          }
        }
      },
      nats: nc,
      record,
      apps: store
    }).start();
    harness.roomrNode.configure({ endpoint: appbridge.sessionEndpoint });
    return record;
  }

  /** A call to the app; resolves with the app's side once session.start arrived. */
  async function call(appRef: string) {
    const { callRef } = await harness.roomrNode.offerCall({ appRef });
    const { peer } = await harness.app.nextConnection();
    const start = await waitFor(() =>
      json(peer).find((m) => m.type === "session.start")
    );
    return { callRef, peer, start };
  }

  async function hangup(callRef: string, peer: Peer) {
    harness.roomrNode.callerHangup(callRef);
    await waitFor(() => json(peer).find((m) => m.type === "session.end"));
  }

  const stream = (name: string) =>
    invoke<{ ref: string }>(createCreateApplication(db.prisma, config()), {
      name,
      type: "STREAM",
      url: harness.app.url,
      speech: { voice: "fake/default", language: "en-US" }
    });

  it("[APB-033] dials an Autopilot agent at the hosted Autopilot's URL with the same protocol as any app", async function () {
    const agent = await invoke<{ ref: string }>(
      createCreateApplication(db.prisma, config()),
      {
        name: "Receptionist",
        type: "AUTOPILOT",
        intelligence: { config: struct.encode(AGENT) },
        speech: { voice: "fake/default", language: "en-US" }
      }
    );
    const other = await stream("Support bot");
    await start();

    const toAgent = await call(agent.ref);
    expect(harness.app.attempts.at(-1)).to.include({ accepted: true });
    expect(toAgent.start).to.include({
      appRef: agent.ref,
      direction: "inbound"
    });
    await hangup(toAgent.callRef, toAgent.peer);

    const toOther = await call(other.ref);
    // One protocol: the same session.start, field for field, and the same envelope.
    expect(Object.keys(toAgent.start).sort()).to.deep.equal(
      Object.keys(toOther.start).sort()
    );
    expect(toAgent.start.protocol).to.be.a("string");
    expect(toAgent.start.protocol).to.equal(toOther.start.protocol);
    await hangup(toOther.callRef, toOther.peer);
  });

  describe("audio filters set through the Applications API", function () {
    // Stands in for the ai-coustics filter (the SDK and its model are not in the test
    // environment): same name and public options, and it counts the frames it filtered.
    let frames = 0;
    let original: unknown;
    const filters = () =>
      (AudioFilterFactory as unknown as { filters: Map<string, unknown> })
        .filters;

    before(function () {
      original = filters().get("aiCoustics");
      AudioFilterFactory.registerFilter("aiCoustics", {
        description: "counts frames (test only)",
        optionsSchema: z.object({ enhancementLevel: z.number().optional() }),
        publicOptionsSchema: z.object({
          enhancementLevel: z.number().optional()
        }),
        create: () => ({
          name: "aiCoustics",
          delayMs: 0,
          process: (frame: Int16Array) => {
            frames++;
            return frame;
          }
        })
      });
    });

    after(function () {
      if (original) filters().set("aiCoustics", original);
    });

    const update = (ref: string, request: Record<string, unknown>) =>
      invoke(createUpdateApplication(db.prisma, config()), {
        ref,
        name: "Support bot",
        type: "STREAM",
        url: harness.app.url,
        speech: { voice: "fake/default", language: "en-US" },
        ...request
      });

    const read = async (ref: string) => {
      const app = await invoke<{
        filters: { name: string; options?: unknown }[];
      }>(createGetApplication(db.prisma), { ref });
      return app.filters.map((f) =>
        f.options
          ? { name: f.name, options: struct.decode(f.options as never) }
          : { name: f.name }
      );
    };

    /** Frames the filter processed during one call to the app. */
    async function framesOfOneCall(ref: string) {
      await store!.refresh();
      const before = frames;
      const { callRef, peer } = await call(ref);
      // The caller speaks; filters run on the caller's audio once listening starts.
      peer.sendJson({ type: "listen.update" });
      harness.roomrNode.callerSpeaks({ kind: "tone", ms: 400 });
      await sleep(800);
      await hangup(callRef, peer);
      return frames - before;
    }

    it("[APB-034] enables noise cancelling on an app, and the next call runs it", async function () {
      const { ref } = await stream("Support bot");
      await start();
      expect(await framesOfOneCall(ref)).to.equal(0);

      await update(ref, { filters: [{ name: "aiCoustics" }] });
      expect(await read(ref)).to.deep.equal([{ name: "aiCoustics" }]);
      expect(await framesOfOneCall(ref)).to.be.greaterThan(10);
    });

    it("[APB-034] accepts a public option and stores it", async function () {
      const { ref } = await stream("Support bot");
      await update(ref, {
        filters: [
          {
            name: "aiCoustics",
            options: struct.encode({ enhancementLevel: 0.8 })
          }
        ]
      });
      expect(await read(ref)).to.deep.equal([
        { name: "aiCoustics", options: { enhancementLevel: 0.8 } }
      ]);
    });

    it("[APB-034] rejects a server-side option or an unknown filter, naming it, and keeps the app", async function () {
      const { ref } = await stream("Support bot");
      await update(ref, { filters: [{ name: "aiCoustics" }] });

      const option = await update(ref, {
        filters: [
          {
            name: "aiCoustics",
            options: struct.encode({ modelFile: "/etc/passwd" })
          }
        ]
      }).catch(failure);
      expect(option).to.include({ code: grpc.status.INVALID_ARGUMENT });
      expect((option as { message: string }).message).to.contain("modelFile");
      expect(await read(ref)).to.deep.equal([{ name: "aiCoustics" }]);

      const unknown = await update(ref, {
        filters: [{ name: "krisp" }]
      }).catch(failure);
      expect(unknown).to.include({ code: grpc.status.INVALID_ARGUMENT });
      expect((unknown as { message: string }).message).to.contain("krisp");
      expect(await read(ref)).to.deep.equal([{ name: "aiCoustics" }]);
    });

    it("[APB-034] clears the filters with an empty list or none at all, and the next call is unfiltered", async function () {
      const { ref } = await stream("Support bot");
      await start();
      await update(ref, { filters: [{ name: "aiCoustics" }] });
      await update(ref, { filters: [] });
      expect(await read(ref)).to.deep.equal([]);
      expect(await framesOfOneCall(ref)).to.equal(0);

      await update(ref, { filters: [{ name: "aiCoustics" }] });
      await update(ref, {});
      expect(await read(ref)).to.deep.equal([]);
      expect(await framesOfOneCall(ref)).to.equal(0);
    });
  });

  it("[APB-036] refuses an outbound call before placing it when admission says concurrency_limit", async function () {
    const { ref } = await stream("Outbound bot");
    const placed: unknown[] = [];
    const asked: Record<string, unknown>[] = [];
    const handler = createCall(
      db.prisma,
      {
        publishCall: async (c: unknown) => {
          placed.push(c);
        }
      } as never,
      async () => true,
      async (request) => {
        asked.push(request);
        return { authorized: false, reason: "concurrency_limit" };
      }
    );
    const error = await invoke(handler as Handler, {
      from: "+15550001111",
      to: "+15551234567",
      appRef: ref
    }).catch(failure);
    expect(error).to.include({ code: grpc.status.FAILED_PRECONDITION });
    expect((error as { message: string }).message).to.contain(
      "concurrency_limit"
    );
    expect(asked).to.have.length(1);
    expect(asked[0]).to.include({ appRef: ref, accessKeyId: WS });
    expect(placed).to.deep.equal([]);
  });
});

function failure(e: unknown) {
  return {
    code: (e as grpc.ServiceError).code,
    message: (e as Error).message
  };
}
