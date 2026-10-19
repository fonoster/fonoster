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
import {
  AudioFormat,
  encode,
  frames,
  generate,
  parseFormat
} from "../../audio/codecs";
import { FakeProvider } from "./FakeProvider";
import { ProviderLedger } from "./ProviderLedger";

/** Deterministic speaking rate: every character takes this long. */
export const MS_PER_CHAR = 60;

export type WordTiming = { word: string; startMs: number; endMs: number };

/** The word timings the fake TTS reports for a text; suites use it to predict heardText. */
export function wordTimings(text: string): WordTiming[] {
  const timings: WordTiming[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    timings.push({
      word: m[0],
      startMs: m.index * MS_PER_CHAR,
      endMs: (m.index + m[0].length) * MS_PER_CHAR
    });
  }
  return timings;
}

export function speechDurationMs(text: string): number {
  return text.length * MS_PER_CHAR;
}

/**
 * Fake TTS over HTTP.
 *
 *   POST /v1/synthesize  {text, voice?, language?, format?: {codec, rate}}
 *   200  application/octet-stream, audio streamed in 20 ms chunks as fast as possible
 *        X-Fake-Duration-Ms, X-Fake-Word-Timings (JSON list of {word, startMs, endMs})
 *
 * The audio is a tone lasting MS_PER_CHAR per character, so durations and word timings are
 * predictable. AppBridge's built-in "fake" adapter talks to this endpoint.
 *
 * Implementations' built-in "fake" adapters speak this protocol (see PROVIDERS.md).
 */
export class FakeTts extends FakeProvider {
  readonly synthesized: {
    at: number;
    text: string;
    voice?: string;
    language?: string;
  }[] = [];

  constructor(ledger?: ProviderLedger) {
    super("tts", ledger);
  }

  protected async serve(
    req: http.IncomingMessage,
    body: unknown,
    res: http.ServerResponse
  ) {
    if (req.method !== "POST" || req.url?.split("?")[0] !== "/v1/synthesize") {
      return this.json(res, 404, { error: { code: "not_found" } });
    }
    const { text, voice, language, format } = (body ?? {}) as {
      text?: string;
      voice?: string;
      language?: string;
      format?: { codec?: string; rate?: number };
    };
    if (typeof text !== "string" || text.length === 0) {
      return this.json(res, 400, {
        error: { code: "bad_request", message: "text is required" }
      });
    }

    const audioFormat: AudioFormat = parseFormat(
      format?.codec ?? "pcm16",
      format?.rate
    );
    this.synthesized.push({ at: Date.now(), text, voice, language });
    await this.delay();

    res.writeHead(200, {
      "content-type": "application/octet-stream",
      "x-fake-duration-ms": String(speechDurationMs(text)),
      "x-fake-word-timings": JSON.stringify(wordTimings(text))
    });
    const audio = encode(
      generate("tone", speechDurationMs(text), audioFormat.rate),
      audioFormat
    );
    for (const chunk of frames(audio, audioFormat)) res.write(chunk);
    res.end();
  }
}
