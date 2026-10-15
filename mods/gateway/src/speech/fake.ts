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
import {
  SpeechError,
  SttAdapter,
  SttStream,
  Synthesis,
  Transcript,
  TtsAdapter,
  WordTiming
} from "./types";

// The fake adapters speak the fake provider protocol (mods/conformance/PROVIDERS.md). They are
// built in, like every adapter, and enabled only in test mode.

export class FakeTtsAdapter implements TtsAdapter {
  constructor(private readonly options: { url: string; timeoutMs: number }) {}

  async synthesize(
    request: { text: string; voice: string; language: string },
    signal: AbortSignal
  ): Promise<Synthesis> {
    const timeout = AbortSignal.timeout(this.options.timeoutMs);
    const combined = anySignal([signal, timeout]);
    let res: Awaited<ReturnType<typeof fetch>>;
    try {
      res = await fetch(`${this.options.url}/v1/synthesize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...request,
          format: { codec: "pcm16", rate: 16000 }
        }),
        signal: combined
      });
    } catch (e) {
      if (timeout.aborted)
        throw new SpeechError(
          "provider_timeout",
          `TTS did not answer within ${this.options.timeoutMs} ms`
        );
      throw signal.aborted
        ? e
        : new SpeechError(
            "provider_unavailable",
            `TTS unreachable: ${(e as Error).message}`
          );
    }
    if (res.status === 400)
      throw new SpeechError("bad_message", "TTS rejected the request");
    if (!res.ok || !res.body)
      throw new SpeechError(
        "provider_unavailable",
        `TTS answered HTTP ${res.status}`
      );

    const words = res.headers.get("x-fake-word-timings");
    const body = res.body;
    return {
      words: words ? (JSON.parse(words) as WordTiming[]) : undefined,
      audio: (async function* () {
        const reader = body.getReader();
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) return;
            yield Buffer.from(value);
          }
        } catch (e) {
          if (timeout.aborted)
            throw new SpeechError("provider_timeout", "TTS stalled");
          if (!signal.aborted)
            throw new SpeechError("provider_unavailable", (e as Error).message);
        }
      })()
    };
  }
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort();
      break;
    }
    s.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}

class FakeSttStream extends EventEmitter implements SttStream {
  private socket: WebSocket;
  private pending: (Buffer | string)[] = [];
  private open = false;

  constructor(url: string, language: string, hints?: string[]) {
    super();
    const query = new URLSearchParams({
      language,
      codec: "pcm16",
      rate: "16000"
    });
    this.socket = new WebSocket(`${url}/v1/listen?${query}`);
    this.socket.on("open", () => {
      this.open = true;
      if (hints) this.socket.send(JSON.stringify({ type: "config", hints }));
      for (const p of this.pending) this.socket.send(p);
      this.pending = [];
    });
    this.socket.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "transcript") {
        const t: Transcript = {
          text: msg.text,
          final: msg.final,
          language: msg.language,
          confidence: msg.confidence,
          startMs: msg.startMs,
          endMs: msg.endMs
        };
        this.emit("transcript", t);
      }
    });
    this.socket.on("close", (code: number) => {
      if (code === 1011)
        this.emit(
          "error",
          new SpeechError("provider_unavailable", "STT closed the stream")
        );
      if (code === 1008)
        this.emit(
          "error",
          new SpeechError("bad_message", "STT rejected the stream")
        );
    });
    this.socket.on("error", (e) =>
      this.emit("error", new SpeechError("provider_unavailable", e.message))
    );
  }

  write(frame: Buffer) {
    this.send(frame);
  }

  update(options: { language?: string; hints?: string[] }) {
    this.send(JSON.stringify({ type: "config", ...options }));
  }

  close() {
    this.removeAllListeners();
    this.socket.removeAllListeners();
    this.socket.on("error", () => undefined);
    if (this.socket.readyState === WebSocket.CONNECTING)
      this.socket.terminate();
    else this.socket.close();
  }

  private send(data: Buffer | string) {
    if (this.open && this.socket.readyState === WebSocket.OPEN)
      this.socket.send(data);
    else if (!this.open) this.pending.push(data);
  }
}

export class FakeSttAdapter implements SttAdapter {
  constructor(private readonly options: { url: string }) {}

  open(options: { language: string; hints?: string[] }): SttStream {
    return new FakeSttStream(this.options.url, options.language, options.hints);
  }
}
