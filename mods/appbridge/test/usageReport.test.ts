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
import { generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { NatsConnection, StringCodec, connect } from "nats";
import {
  CallRecordWriter,
  RECORD_SEALED_SUBJECT,
  RecordIndexEntry,
  RecordStore,
  decodeVcon,
  fsStores
} from "@fonoster/callrecord";
import { FakesHarness, Peer } from "@fonoster/conformance";
import { AppConfig, AppBridge } from "../src";

// voice-session "Autopilot reports model usage to the call": an Autopilot agent's usage.report
// joins the call's sealed usage, and nothing about it reaches the app or the Roomr node; any
// other app, or any other meter, is refused. Needs NATS (CONFORMANCE_NATS_URL).
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const sc = StringCodec();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | undefined | false, ms = 5000) {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error("timed out");
    await sleep(20);
  }
}

const json = (peer: Peer) =>
  peer.frames.items
    .filter((f) => f.kind === "json")
    .map((f) => f.data as Record<string, unknown>);

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const KEY = {
  kid: "gw-test",
  privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
};

type Line = {
  meter: string;
  quantity: number;
  provider?: string;
  model?: string;
  keySource?: string;
};

describe("@appbridge usage.report from Autopilot", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let appbridge: AppBridge | undefined;
  let writer: CallRecordWriter;
  let store: RecordStore;
  let dir: string;
  let indexed: RecordIndexEntry[];
  let stopIndex: () => void;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  beforeEach(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "appbridge-usage-report-"));
    harness = await new FakesHarness().start();
    indexed = [];
    const sub = nc.subscribe(RECORD_SEALED_SUBJECT, {
      callback: (_e, msg) => indexed.push(JSON.parse(sc.decode(msg.data)))
    });
    stopIndex = () => sub.unsubscribe();
    const stores = fsStores(dir);
    store = stores.store;
    writer = new CallRecordWriter({
      ...stores,
      key: KEY,
      region: "test-region",
      onSealed: (e) => appbridge?.onRecordSealed(e)
    });
  });

  afterEach(async () => {
    stopIndex?.();
    await appbridge?.stop();
    appbridge = undefined;
    await harness?.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  async function start(type: AppConfig["type"]) {
    const urls = harness.providerUrls;
    appbridge = await new AppBridge({
      config: {
        nats: { url: NATS_URL! },
        session: { listen: "127.0.0.1:0" },
        apps: [
          {
            ref: "a",
            url: harness.app.url,
            protocol: "fonoster",
            signingSecret: "s",
            workspaceRef: "ws-1",
            type,
            speech: { voice: "fake/default", language: "en-US" }
          }
        ],
        providers: {
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          }
        },
        callRecord: {
          dir,
          region: "test-region",
          signingKey: { kid: KEY.kid, privateKeyFile: "unused" },
          recordUrl: "https://api.example.com/api/records"
        }
      },
      nats: nc,
      record: writer
    }).start();
    harness.roomrNode.configure({ endpoint: appbridge.sessionEndpoint });
  }

  /** An answered call with the app's session open. */
  async function answered() {
    const { callRef } = await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    await harness.roomrNode.answered(callRef);
    return { callRef, peer };
  }

  /** The usage lines sealed with the call once the caller hangs up. */
  async function sealedUsage(callRef: string) {
    harness.roomrNode.callerHangup(callRef);
    await waitFor(() => indexed.find((e) => e.callRef === callRef), 10000);
    await writer.flush();
    const record = (await store.getSealed(callRef))!;
    return (
      ((decodeVcon(record.signed).fonoster as { usage?: Line[] }).usage ??
        []) as Line[]
    ).filter((l) => l.meter.startsWith("llm.") || l.meter === "call.seconds");
  }

  const tokens = (meter: string, quantity: number): Line => ({
    meter,
    quantity,
    provider: "openai",
    model: "gpt-4o-mini",
    keySource: "platform"
  });

  it("[APB-035] adds an Autopilot agent's tokens to the call's usage, telling neither the app nor the node", async function () {
    await start("AUTOPILOT");
    const { callRef, peer } = await answered();
    const node = (await harness.roomrNode.freshCommands()).length;
    const events = json(peer).length;
    peer.sendJson({
      type: "usage.report",
      id: "u1",
      lines: [tokens("llm.tokens.in", 1200), tokens("llm.tokens.out", 340)]
    });
    await sleep(300);
    expect(json(peer).slice(events)).to.deep.equal([]);
    expect(await harness.roomrNode.freshCommands()).to.have.length(node);
    expect(await sealedUsage(callRef)).to.deep.include.members([
      tokens("llm.tokens.in", 1200),
      tokens("llm.tokens.out", 340)
    ]);
  });

  it("[APB-035] refuses usage.report from an app that is not an Autopilot agent", async function () {
    await start("STREAM");
    const { callRef, peer } = await answered();
    peer.sendJson({
      type: "usage.report",
      id: "u2",
      lines: [tokens("llm.tokens.in", 1200)]
    });
    const error = await waitFor(() =>
      json(peer).find((m) => m.type === "error" && m.relatesTo === "u2")
    );
    expect(error.code).to.equal("bad_message");
    expect(await sealedUsage(callRef)).to.deep.equal([]);
  });

  it("[APB-035] refuses usage.report for a meter outside the allowed set", async function () {
    await start("AUTOPILOT");
    const { callRef, peer } = await answered();
    peer.sendJson({
      type: "usage.report",
      id: "u3",
      lines: [{ ...tokens("call.seconds", 999), model: undefined }]
    });
    const error = await waitFor(() =>
      json(peer).find((m) => m.type === "error" && m.relatesTo === "u3")
    );
    expect(error.code).to.equal("bad_message");
    const usage = await sealedUsage(callRef);
    expect(usage.filter((l) => l.quantity === 999)).to.deep.equal([]);
  });
});
