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
import { safeFetch } from "@fonoster/common";
import {
  decodeWav,
  FRAME_BYTES,
  FRAME_MS,
  SILENT_FRAME,
  toFrames
} from "../audio/pcm";
import {
  isProviderAuthError,
  ProviderAuthError,
  SpeechError,
  TtsAdapter,
  WordTiming
} from "../speech/types";

// voice-session, "One output queue", "Marks", "Output lifecycle and interruption report".
// Agent audio, speak items and play items share one queue played at real time; marks are
// positions in it.

export type OutputEvent =
  | { type: "output.started"; id: string }
  | { type: "output.done"; id: string; heardMs: number }
  | {
      type: "output.interrupted";
      id: string;
      heardText: string;
      heardMs: number;
    }
  | { type: "mark"; name: string; cleared: boolean }
  | {
      type: "error";
      code: string;
      message: string;
      fatal: boolean;
      relatesTo?: string;
    };

type Base = {
  interruptible: boolean;
  started: boolean;
  sentMs: number;
  frames: Buffer[];
  complete: boolean;
};

type SpeakItem = Base & {
  kind: "speak";
  id: string;
  text: string;
  words: WordTiming[];
  synthesizedMs: number;
  chain: Promise<void>;
  remainder: Buffer;
  abort: AbortController;
  voice: string;
  language: string;
  adapter: TtsAdapter;
  failed: boolean;
  onSynthesize?: (characters: number) => void;
};

type PlayItem = Base & {
  kind: "play";
  id: string;
  loop: boolean;
  source: Buffer[];
  abort: AbortController;
};
type AudioItem = Base & { kind: "audio" };
type MarkItem = { kind: "mark"; name: string };
type Item = SpeakItem | PlayItem | AudioItem | MarkItem;

export type SpeakRequest = {
  id: string;
  text: string;
  last: boolean;
  interruptible: boolean;
  preempt: boolean;
  voice: string;
  language: string;
  adapter: TtsAdapter;
  /** Called with the characters (code points) of each text sent to the vendor (usage). */
  onSynthesize?: (characters: number) => void;
};

export type PlayRequest = {
  id: string;
  url: string;
  loop: boolean;
  interruptible: boolean;
  preempt: boolean;
};

export type OutputQueueOptions = {
  /** Receives one 20 ms frame per tick (silence when the queue is empty). */
  sink: (frame: Buffer) => void;
  emit: (event: OutputEvent) => void;
  /** The TTS vendor rejected the key: the call can't go on (after the error is emitted). */
  onKeyRejected?: (error: ProviderAuthError) => void;
  maxQueuedMs: number;
  /** Fetches media for play (default: global fetch). */
  fetchMedia?: (url: string, signal: AbortSignal) => Promise<Buffer>;
};

/** Limits on media fetched for play (M13). */
export const PLAY_FETCH_LIMITS = {
  maxBytes: 20 * 1024 * 1024,
  timeoutMs: 15_000,
  maxRedirects: 3
};

/**
 * Fetches media an app asked to play. The URL is the app's choice, so it goes
 * through safeFetch: http(s) only, public destinations only (each redirect and
 * the connected address re-checked; FONOSTER_ALLOWED_DESTINATIONS lists
 * exceptions), a size cap and a timeout.
 */
