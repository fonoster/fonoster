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
// One live call through the real stack pieces (VO-B6): a SIP caller bot dials the Go media node,
// the gateway runs Deepgram STT and the app's TTS voice, and the hosted Autopilot answers with
// OpenAI through the provider registry. The caller says a recorded question (PCMU, like the
// PSTN); the script measures turn latency: caller stops speaking → first audible agent audio.
// Spends a few cents per run; never in CI.
//
//   LIVE_CALL=1 CONFORMANCE_NATS_URL=nats://127.0.0.1:4222 \
//   DEEPGRAM_API_KEY=… ELEVENLABS_API_KEY=… OPENAI_API_KEY=… \
//   npx tsx mods/gateway/scripts/live-call.ts
//
// Options (environment):
//   LIVE_VOICE      catalog voice (default deepgram/aura-2-thalia-en; e.g. elevenlabs/EXAVITQu4vr4xnSDxMaL)
//   LIVE_STT        catalog STT model (default deepgram/nova-3)
//   LIVE_LLM        catalog LLM (default openai/gpt-4o-mini; groq/llama-3.3-70b-versatile needs GROQ_API_KEY)
//   LIVE_QUESTION   16 kHz mono WAV the caller says (default scripts/fixtures/question-fonoster.wav)
//   LIVE_TURNS      how many times the caller asks (default 2)
//   LIVE_TRANSCRIBE 1 = also transcribe what the caller heard with Deepgram (about $0.001)
//   LIVE_OUT        directory for heard.wav and the call record (default: a temp dir)
//
// Keys come only from the environment and are never printed.
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Registry } from "@fonoster/common";
import { DeepgramSttAdapter } from "@fonoster/community/deepgram";
import { buildMediaNode, MediaNodeProcess } from "@fonoster/conformance";
import { connect } from "nats";
import {
  loadHostedConfig,
  startHostedAutopilot
} from "../../autopilot/src/session/hosted";
import { Gateway } from "../src/Gateway";
import { MemoryCallRecordSink } from "../src/record/CallRecordSink";
import { Transcript } from "../src/speech/types";
// The hosted Autopilot, from its sources (the gateway does not depend on the autopilot package).

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SEED = path.join(
  __dirname,
  "../../../ops/rebuild/config/catalog-seed.yaml"
);
const SECRET = "live-call";

function pcmFromWav(file: string): Buffer {
  const wav = fs.readFileSync(file);
  if (wav.toString("ascii", 0, 4) !== "RIFF") return wav; // raw PCM
  if (wav.readUInt32LE(24) !== 16000 || wav.readUInt16LE(22) !== 1)
    throw new Error(`${file}: need 16 kHz mono 16-bit PCM`);
  let off = 12;
  while (off < wav.length - 8) {
    const id = wav.toString("ascii", off, off + 4);
    const size = wav.readUInt32LE(off + 4);
    if (id === "data") return wav.subarray(off + 8, off + 8 + size);
    off += 8 + size;
  }
  throw new Error(`${file}: no data chunk`);
}

