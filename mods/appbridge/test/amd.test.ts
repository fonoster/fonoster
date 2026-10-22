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
import { expect } from "chai";
import { NatsConnection, connect } from "nats";
import { FakesHarness, Peer } from "@fonoster/conformance";
import {
  AmdVerdict,
  AppConfig,
  AppBridge,
  MemoryCallRecordSink,
  amdWindowMs,
  loadAmdClassifier
} from "../src";

// AMD as a voice-worker listener (add-roomr 4.3): an app with `amd` gets one `amd.result`
// event, classified from the caller's track only, received through media-control
// listener.attach. Needs NATS.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
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

describe("@appbridge AMD listener", function () {
  this.timeout(20000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let appbridge: AppBridge | undefined;
  let record: MemoryCallRecordSink;
  let heard: Buffer[];

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  beforeEach(async () => {
    harness = await new FakesHarness().start();
    harness.roomrNode.configure({ callerAudio: { kind: "tone", ms: 600 } });
    record = new MemoryCallRecordSink();
    heard = [];
  });

  afterEach(async () => {
    await appbridge?.stop();
    appbridge = undefined;
    await harness?.stop();
  });

  async function start(app: Partial<AppConfig>, classifier = true) {
    const urls = harness.providerUrls;
    appbridge = await new AppBridge({
      config: {
        nats: { url: NATS_URL! },
        session: { listen: "127.0.0.1:0" },
        ...(classifier ? {} : { amd: { enabled: false } }),
        retry: { windowMs: 300, intervalMs: 100 },
        apps: [
          {
            ref: "a",
            url: harness.app.url,
            protocol: "fonoster",
            signingSecret: "s",
            workspaceRef: "ws-1",
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
      },
      nats: nc,
      record,
      amdClassifier: classifier
        ? async (pcm): Promise<AmdVerdict> => {
            heard.push(pcm);
            return { status: "machine", confidence: 0.93, detector: "fake" };
          }
        : undefined
    }).start();
    harness.roomrNode.configure({ endpoint: appbridge.sessionEndpoint });
  }

  it("[APB-019] reads amd options", function () {
    expect(amdWindowMs(undefined)).to.equal(undefined);
    expect(amdWindowMs(false)).to.equal(undefined);
    expect(amdWindowMs(true)).to.equal(4000);
    expect(amdWindowMs({ windowMs: 100 })).to.equal(500);
    expect(amdWindowMs({ enabled: false, windowMs: 3000 })).to.equal(undefined);
  });

  it("[APB-019] classifies the caller's track and sends amd.result to the session", async function () {
    await start({ amd: { windowMs: 500 } });
    const { callRef } = await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    const result = await waitFor(
      () => json(peer).find((m) => m.type === "amd.result"),
      8000
    );
    expect(result).to.deep.include({
      status: "machine",
      confidence: 0.93,
      detector: "fake"
    });
    expect(result.audioMs).to.be.within(480, 520);

    // One listener with one track: the caller's.
    const commands = harness.roomrNode.commands.map((c) => c.command);
    const attach = commands.find((c) => c.type === "addListener")!;
    const tracks = attach.listen as {
      trackId: number;
      rtp: { codec: string };
    }[];
    expect(tracks).to.have.length(1);
    expect(tracks[0].rtp.codec).to.equal("L16/16000");
    await waitFor(() =>
      harness.roomrNode.commands.find(
        (c) => c.command.type === "removeListener"
      )
    );
    // The fake honors the detach: the listener's forks are gone (AO-B3).
    await waitFor(() => harness.roomrNode.activeListeners() === 0);

    // The classifier got 16 kHz PCM with the caller's tone in it.
    const pcm = heard[0];
    expect(pcm.length).to.equal(16000 * 2 * 0.5);
    let loud = 0;
    for (let i = 0; i < pcm.length; i += 2)
      if (Math.abs(pcm.readInt16LE(i)) > 1000) loud++;
    expect(loud).to.be.greaterThan(800);

    // The call record has the run and its verdict.
    const types = (record.records.get(callRef) ?? []).map(
      (e) => (e.message as { type?: string }).type
    );
    expect(types).to.include.members(["amd.started", "amd.result"]);
    harness.roomrNode.callerHangup(callRef);

    // One metered detection of the audio it classified (add-usage-metering D3).
    const snapshot = await waitFor(() =>
      (record.records.get(callRef) ?? [])
        .map((e) => e.message as { type?: string; lines?: unknown[] })
        .filter((m) => m.type === "usage.snapshot")
        .pop()
    );
    expect(snapshot.lines).to.deep.include.members([
      { meter: "amd.detections", quantity: 1 },
      { meter: "amd.seconds", quantity: 1 }
    ]);
  });

  it("[APB-019] starts the window when the caller starts speaking, not at answer", async function () {
    // 1.2 s of carrier silence, then the greeting.
    const silence = Buffer.alloc(16000 * 2 * 1.2);
    const tone = Buffer.alloc(16000 * 2 * 1);
    for (let i = 0; i < tone.length / 2; i++)
      tone.writeInt16LE(
        Math.round(8000 * Math.sin((2 * Math.PI * 440 * i) / 16000)),
        i * 2
      );
    harness.roomrNode.configure({
      callerAudio: { pcm16le: Buffer.concat([silence, tone]) }
    });
    await start({ amd: { windowMs: 500 } });
    await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    const result = await waitFor(
      () => json(peer).find((m) => m.type === "amd.result"),
      8000
    );
    expect(result).to.deep.include({ status: "machine" });
    expect(result.audioMs).to.be.within(480, 520);
    // Measured from the attach, so a little under the 1.2 s sent.
    expect(result.speechOnsetMs).to.be.within(600, 1250);

    // The classifier got the greeting, not the silence.
    const pcm = heard[0];
    let loud = 0;
    for (let i = 0; i < pcm.length; i += 2)
      if (Math.abs(pcm.readInt16LE(i)) > 1000) loud++;
    expect(loud).to.be.greaterThan((pcm.length / 2) * 0.8);
  });

  it("[APB-019] reports no_speech when the caller never speaks", async function () {
    harness.roomrNode.configure({ callerAudio: { kind: "silence", ms: 8000 } });
    await start({ amd: { windowMs: 500 } });
    await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    const result = await waitFor(
      () => json(peer).find((m) => m.type === "amd.result"),
      8000
    );
    expect(result).to.deep.include({
      status: "unknown",
      reason: "no_speech",
      audioMs: 0
    });
    expect(result).to.not.have.property("speechOnsetMs");
    expect(heard).to.have.length(0);
  });

  it("[APB-019] reports unknown without a classifier, and nothing for apps without amd", async function () {
    await start({ amd: true }, false);
    await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    const result = await waitFor(
      () => json(peer).find((m) => m.type === "amd.result"),
      8000
    );
    expect(result).to.deep.include({
      status: "unknown",
      reason: "no_classifier"
    });
    await appbridge!.stop();
    appbridge = undefined;

    await start({});
    await harness.roomrNode.offerCall();
    const second = await harness.app.nextConnection();
    await waitFor(() =>
      json(second.peer).find((m) => m.type === "session.start")
    );
    await sleep(300);
    expect(json(second.peer).some((m) => m.type === "amd.result")).to.equal(
      false
    );
    expect(
      harness.roomrNode.commands.some((c) => c.command.type === "addListener")
    ).to.equal(false);
  });
});

describe("@appbridge AMD classifier", function () {
  it("[APB-019] resolves mods/amd's model module through the declared dependency (AO-B2)", async function () {
    // A missing model directory fails before ONNX Runtime starts its threads (which abort the
    // process at mocha --exit); reaching the model loader proves the dependency resolves.
    const classify = loadAmdClassifier("/nonexistent-amd-model");
    let error: Error | undefined;
    await classify(Buffer.alloc(3200)).catch((e: Error) => (error = e));
    expect(error?.message).to.match(
      /ENOENT.*nonexistent-amd-model.*meta\.json/
    );
  });
});
