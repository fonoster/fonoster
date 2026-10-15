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
// On-demand live provider check (pass bar T4): one short synthesis per TTS vendor and two Deepgram
// transcriptions of the Deepgram audio (without and with a "Fonoster" keyterm). Spends about a
// cent; never run in CI or on a schedule.
//
//   DEEPGRAM_API_KEY=… ELEVENLABS_API_KEY=… npx tsx mods/gateway/scripts/live-check.ts
//
// Keys come only from the environment and are never printed.
import * as fs from "fs";
import * as path from "path";
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

/**
 * Streams PCM to Deepgram STT in 20 ms frames at about 4x real time, then a second of silence,
 * and waits for Deepgram to send its last results and close. Reports the result count and any
 * errors so an empty transcript says why (PR5).
 */
async function transcribe(apiKey: string, pcm: Buffer, hints?: string[]) {
  const finals: string[] = [];
  const errors: string[] = [];
  let results = 0;
  const stt = new DeepgramSttAdapter({ apiKey }).open({
    language: "en",
    hints
  });
  stt.on("transcript", (t: Transcript) => {
    results++;
    if (t.final) finals.push(t.text);
  });
  stt.on("error", (e: Error) => errors.push(e.message));
  const audio = Buffer.concat([pcm, Buffer.alloc(32000)]);
  for (let i = 0; i < audio.length; i += 640) {
    stt.write(audio.subarray(i, i + 640));
    await new Promise((r) => setTimeout(r, 5));
  }
  // Wait for Deepgram's last results instead of a fixed time (the PR5 empty transcripts).
  await stt.finish(15000);
  const heard = finals.join(" ");
  return {
    ok: /live check/i.test(heard),
    transcript: heard,
    results,
    ...(hints ? { hints } : {}),
    ...(errors.length ? { errors } : {})
  };
}

async function main() {
  const dg = process.env.DEEPGRAM_API_KEY;
  const xi = process.env.ELEVENLABS_API_KEY;
  // LIVE_REPLAY_DIR: transcribe saved audio instead of synthesizing (cheapest rerun);
  // LIVE_SAVE_DIR: keep this run's synthesized audio there.
  const replayDir = process.env.LIVE_REPLAY_DIR;
  const saveDir = process.env.LIVE_SAVE_DIR;
  const results: Record<string, unknown> = {};
  let dgAudio: Buffer | undefined;
  let xiAudio: Buffer | undefined;

  if (replayDir) {
    dgAudio = fs.readFileSync(path.join(replayDir, "deepgram.pcm"));
    const xiFile = path.join(replayDir, "elevenlabs.pcm");
    if (fs.existsSync(xiFile)) xiAudio = fs.readFileSync(xiFile);
  } else if (dg) {
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

  if (xi && !replayDir) {
    const started = Date.now();
    try {
      const s = await new ElevenLabsTtsAdapter({
        apiKey: xi,
        timeoutMs: 10000
      }).synthesize(
        { text: TEXT, voice: "21m00Tcm4TlvDq8ikWAM", language: "en" },
        new AbortController().signal
      );
      xiAudio = await collect(s.audio);
      results.elevenlabsTts = {
        ok: xiAudio.length > 0,
        audioMs: ms(xiAudio.length),
        tookMs: Date.now() - started
      };
    } catch (e) {
      results.elevenlabsTts = { ok: false, error: (e as Error).message };
    }
  }

  if (dg && dgAudio?.length) {
    // Without and with a keyterm hint: "Fonoster" is misheard without one (PR5, VO-B3).
    results.deepgramStt = await transcribe(dg, dgAudio);
    results.deepgramSttKeyterm = await transcribe(dg, dgAudio, ["Fonoster"]);
    (results.deepgramSttKeyterm as { ok: boolean }).ok &&= /fonoster/i.test(
      (results.deepgramSttKeyterm as { transcript: string }).transcript
    );
  }
  // The ElevenLabs audio too: STT after an ElevenLabs synthesis is the case PR5 saw fail.
  if (dg && xiAudio?.length)
    results.deepgramSttOfElevenlabs = await transcribe(dg, xiAudio, [
      "Fonoster"
    ]);
  if (saveDir) {
    if (dgAudio) fs.writeFileSync(path.join(saveDir, "deepgram.pcm"), dgAudio);
    if (xiAudio)
      fs.writeFileSync(path.join(saveDir, "elevenlabs.pcm"), xiAudio);
  }

  console.log(JSON.stringify(results, null, 2));
  process.exit(
    Object.values(results).every((r) => (r as { ok: boolean }).ok) ? 0 : 1
  );
}

void main();