export async function defaultFetch(
  url: string,
  signal: AbortSignal
): Promise<Buffer> {
  const res = await safeFetch(url, { signal, ...PLAY_FETCH_LIMITS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Words fully heard after heardMs; without timings, a proportional cut by characters. */
export function heardText(
  text: string,
  words: WordTiming[],
  heardMs: number,
  totalMs: number
): string {
  if (words.length) {
    return words
      .filter((w) => w.endMs <= heardMs)
      .map((w) => w.word)
      .join(" ");
  }
  if (totalMs <= 0) return "";
  const chars = Math.floor(
    (text.length * Math.min(heardMs, totalMs)) / totalMs
  );
  const cut = text.slice(0, chars);
  return chars >= text.length
    ? text
    : cut.slice(0, Math.max(0, cut.lastIndexOf(" "))).trim();
}

export class OutputQueue {
  private queue: Item[] = [];
  private timer?: ReturnType<typeof setTimeout>;
  private clock = 0;
  private stopped = false;
  private playingListener?: (playing: boolean, interruptible: boolean) => void;
  private lastPlaying = false;

  constructor(private readonly options: OutputQueueOptions) {}

  /** Starts the real-time clock. */
  start() {
    this.clock = Date.now();
    const tick = () => {
      if (this.stopped) return;
      this.tick();
      this.clock += FRAME_MS;
      this.timer = setTimeout(tick, Math.max(0, this.clock - Date.now()));
    };
    tick();
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    for (const item of this.queue)
      if (item.kind === "speak" || item.kind === "play") item.abort.abort();
  }

  /** Called when audible output starts or stops, with whether it may be interrupted. */
  onPlaying(listener: (playing: boolean, interruptible: boolean) => void) {
    this.playingListener = listener;
  }

  get playing(): boolean {
    const head = this.queue[0];
    return !!head && head.kind !== "mark" && head.started;
  }

  queuedMs(): number {
    return this.queue.reduce(
      (ms, i) => (i.kind === "mark" ? ms : ms + i.frames.length * FRAME_MS),
      0
    );
  }

  // ---- commands ---------------------------------------------------------------------

  speak(req: SpeakRequest) {
    const existing = this.queue.find(
      (i): i is SpeakItem =>
        i.kind === "speak" && i.id === req.id && !i.complete
    );
    if (existing) {
      this.synthesize(existing, req.text, req.last);
      return;
    }
    if (this.full(req.id)) return;
    const item: SpeakItem = {
      kind: "speak",
      id: req.id,
      text: "",
      words: [],
      synthesizedMs: 0,
      chain: Promise.resolve(),
      remainder: Buffer.alloc(0),
      abort: new AbortController(),
      voice: req.voice,
      language: req.language,
      adapter: req.adapter,
      onSynthesize: req.onSynthesize,
      interruptible: req.interruptible,
      started: false,
      sentMs: 0,
      frames: [],
      complete: false,
      failed: false
    };
    this.enqueue(item, req.preempt);
    this.synthesize(item, req.text, req.last);
  }

  play(req: PlayRequest) {
    if (this.full(req.id)) return;
    const item: PlayItem = {
      kind: "play",
      id: req.id,
      loop: req.loop,
      source: [],
      abort: new AbortController(),
      interruptible: req.interruptible,
      started: false,
      sentMs: 0,
      frames: [],
      complete: false
    };
    this.enqueue(item, req.preempt);
    (this.options.fetchMedia ?? defaultFetch)(req.url, item.abort.signal)
      .then((buf) => {
        item.source = toFrames(decodeWav(buf));
        item.frames = [...item.source];
        if (!item.loop) item.complete = true;
      })
      .catch((e) => {
        if (item.abort.signal.aborted) return;
        this.remove(item);
        this.options.emit({
          type: "error",
          code: "play_fetch_failed",
          message: `could not play ${req.url}: ${(e as Error).message}`,
          fatal: false,
          relatesTo: req.id
        });
      });
  }

  /** Agent audio from the app (internal format, any length). */
  audio(buf: Buffer) {
    const tail = this.queue[this.queue.length - 1];
    let item: AudioItem;
    if (tail && tail.kind === "audio") item = tail;
    else {
      if (this.full()) return;
      item = {
        kind: "audio",
        interruptible: true,
        started: false,
        sentMs: 0,
        frames: [],
        complete: true
      };
      this.queue.push(item);
    }
    // Keep frames exact: carry partial frames into the next call.
    const data =
      item.frames.length &&
      item.frames[item.frames.length - 1].length < FRAME_BYTES
        ? Buffer.concat([item.frames.pop()!, buf])
        : buf;
    for (let i = 0; i < data.length; i += FRAME_BYTES)
      item.frames.push(data.subarray(i, i + FRAME_BYTES));
  }

  mark(name: string) {
    this.queue.push({ kind: "mark", name });
  }

  /** Empties the whole queue (clear). */
  clear() {
    const items = this.queue;
    this.queue = [];
    for (const item of items) this.cut(item);
    this.notifyPlaying();
  }

  // ---- internals --------------------------------------------------------------------

  private full(id?: string): boolean {
    if (this.queuedMs() < this.options.maxQueuedMs) return false;
    this.options.emit({
      type: "error",
      code: "queue_full",
      message: `output queue holds more than ${this.options.maxQueuedMs} ms`,
      fatal: false,
      relatesTo: id
    });
    return true;
  }

  private enqueue(item: SpeakItem | PlayItem, preempt: boolean) {
    if (!preempt) {
      this.queue.push(item);
      return;
    }
    const head = this.queue[0];
    if (head && head.kind !== "mark") {
      this.queue.shift();
      this.cut(head);
    }
    this.queue.unshift(item);
  }

  private remove(item: Item) {
    this.queue = this.queue.filter((i) => i !== item);
  }

  /** Reports an item dropped by clear or preempt. */
  private cut(item: Item) {
    if (item.kind === "mark") {
      this.options.emit({ type: "mark", name: item.name, cleared: true });
      return;
    }
    if (item.kind === "audio") return;
    item.abort.abort();
    if (item.kind === "speak" && item.failed) return;
    // Items that never started still resolve, so no client promise is left hanging.
    const text = item.kind === "speak" ? item.text : "";
    const words = item.kind === "speak" ? item.words : [];
    const total = item.kind === "speak" ? item.synthesizedMs : 0;
    this.options.emit({
      type: "output.interrupted",
      id: item.id,
      heardMs: item.sentMs,
      heardText: item.started ? heardText(text, words, item.sentMs, total) : ""
    });
  }

  private synthesize(item: SpeakItem, text: string, last: boolean) {
    item.chain = item.chain.then(async () => {
      if (item.abort.signal.aborted || item.failed) return;
      if (text) {
        const offset = item.synthesizedMs;
        item.onSynthesize?.([...text].length);
        try {
          const synthesis = await item.adapter.synthesize(
            { text, voice: item.voice, language: item.language },
            item.abort.signal
          );
          for (const w of synthesis.words ?? []) {
            item.words.push({
              word: w.word,
              startMs: w.startMs + offset,
              endMs: w.endMs + offset
            });
          }
          item.text = item.text ? `${item.text} ${text}` : text;
          let pieceBytes = 0;
          for await (const chunk of synthesis.audio) {
            if (item.abort.signal.aborted) return;
            pieceBytes += chunk.length;
            item.synthesizedMs = offset + (pieceBytes / FRAME_BYTES) * FRAME_MS;
            const data = Buffer.concat([item.remainder, chunk]);
            const whole = data.length - (data.length % FRAME_BYTES);
            for (let i = 0; i < whole; i += FRAME_BYTES)
              item.frames.push(data.subarray(i, i + FRAME_BYTES));
            item.remainder = data.subarray(whole);
          }
        } catch (e) {
          if (item.abort.signal.aborted) return;
          item.failed = true;
          item.complete = true;
          const rejected = isProviderAuthError(e);
          const err =
            e instanceof SpeechError || rejected
              ? e
              : new SpeechError("internal", (e as Error).message);
          this.options.emit({
            type: "error",
            code: err.code,
            message: err.message,
            fatal: rejected,
            relatesTo: item.id
          });
          if (!item.started) this.remove(item);
          if (rejected) this.options.onKeyRejected?.(e);
          return;
        }
      }
      if (last) {
        if (item.remainder.length) {
          item.frames.push(
            Buffer.concat([
              item.remainder,
              SILENT_FRAME.subarray(item.remainder.length)
            ])
          );
          item.remainder = Buffer.alloc(0);
        }
        item.complete = true;
      }
    });
  }

  private tick() {
    // Marks at the head are reached: everything queued before them has been heard.
    while (this.queue[0]?.kind === "mark") {
      const mark = this.queue.shift() as MarkItem;
      this.options.emit({ type: "mark", name: mark.name, cleared: false });
    }

    const head = this.queue[0] as Exclude<Item, MarkItem> | undefined;
    if (!head) {
      this.options.sink(SILENT_FRAME);
      this.notifyPlaying();
      return;
    }

    let frame = head.frames.shift();
    if (!frame && head.kind === "play" && head.loop && head.source.length) {
      head.frames = [...head.source];
      frame = head.frames.shift();
    }

    if (frame) {
      if (!head.started) {
        head.started = true;
        if (head.kind !== "audio")
          this.options.emit({ type: "output.started", id: head.id });
      }
      head.sentMs += FRAME_MS;
      this.options.sink(frame);
      this.notifyPlaying();
      if (head.frames.length === 0 && head.complete) this.finish(head);
      return;
    }

    // No audio ready: either the item is done, or its audio is still being produced.
    if (head.complete) this.finish(head);
    this.options.sink(SILENT_FRAME);
    this.notifyPlaying();
  }

  private finish(item: Exclude<Item, MarkItem>) {
    this.remove(item);
    if (item.kind === "audio") return;
    if (item.kind === "speak" && item.failed) return;
    if (item.started)
      this.options.emit({
        type: "output.done",
        id: item.id,
        heardMs: Math.round(item.sentMs)
      });
  }

  private notifyPlaying() {
    const playing = this.playing;
    if (playing !== this.lastPlaying) {
      this.lastPlaying = playing;
      const head = this.queue[0] as Exclude<Item, MarkItem> | undefined;
      this.playingListener?.(playing, head?.interruptible ?? false);
    }
  }
}
