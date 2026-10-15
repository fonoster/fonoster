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
import {
  FRAME_BYTES,
  OutputEvent,
  OutputQueue,
  SpeechError,
  TtsAdapter,
  heardText
} from "../src";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 100 ms of tone per word, word timings included. */
function tts(
  options: { delayMs?: number; fail?: SpeechError } = {}
): TtsAdapter & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async synthesize({ text }) {
      calls.push(text);
      if (options.delayMs) await sleep(options.delayMs);
      if (options.fail) throw options.fail;
      const words = text.split(/\s+/).filter(Boolean);
      const frame = Buffer.alloc(FRAME_BYTES, 0x40);
      return {
        words: words.map((word, i) => ({
          word,
          startMs: i * 100,
          endMs: (i + 1) * 100
        })),
        audio: (async function* () {
          for (let i = 0; i < words.length * 5; i++) yield frame;
        })()
      };
    }
  };
}

function setup(maxQueuedMs = 120000) {
  const events: OutputEvent[] = [];
  const frames: Buffer[] = [];
  const queue = new OutputQueue({
    sink: (f) => frames.push(f),
    emit: (e) => events.push(e),
    maxQueuedMs
  });
  return {
    queue,
    events,
    frames,
    types: () =>
      events.map(
        (e) =>
          e.type + ("id" in e ? `:${e.id}` : "name" in e ? `:${e.name}` : "")
      )
  };
}

const speak = (
  adapter: TtsAdapter,
  id: string,
  text: string,
  extra: Partial<{
    last: boolean;
    preempt: boolean;
    interruptible: boolean;
  }> = {}
) => ({
  id,
  text,
  last: extra.last ?? true,
  preempt: extra.preempt ?? false,
  interruptible: extra.interruptible ?? true,
  voice: "v",
  language: "en-US",
  adapter
});

describe("@gateway/OutputQueue", function () {
  let q: ReturnType<typeof setup>;
  afterEach(() => q?.queue.stop());

  it("plays items in order with started and done", async function () {
    q = setup();
    const adapter = tts();
    q.queue.start();
    q.queue.speak(speak(adapter, "r1", "one"));
    q.queue.speak(speak(adapter, "r2", "two"));
    await sleep(350);
    expect(q.types()).to.deep.equal([
      "output.started:r1",
      "output.done:r1",
      "output.started:r2",
      "output.done:r2"
    ]);
  });

  it("joins streamed pieces of one id into one utterance", async function () {
    q = setup();
    const adapter = tts();
    q.queue.start();
    q.queue.speak(speak(adapter, "r1", "Hello,", { last: false }));
    await sleep(30);
    q.queue.speak(speak(adapter, "r1", "how are you?", { last: true }));
    await sleep(500);
    expect(adapter.calls).to.deep.equal(["Hello,", "how are you?"]);
    expect(q.types()).to.deep.equal(["output.started:r1", "output.done:r1"]);
  });

  it("preempt stops the current item and plays first", async function () {
    q = setup();
    const adapter = tts();
    q.queue.start();
    q.queue.speak(speak(adapter, "r1", "a long sentence that keeps going"));
    await sleep(150);
    q.queue.speak(speak(adapter, "r2", "One moment.", { preempt: true }));
    await sleep(300);
    const interrupted = q.events.find(
      (e) => e.type === "output.interrupted"
    ) as Extract<OutputEvent, { type: "output.interrupted" }>;
    expect(interrupted.id).to.equal("r1");
    expect(interrupted.heardText).to.equal("a");
    expect(q.types().slice(-2)).to.deep.equal([
      "output.started:r2",
      "output.done:r2"
    ]);
  });

  it("clear empties the queue, resolves every item and returns marks as cleared", async function () {
    q = setup();
    const adapter = tts();
    q.queue.start();
    q.queue.speak(speak(adapter, "r1", "one two three four"));
    q.queue.mark("m1");
    q.queue.speak(speak(adapter, "r2", "five"));
    await sleep(120);
    q.queue.clear();
    expect(q.types()).to.deep.equal([
      "output.started:r1",
      "output.interrupted:r1",
      "mark:m1",
      "output.interrupted:r2"
    ]);
    expect(q.events[2]).to.include({ cleared: true });
    expect(q.events[3]).to.include({ heardMs: 0, heardText: "" });
  });

  it("returns a mark once the audio before it has played", async function () {
    q = setup();
    q.queue.start();
    q.queue.audio(Buffer.alloc(FRAME_BYTES * 10, 0x40));
    q.queue.mark("m1");
    await sleep(100);
    expect(q.events).to.have.length(0);
    await sleep(200);
    expect(q.events).to.deep.equal([
      { type: "mark", name: "m1", cleared: false }
    ]);
  });

  it("reports provider failures with relatesTo and no output events", async function () {
    q = setup();
    q.queue.start();
    q.queue.speak(
      speak(
        tts({ fail: new SpeechError("provider_timeout", "slow") }),
        "r2",
        "x"
      )
    );
    await sleep(50);
    expect(q.events).to.deep.equal([
      {
        type: "error",
        code: "provider_timeout",
        message: "slow",
        fatal: false,
        relatesTo: "r2"
      }
    ]);
  });

  it("refuses items beyond the queue cap", async function () {
    q = setup(100);
    q.queue.audio(Buffer.alloc(FRAME_BYTES * 10));
    q.queue.speak(speak(tts(), "r3", "too much"));
    expect(q.events[0]).to.include({
      type: "error",
      code: "queue_full",
      relatesTo: "r3"
    });
  });

  it("reports play fetch failures", async function () {
    q = setup();
    const queue = new OutputQueue({
      sink: () => undefined,
      emit: (e) => q.events.push(e),
      maxQueuedMs: 1000,
      fetchMedia: async () => {
        throw new Error("HTTP 404");
      }
    });
    queue.play({
      id: "p1",
      url: "https://example.com/x.wav",
      loop: false,
      interruptible: true,
      preempt: false
    });
    await sleep(10);
    expect(q.events[0]).to.include({
      type: "error",
      code: "play_fetch_failed",
      relatesTo: "p1"
    });
  });

  it("computes heard text from word timings, or proportionally", function () {
    const words = [
      { word: "Your", startMs: 0, endMs: 200 },
      { word: "balance", startMs: 200, endMs: 600 },
      { word: "is", startMs: 600, endMs: 700 }
    ];
    expect(heardText("Your balance is", words, 650, 700)).to.equal(
      "Your balance"
    );
    expect(heardText("Your balance is forty", [], 500, 1000)).to.equal("Your");
  });
});