function wavOf(pcm: Buffer): Buffer {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(16000, 24);
  h.writeUInt32LE(32000, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function until<T>(
  fn: () => Promise<T | undefined | false> | T | undefined | false,
  ms: number,
  what: string
): Promise<T> {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(20);
  }
}

async function transcribe(apiKey: string, pcm: Buffer): Promise<string> {
  const finals: string[] = [];
  const stt = new DeepgramSttAdapter({ apiKey }).open({
    language: "en",
    hints: ["Fonoster"]
  });
  stt.on("transcript", (t: Transcript) => t.final && finals.push(t.text));
  const audio = Buffer.concat([pcm, Buffer.alloc(32000)]);
  for (let i = 0; i < audio.length; i += 640) {
    stt.write(audio.subarray(i, i + 640));
    await sleep(2);
  }
  await stt.finish(20000);
  return finals.join(" ");
}

async function main() {
  if (!process.env.LIVE_CALL) {
    console.log("live-call: skipped (set LIVE_CALL=1 to place a live call)");
    return;
  }
  const natsUrl = process.env.CONFORMANCE_NATS_URL;
  const llm = process.env.LIVE_LLM ?? "openai/gpt-4o-mini";
  const llmKey = llm.startsWith("groq/") ? "GROQ_API_KEY" : "OPENAI_API_KEY";
  const missing = ["CONFORMANCE_NATS_URL", "DEEPGRAM_API_KEY", llmKey].filter(
    (k) => !process.env[k]
  );
  const voice = process.env.LIVE_VOICE ?? "deepgram/aura-2-thalia-en";
  if (voice.startsWith("elevenlabs/") && !process.env.ELEVENLABS_API_KEY)
    missing.push("ELEVENLABS_API_KEY");
  if (missing.length) throw new Error(`missing ${missing.join(", ")}`);
  const sttModel = process.env.LIVE_STT ?? "deepgram/nova-3";
  const turns = Number(process.env.LIVE_TURNS ?? 2);
  const question = pcmFromWav(
    process.env.LIVE_QUESTION ??
      path.join(__dirname, "fixtures/question-fonoster.wav")
  );
  const out =
    process.env.LIVE_OUT ??
    fs.mkdtempSync(path.join(os.tmpdir(), "live-call-"));
  fs.mkdirSync(out, { recursive: true });

  // The catalog: the vendor seed, as the stack loads it.
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "live-call-cfg-"));
  const registryFile = path.join(work, "registry.json");
  new Registry.Registry({
    store: new Registry.FileRegistryStore(registryFile),
    actor: "live-call"
  }).apply(fs.readFileSync(SEED, "utf8"));

  // The hosted Autopilot, configured the way the stack runs it.
  fs.writeFileSync(
    path.join(work, "assistants.json"),
    JSON.stringify({
      apps: {
        "app-1": {
          workspaceRef: "live",
          assistant: {
            conversationSettings: {
              firstMessage: "Hi, this is Fonoster. How can I help?",
              systemPrompt:
                "You answer phone calls for Fonoster, an open-source programmable voice platform: " +
                "phone numbers, SIP, AI voice agents (Autopilot) and APIs to build voice apps. " +
                "Reply in one or two short spoken sentences, no lists or markdown.",
              goodbyeMessage: "Goodbye!",
              systemErrorMessage: "Sorry, something went wrong.",
              hints: ["Fonoster", "Autopilot"]
            },
            languageModel: { model: llm, maxTokens: 120 }
          }
        }
      }
    })
  );
  fs.writeFileSync(
    path.join(work, "autopilot.json"),
    JSON.stringify({
      host: "127.0.0.1",
      port: 0,
      signingSecret: { value: SECRET },
      assistants: { file: "assistants.json" },
      registry: { file: "registry.json" },
      credentials: {
        "openai-default": { env: "OPENAI_API_KEY" },
        "groq-default": { env: "GROQ_API_KEY" }
      }
    })
  );
  const autopilot = await startHostedAutopilot(
    loadHostedConfig(path.join(work, "autopilot.json"))
  );

  const nc = await connect({ servers: natsUrl });
  const record = new MemoryCallRecordSink();
  const gateway = await new Gateway({
    nats: nc,
    record,
    config: {
      nats: { url: natsUrl! },
      registry: { file: registryFile },
      apps: [
        {
          ref: "app-1",
          url: `ws://127.0.0.1:${autopilot.port}/`,
          flavor: "native",
          signingSecret: SECRET,
          speech: {
            voice,
            language: "en-US",
            sttModel,
            hints: ["Fonoster"]
          }
        }
      ],
      providers: {
        deepgram: {
          adapter: "deepgram",
          capabilities: ["stt", "tts"],
          credential: { env: "DEEPGRAM_API_KEY" }
        },
        ...(process.env.ELEVENLABS_API_KEY
          ? {
              elevenlabs: {
                adapter: "elevenlabs" as const,
                capabilities: ["tts" as const],
                credential: { env: "ELEVENLABS_API_KEY" }
              }
            }
          : {})
      }
    }
  }).start();

  const bins = buildMediaNode(natsUrl!);
  if (!bins) throw new Error("no Go toolchain to build the media node");
  const media = new MediaNodeProcess(bins);
  const report: Record<string, unknown> = { voice, sttModel, llm };
  try {
    await media.start();
    await media.call({ appRef: "app-1" });
    await until(
      async () => (await media.status()).state === "answered",
      10000,
      "the answer"
    );
    const callStart = Date.now();

    // Waits until the agent has spoken and then been quiet for quietMs.
    const quiet = (since: number, quietMs: number) =>
      until(
        async () => {
          const s = await media.status(since);
          return (
            s.audibleMsSince > 0 &&
            Date.now() - (since + s.lastAudibleAfterMs) > quietMs
          );
        },
        30000,
        "the agent to finish speaking"
      );
    await quiet(callStart, 1200);
    report.greetingMs = (await media.status(callStart)).firstAudibleAfterMs;

    const results: Record<string, number>[] = [];
    for (let t = 0; t < turns; t++) {
      await media.speakPcm(question);
      const stoppedAt = await until(
        async () => (await media.status()).spokeUntilMs || undefined,
        question.length / 32 + 5000,
        "the caller to finish"
      );
      const firstAudio = await until(
        async () => {
          const ms = (await media.status(stoppedAt)).firstAudibleAfterMs ?? -1;
          return ms >= 0 ? ms : undefined;
        },
        20000,
        "the agent's reply"
      );
      await quiet(stoppedAt, 1500);
      // Where the time went, from the gateway's call record.
      const entries = [...record.records.values()][0] ?? [];
      const after = (pred: (m: Record<string, unknown>) => boolean) =>
        entries.find((e) => e.at >= stoppedAt && pred(e.message))?.at;
      const turnEnded = after((m) => m.type === "turn.ended");
      const speak = after((m) => m.type === "speak");
      const started = after((m) => m.type === "output.started");
      results.push({
        turnLatencyMs: firstAudio,
        ...(turnEnded ? { turnEndedMs: turnEnded - stoppedAt } : {}),
        ...(turnEnded && speak
          ? { llmFirstSentenceMs: speak - turnEnded }
          : {}),
        ...(speak && started ? { ttsFirstAudioMs: started - speak } : {}),
        ...(started
          ? { outputToCallerMs: firstAudio - (started - stoppedAt) }
          : {})
      });
    }
    report.turns = results;
    const lat = results.map((r) => r.turnLatencyMs).sort((a, b) => a - b);
    report.turnLatencyMs = { min: lat[0], max: lat[lat.length - 1] };

    const heard = await media.heard();
    fs.writeFileSync(path.join(out, "heard.wav"), wavOf(heard));
    const entries = [...record.records.values()][0] ?? [];
    fs.writeFileSync(
      path.join(out, "record.json"),
      JSON.stringify(entries, null, 2)
    );
    report.transcripts = entries
      .filter((e) => e.message.type === "turn.ended")
      .map((e) => e.message.text);
    report.spoken = entries
      .filter((e) => e.message.type === "speak")
      .map((e) => e.message.text);
    if (process.env.LIVE_TRANSCRIBE)
      report.callerHeard = await transcribe(
        process.env.DEEPGRAM_API_KEY!,
        heard
      );
    report.out = out;
    await media.hangup();
    await sleep(300);
  } finally {
    await media.stop();
    await gateway.stop();
    await autopilot.close();
    await nc.close();
  }
  console.log(JSON.stringify(report, null, 2));
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(`live-call failed: ${(e as Error).message}`);
    process.exit(1);
  }
);
