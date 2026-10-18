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
import { Gateway, MemoryCallRecordSink } from "../src";
import { APP_AUDIO_FORMATS, convert, INTERNAL } from "../src/audio/pcm";

// The fonoster format menu end to end (voice-session "Raw audio in both directions", AO-B4): for
// every format an app may pick, session.start announces it, caller frames are 20 ms of it, and
// agent audio sent in it reaches the Roomr node at real time. Needs NATS.
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

const binary = (peer: Peer) =>
  peer.frames.items
    .filter((f) => f.kind === "binary")
    .map((f) => f.data as Buffer);

/** 440 Hz at the internal format, `ms` long. */
function tone(ms: number) {
  const samples = (INTERNAL.rate / 1000) * ms;
  const out = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++)
    out.writeInt16LE(
      Math.round(8000 * Math.sin((2 * Math.PI * 440 * i) / INTERNAL.rate)),
      i * 2
    );
  return out;
}

describe("@gateway audio format menu", function () {
  this.timeout(20000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let gateway: Gateway | undefined;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  beforeEach(async () => {
    harness = await new FakesHarness().start();
    harness.roomrNode.configure({ callerAudio: { kind: "tone", ms: 400 } });
    harness.roomrNode.attachNats(nc);
  });

  afterEach(async () => {
    await gateway?.stop();
    gateway = undefined;
    await harness?.stop();
  });

  for (const audio of APP_AUDIO_FORMATS) {
    it(`${audio.codec} at ${audio.rate} Hz`, async function () {
      const urls = harness.providerUrls;
      gateway = await new Gateway({
        config: {
          nats: { url: NATS_URL! },
          testMode: true,
          retry: { windowMs: 300, intervalMs: 100 },
          apps: [
            {
              ref: "a",
              url: harness.app.url,
              protocol: "fonoster",
              signingSecret: "s",
              speech: { voice: "fake/default", language: "en-US" },
              audio
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
        record: new MemoryCallRecordSink()
      }).start();

      harness.roomrNode.offerCall();
      const { peer } = await harness.app.nextConnection();
      const start = await waitFor(() =>
        json(peer).find((m) => m.type === "session.start")
      );
      expect(start.audio).to.deep.equal(audio);

      // Caller frames: the track byte plus 20 ms of the app's format.
      const frameBytes =
        (audio.rate / 1000) * 20 * (audio.codec === "pcmu" ? 1 : 2);
      const frames = await waitFor(() => {
        const f = binary(peer);
        return f.length >= 10 ? f : undefined;
      });
      for (const f of frames.slice(0, 10)) {
        expect(f[0]).to.equal(1);
        expect(f.length - 1).to.equal(frameBytes);
      }

      // Agent audio in the app's format, sent at once, is heard at real time.
      const since = Date.now();
      peer.sendBinary(convert(tone(600), INTERNAL, audio));
      await waitFor(() => harness.roomrNode.outputAudioMs(since) >= 560, 3000);
      expect(Date.now() - since).to.be.greaterThan(450);
    });
  }
});
