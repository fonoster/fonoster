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
import * as http from "http";
import { URL } from "url";
import WebSocket from "ws";
import { durationMs, parseFormat } from "../../audio/codecs";
import { FakeProvider } from "./FakeProvider";
import { ProviderLedger } from "./ProviderLedger";

export type SttScriptEntry = {
  atMs: number;
  text: string;
  final?: boolean;
  language?: string;
};

/**
 * Fake streaming STT over WebSocket.
 *
 *   WS /v1/listen?language=en-US&codec=pcm16&rate=16000
 *   client → binary audio frames; {type: "config", language?, hints?}; {type: "finalize"}
 *   server → {type: "transcript", text, final, language, confidence, startMs, endMs}
 *
 * Transcripts are scripted against caller-audio time: an entry fires once the stream has carried
 * atMs of audio, after the configured delay. Injected failures close the socket with code 1011
 * (provider_unavailable) or 1008 (bad_request); provider_timeout accepts audio and never answers.
 *
 * Implementations' built-in "fake" adapters speak this protocol (see PROVIDERS.md).
 */
export class FakeStt extends FakeProvider {
  readonly streams: {
    at: number;
    language: string;
    audioMs: number;
    hints?: string[];
  }[] = [];
  private wss?: WebSocket.Server;

  constructor(ledger?: ProviderLedger) {
    super("stt", ledger);
  }

  protected onServer(server: http.Server) {
    this.wss = new WebSocket.Server({ server, path: "/v1/listen" });
    this.wss.on("connection", (socket, req) => this.onStream(socket, req));
  }

  async stop() {
    for (const client of this.wss?.clients ?? []) client.terminate();
    this.wss?.close();
    await super.stop();
  }

  protected async serve(
    _req: http.IncomingMessage,
    _body: unknown,
    res: http.ServerResponse
  ) {
    this.json(res, 404, {
      error: { code: "not_found", message: "use the /v1/listen WebSocket" }
    });
  }

  private onStream(socket: WebSocket, req: http.IncomingMessage) {
    this.requests++;
    const params = new URL(req.url ?? "/", "http://fake").searchParams;
    const format = parseFormat(
      params.get("codec") ?? "pcm16",
      Number(params.get("rate") ?? 16000)
    );
    const stream = {
      at: Date.now(),
      language: params.get("language") ?? "en-US",
      audioMs: 0,
      hints: undefined as string[] | undefined
    };
    this.streams.push(stream);

    const failure = this.takeFailure();
    if (failure === "provider_unavailable") return socket.close(1011, failure);
    if (failure === "bad_request") return socket.close(1008, failure);
    const silent = failure === "provider_timeout";
    const interval = silent ? this.ledger.open(this.name) : undefined;

    const pending = [
      ...((this.behavior.script ?? []) as SttScriptEntry[])
    ].sort((a, b) => a.atMs - b.atMs);
    let lastEnd = 0;

    const emitDue = (all = false) => {
      while (pending.length && (all || pending[0].atMs <= stream.audioMs)) {
        const entry = pending.shift()!;
        const message = {
          type: "transcript",
          text: entry.text,
          final: entry.final ?? true,
          language: entry.language ?? stream.language,
          confidence: 0.9,
          startMs: lastEnd,
          endMs: entry.atMs
        };
        lastEnd = entry.atMs;
        void this.delay().then(
          () =>
            socket.readyState === WebSocket.OPEN &&
            socket.send(JSON.stringify(message))
        );
      }
    };

    socket.on("message", (raw: WebSocket.Data, isBinary?: boolean) => {
      const binary = isBinary ?? typeof raw !== "string";
      if (binary) {
        stream.audioMs += durationMs((raw as Buffer).length, format);
        if (!silent) emitDue();
        return;
      }
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "config") {
          if (msg.language) stream.language = msg.language;
          if (msg.hints) stream.hints = msg.hints;
        }
        if (msg.type === "finalize" && !silent) emitDue(true);
      } catch {
        socket.close(1008, "bad_request");
      }
    });
    socket.on("close", () => interval && this.ledger.close(interval));
  }
}
