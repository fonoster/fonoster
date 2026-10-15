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
// On-demand live provider check (pass bar T4): one short synthesis per TTS vendor and a Deepgram
// transcription of the Deepgram audio. Spends a few cents; never run in CI or on a schedule.
//
//   DEEPGRAM_API_KEY=… ELEVENLABS_API_KEY=… npx tsx mods/gateway/scripts/live-check.ts
//
// Keys come only from the environment and are never printed.
import { DeepgramSttAdapter, DeepgramTtsAdapter } from "../src/speech/deepgram";
import { ElevenLabsTtsAdapter } from "../src/speech/elevenlabs";
import { Transcript } from "../src/speech/types";

const TEXT =
  "Hello from Fonoster. This is a live check of the new speech adapters.";
const ms = (bytes: number) => Math.round(bytes / 32);

async function collect(audio: AsyncIterable<Buffer>) {
  const chunks: Buffer[] = [];
  for await (const c of audio) chunks.push(c);
  return Buffer.concat(chunks);
}

async function main() {
  const dg = process.env.DEEPGRAM_API_KEY;
  const xi = process.env.ELEVENLABS_API_KEY;
  const results: Record<string, unknown> = {};
  let dgAudio: Buffer | undefined;

  if (dg) {
    const started = Date.now();
    try {
      const s = await new DeepgramTtsAdapter({
        apiKey: dg,
        timeoutMs: 10000
      }).synthesize(
        { text: TEXT, voice: "aura-2-thalia-en", language: "en" },
        new AbortController().signal
      );
      dgAudio = await collect(s.audio);
      results.deepgramTts = {
        ok: dgAudio.length > 0,
        audioMs: ms(dgAudio.length),
        tookMs: Date.now() - started
      };
    } catch (e) {
      results.deepgramTts = { ok: false, error: (e as Error).message };
    }
  }

  if (xi) {
    const started = Date.now();
    try {
      const s = await new ElevenLabsTtsAdapter({
        apiKey: xi,
        timeoutMs: 10000
      }).synthesize(
        { text: TEXT, voice: "21m00Tcm4TlvDq8ikWAM", language: "en" },
        new AbortController().signal
      );
      const audio = await collect(s.audio);
      results.elevenlabsTts = {
        ok: audio.length > 0,
        audioMs: ms(audio.length),
        tookMs: Date.now() - started
      };
    } catch (e) {
      results.elevenlabsTts = { ok: false, error: (e as Error).message };
    }
  }

  if (dg && dgAudio?.length) {
    const finals: string[] = [];
    const errors: string[] = [];
    const stt = new DeepgramSttAdapter({ apiKey: dg }).open({ language: "en" });
    stt.on("transcript", (t: Transcript) => t.final && finals.push(t.text));
    stt.on("error", (e: Error) => errors.push(e.message));
    // Feed 20 ms frames at about 4x real time, then a second of silence to flush.
    const audio = Buffer.concat([dgAudio, Buffer.alloc(32000)]);
    for (let i = 0; i < audio.length; i += 640) {
      stt.write(audio.subarray(i, i + 640));
      await new Promise((r) => setTimeout(r, 5));
    }
    // Deepgram finalizes a few seconds in; wait for it (up to 8 s).
    for (
      let waited = 0;
      waited < 8000 && !/live check/i.test(finals.join(" "));
      waited += 250
    ) {
      await new Promise((r) => setTimeout(r, 250));
    }
    stt.close();
    const heard = finals.join(" ");
    results.deepgramStt = {
      // "Fonoster" itself is often misheard without a keyterm hint, so it is not required.
      ok: /live check/i.test(heard),
      transcript: heard,
      ...(errors.length ? { errors } : {})
    };
  }

  console.log(JSON.stringify(results, null, 2));
  process.exit(
    Object.values(results).every((r) => (r as { ok: boolean }).ok) ? 0 : 1
  );
}

void main();
