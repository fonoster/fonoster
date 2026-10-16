#!/usr/bin/env node
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
/* global process, console, setTimeout, fetch, Buffer */
// `ops/rebuild/stack ask`: one call from the caller bot through Routr to the seeded number. The
// bot waits for the greeting, says a recorded question (16 kHz mono WAV), and measures the turn
// latency: end of the question → first audible agent audio. It saves what it heard as a WAV and,
// with RB_TRANSCRIBE=1 and DEEPGRAM_API_KEY, transcribes it with Deepgram (about $0.001).
//
// Environment: RB_CALLER (bot URL), RB_TARGET (Routr host:port in the network), RB_REQUEST_HOST,
// RB_TO, RB_QUESTION (WAV), RB_TURNS (default 1), RB_OUT (directory), RB_TRANSCRIBE.
const fs = require("fs");
const path = require("path");

const env = (name, def) => {
  const v = process.env[name] ?? def;
  if (v === undefined) throw new Error(`${name} is not set`);
  return v;
};
const caller = env("RB_CALLER");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function http(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok)
    throw new Error(`${method} ${url}: ${res.status} ${await res.text()}`);
  const type = res.headers.get("content-type") ?? "";
  return type.includes("json")
    ? res.json()
    : Buffer.from(await res.arrayBuffer());
}

/** The PCM samples of a 16-bit mono WAV (the data chunk). */
function wavPcm(file) {
  const buf = fs.readFileSync(file);
  let off = 12;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") {
      const channels = buf.readUInt16LE(off + 10);
      const rate = buf.readUInt32LE(off + 12);
      const bits = buf.readUInt16LE(off + 22);
      if (channels !== 1 || rate !== 16000 || bits !== 16)
        throw new Error(`${file}: need 16 kHz mono 16-bit PCM`);
    }
    if (id === "data") return buf.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size % 2);
  }
  throw new Error(`${file}: no data chunk`);
}

function wav(pcm, rate = 16000) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

/** Waits until the agent has been quiet for `quietMs` after speaking (or `maxMs` passes). */
async function waitQuiet(id, quietMs, maxMs) {
  const deadline = Date.now() + maxMs;
  let last = -1;
  let since = Date.now();
  while (Date.now() < deadline) {
    const s = await http("GET", `${caller}/calls/${id}`);
    if (s.state === "ended") return s;
    if (s.audibleMs !== last) {
      last = s.audibleMs;
      since = Date.now();
    } else if (last > 0 && Date.now() - since >= quietMs) return s;
    await sleep(200);
  }
  return http("GET", `${caller}/calls/${id}`);
}

async function transcribe(pcm) {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return undefined;
  const res = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true",
    {
      method: "POST",
      headers: { authorization: `Token ${key}`, "content-type": "audio/wav" },
      body: wav(pcm)
    }
  );
  if (!res.ok) return `transcription failed: ${res.status}`;
  const body = await res.json();
  return body.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
}

async function main() {
  const question = wavPcm(env("RB_QUESTION"));
  const turns = Number(env("RB_TURNS", "1"));
  const out = env("RB_OUT");
  let call;
  for (let i = 0; ; i++) {
    call = await http("POST", `${caller}/calls`, {
      Target: env("RB_TARGET"),
      RequestHost: env("RB_REQUEST_HOST"),
      To: env("RB_TO"),
      From: "+15550001111"
    });
    await sleep(3000);
    const s = await http("GET", `${caller}/calls/${call.id}`);
    if (s.state !== "ended") break;
    if (i >= 20)
      throw new Error(`the call did not connect: ${JSON.stringify(s)}`);
    await sleep(2000);
  }
  const id = call.id;
  const greeting = await waitQuiet(id, 1500, 20000);
  const report = {
    callId: id,
    greetingAudibleMs: greeting.audibleMs,
    turns: []
  };
  for (let t = 0; t < turns; t++) {
    const before = (await http("GET", `${caller}/calls/${id}`)).spokeUntilMs;
    await http("POST", `${caller}/calls/${id}/audio`, {
      Kind: "pcm",
      pcm: question.toString("base64")
    });
    // spokeUntilMs is 0 while the bot speaks, then the time the question ended.
    let until = 0;
    while (!until) {
      const s = await http("GET", `${caller}/calls/${id}`);
      if (s.state === "ended") throw new Error("the call ended while asking");
      if (s.spokeUntilMs && s.spokeUntilMs !== before) until = s.spokeUntilMs;
      else await sleep(50);
    }
    let latency = -1;
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const s = await http("GET", `${caller}/calls/${id}?since=${until}`);
      if (s.firstAudibleAfterMs >= 0) {
        latency = s.firstAudibleAfterMs;
        break;
      }
      await sleep(100);
    }
    await waitQuiet(id, 2000, 30000);
    report.turns.push({ latencyMs: latency });
  }
  const heard = await http("GET", `${caller}/calls/${id}/heard`);
  await http("POST", `${caller}/calls/${id}/hangup`).catch(() => undefined);
  fs.mkdirSync(out, { recursive: true });
  const heardFile = path.join(out, "heard.wav");
  fs.writeFileSync(heardFile, wav(heard));
  report.heardFile = heardFile;
  report.heardSeconds = Math.round(heard.length / 3200) / 10;
  if (process.env.RB_TRANSCRIBE === "1") report.heard = await transcribe(heard);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(`ask failed: ${e.message}`);
  process.exit(1);
});
