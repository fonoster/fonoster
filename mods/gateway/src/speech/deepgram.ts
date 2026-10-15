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
import { streamingPost } from "./http";
import {
  SpeechError,
  SttAdapter,
  SttStream,
  Synthesis,
  Transcript,
  TtsAdapter
} from "./types";

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

class DeepgramSttStream extends EventEmitter implements SttStream {
  private socket!: WebSocket;
  private queue: Buffer[] = [];
  private keepalive?: ReturnType<typeof setInterval>;
  private closed = false;

  constructor(
    private readonly options: DeepgramOptions,
    private language: string,
    private hints?: string[]
  ) {
    super();
    this.connect();
  }

  private connect() {
    const query = new URLSearchParams({
      model: this.options.sttModel ?? "nova-3",
      encoding: "linear16",
      sample_rate: "16000",
      channels: "1",
      interim_results: "true",
      smart_format: "true",
      language: this.language
    });
    for (const h of this.hints ?? []) query.append("keyterm", h);
    const base = (this.options.baseUrl ?? API).replace(/^http/, "ws");
    const socket = new WebSocket(`${base}/v1/listen?${query}`, {
      headers: { authorization: `Token ${this.options.apiKey}` }
    });
    this.socket = socket;
    socket.on("open", () => {
      for (const f of this.queue) socket.send(f);
      this.queue = [];
      this.keepalive = setInterval(
        () =>
          socket.readyState === WebSocket.OPEN &&
          socket.send(JSON.stringify({ type: "KeepAlive" })),
        8000
      );
    });
    socket.on("message", (raw) => this.onMessage(raw.toString()));
    socket.on("unexpected-response", (_req, res) => {
      this.emit(
        "error",
        new SpeechError(
          "provider_unavailable",
          `Deepgram STT answered HTTP ${res.statusCode}`
        )
      );
    });
    socket.on(
      "error",
      (e) =>
        !this.closed &&
        this.emit("error", new SpeechError("provider_unavailable", e.message))
    );
    socket.on("close", () => clearInterval(this.keepalive));
  }

  private onMessage(text: string) {
    let msg: {
      type?: string;
      is_final?: boolean;
      channel?: {
        alternatives?: { transcript?: string; confidence?: number }[];
      };
    };
    try {
      msg = JSON.parse(text);
    } catch {
      return;
    }
    if (msg.type !== "Results") return;
    const alt = msg.channel?.alternatives?.[0];
    if (!alt?.transcript) return;
    const t: Transcript = {
      text: alt.transcript,
      final: msg.is_final === true,
      language: this.language,
      confidence: alt.confidence ?? 0
    };
    this.emit("transcript", t);
  }

  write(frame: Buffer) {
    if (this.socket.readyState === WebSocket.OPEN) this.socket.send(frame);
    else if (this.socket.readyState === WebSocket.CONNECTING)
      this.queue.push(frame);
  }

  /** Deepgram cannot change language mid-stream, so the stream reconnects. */
  update(options: { language?: string; hints?: string[] }) {
    this.language = options.language ?? this.language;
    this.hints = options.hints ?? this.hints;
    this.shutdown();
    this.closed = false;
    this.connect();
  }

  close() {
    this.closed = true;
    this.shutdown();
    this.removeAllListeners();
  }

  private shutdown() {
    clearInterval(this.keepalive);
    const s = this.socket;
    s.removeAllListeners("close");
    if (s.readyState === WebSocket.OPEN) {
      s.send(JSON.stringify({ type: "CloseStream" }));
      s.close();
    } else s.terminate();
  }
}

export class DeepgramSttAdapter implements SttAdapter {
  constructor(private readonly options: DeepgramOptions) {}

  open(options: { language: string; hints?: string[] }): SttStream {
    return new DeepgramSttStream(this.options, options.language, options.hints);
  }
}
