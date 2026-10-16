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
import { EventEmitter } from "events";
import { URLSearchParams } from "url";
import WebSocket from "ws";
import { streamingPost } from "../http";
import {
  SpeechError,
  SttAdapter,
  SttStream,
  Synthesis,
  Transcript,
  TtsAdapter
} from "../speech";

// Deepgram, ported from mods/apiserver/src/voice/{stt,tts}/Deepgram.ts onto the streaming
// adapter interfaces. Plain HTTP and WebSocket (no SDK), with a base URL override for tests.

export type DeepgramOptions = {
  apiKey: string;
  baseUrl?: string;
  sttModel?: string;
  timeoutMs?: number;
};

const API = "https://api.deepgram.com";

export class DeepgramTtsAdapter implements TtsAdapter {
  constructor(private readonly options: DeepgramOptions) {}

  async synthesize(
    request: { text: string; voice: string; language: string },
    signal: AbortSignal
  ): Promise<Synthesis> {
    // The voice is a Deepgram Aura model name (catalog id "deepgram/aura-2-thalia-en").
    const query = new URLSearchParams({
      model: request.voice,
      encoding: "linear16",
      sample_rate: "16000",
      container: "none"
    });
    const audio = await streamingPost(
      `${this.options.baseUrl ?? API}/v1/speak?${query}`,
      {
        headers: {
          authorization: `Token ${this.options.apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({ text: request.text })
      },
      signal,
      this.options.timeoutMs ?? 3000,
      "Deepgram TTS"
    );
    return { audio };
  }
}

/** Deepgram's keyterm prompting works on Nova-3 and Flux; older models take `keywords`. */
export function hintParam(model: string): "keyterm" | "keywords" {
  return /^(nova-3|flux)/.test(model) ? "keyterm" : "keywords";
}

/** Frames kept while (re)connecting: 5 s of 20 ms frames. */
const MAX_QUEUED_FRAMES = 250;
/** How long a replaced socket may keep delivering its last transcripts (VO-B1). */
const DRAIN_MS = 2000;

export class DeepgramSttStream extends EventEmitter implements SttStream {
  private socket!: WebSocket;
  private queue: Buffer[] = [];
  private keepalive?: ReturnType<typeof setInterval>;
  private closed = false;
  private finishing = false;
  private failures = 0;
  private retry?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly options: DeepgramOptions,
    private language: string,
    private hints: string[] = [],
    private readonly model = options.sttModel ?? "nova-3"
  ) {
    super();
    this.connect();
  }

  private connect() {
    const query = new URLSearchParams({
      model: this.model,
      encoding: "linear16",
      sample_rate: "16000",
      channels: "1",
      interim_results: "true",
      smart_format: "true",
      language: this.language
    });
    const param = hintParam(this.model);
    for (const h of this.hints) query.append(param, h);
    const base = (this.options.baseUrl ?? API).replace(/^http/, "ws");
    const socket = new WebSocket(`${base}/v1/listen?${query}`, {
      headers: { authorization: `Token ${this.options.apiKey}` }
    });
    this.socket = socket;
    let rejected = false;
    socket.on("open", () => {
      for (const f of this.queue) socket.send(f);
      this.queue = [];
      clearInterval(this.keepalive);
      this.keepalive = setInterval(
        () =>
          socket.readyState === WebSocket.OPEN &&
          socket.send(JSON.stringify({ type: "KeepAlive" })),
        5000
      );
    });
    socket.on("message", (raw) => this.onMessage(raw.toString()));
    // A rejected handshake (bad key, unknown model or language) is not retried.
    socket.on("unexpected-response", (req, res) => {
      rejected = true;
      req.destroy();
      if (this.closed || socket !== this.socket) return;
      this.emit(
        "error",
        new SpeechError(
          res.statusCode === 400 ? "bad_message" : "provider_unavailable",
          `Deepgram STT answered HTTP ${res.statusCode}`
        )
      );
    });
    socket.on("error", () => undefined);
    // Deepgram may close a live stream (NET-0001 after 10 s without audio, 1011 on its side). The
    // old adapter went quietly deaf then; now it reconnects, keeping frames meanwhile (VO-B1).
    socket.on("close", (code: number, reason: Buffer) => {
      if (socket !== this.socket || this.closed || this.finishing || rejected)
        return;
      clearInterval(this.keepalive);
      if (code === 1008) {
        this.emit(
          "error",
          new SpeechError(
            "bad_message",
            `Deepgram STT rejected the stream: ${reason.toString() || code}`
          )
        );
        return;
      }
      if (++this.failures > 3) {
        this.emit(
          "error",
          new SpeechError(
            "provider_unavailable",
            `Deepgram STT closed the stream (${code} ${reason.toString()})`.trim()
          )
        );
        return;
      }
      this.retry = setTimeout(
        () => !this.closed && this.connect(),
        250 * this.failures
      );
    });
  }

  private onMessage(text: string) {
    let msg: {
      type?: string;
      is_final?: boolean;
      start?: number;
      duration?: number;
      channel?: {
        alternatives?: {
          transcript?: string;
          confidence?: number;
          words?: {
            word: string;
            punctuated_word?: string;
            start: number;
            end: number;
          }[];
        }[];
      };
    };
    try {
      msg = JSON.parse(text);
    } catch {
      return;
    }
    if (this.closed || msg.type !== "Results") return;
    this.failures = 0;
    const alt = msg.channel?.alternatives?.[0];
    if (!alt?.transcript) return;
    const t: Transcript = {
      text: alt.transcript,
      final: msg.is_final === true,
      language: this.language,
      confidence: alt.confidence ?? 0
    };
    // Word timings (catalog feature `word-timings`), in ms from the start of this vendor stream.
    const ms = (sec: unknown) => Math.round(Number(sec) * 1000);
    if (typeof msg.start === "number" && typeof msg.duration === "number") {
      t.startMs = ms(msg.start);
      t.endMs = ms(msg.start + msg.duration);
    }
    if (Array.isArray(alt.words) && alt.words.length)
      t.words = alt.words.map((w) => ({
        word: w.punctuated_word ?? w.word,
        startMs: ms(w.start),
        endMs: ms(w.end)
      }));
    this.emit("transcript", t);
  }

  write(frame: Buffer) {
    if (this.closed) return;
    if (this.socket.readyState === WebSocket.OPEN) this.socket.send(frame);
    else {
      this.queue.push(frame);
      if (this.queue.length > MAX_QUEUED_FRAMES) this.queue.shift();
    }
  }

  /**
   * Deepgram cannot change language or keyterms mid-stream, so the stream reconnects. The old
   * socket is finalized and drained, so words spoken just before the change are not lost.
   */
  update(options: { language?: string; hints?: string[] }) {
    if (this.closed) return;
    this.language = options.language ?? this.language;
    this.hints = options.hints ?? this.hints;
    clearTimeout(this.retry);
    this.retire(this.socket, DRAIN_MS);
    this.connect();
  }

  /**
   * Ends the audio and waits (up to timeoutMs) for Deepgram to send its last results and close
   * the socket, then closes the stream. Deepgram works through audio at about real-time pace even
   * when it arrives faster, so a fixed wait followed by close() can drop every final (PR5, VO-B1).
   */
  async finish(timeoutMs = 10000): Promise<void> {
    if (this.closed) return;
    this.finishing = true;
    clearTimeout(this.retry);
    clearInterval(this.keepalive);
    const s = this.socket;
    if (s.readyState === WebSocket.OPEN) {
      const done = new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, timeoutMs);
        s.once("close", () => {
          clearTimeout(timer);
          resolve();
        });
      });
      s.send(JSON.stringify({ type: "CloseStream" }));
      await done;
    }
    this.close();
  }

  close() {
    this.closed = true;
    clearTimeout(this.retry);
    this.retire(this.socket, 0);
    this.queue = [];
    this.removeAllListeners();
  }

  private retire(s: WebSocket, drainMs: number) {
    clearInterval(this.keepalive);
    if (s.readyState !== WebSocket.OPEN) {
      s.terminate();
      return;
    }
    s.send(JSON.stringify({ type: "Finalize" }));
    s.send(JSON.stringify({ type: "CloseStream" }));
    if (!drainMs) return s.close();
    // Deepgram closes the socket itself once it has sent the last results.
    const timer = setTimeout(() => s.terminate(), drainMs);
    s.once("close", () => clearTimeout(timer));
  }
}

export class DeepgramSttAdapter implements SttAdapter {
  constructor(private readonly options: DeepgramOptions) {}

  open(options: {
    language: string;
    hints?: string[];
    model?: string;
  }): DeepgramSttStream {
    return new DeepgramSttStream(
      this.options,
      options.language,
      options.hints,
      options.model ?? this.options.sttModel
    );
  }
}
