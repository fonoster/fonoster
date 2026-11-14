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
// The fake TTS of the fake provider protocol (mods/conformance/PROVIDERS.md, copied from
// mods/conformance/src/fakes/providers/FakeTts.ts): a 440 Hz tone, 60 ms per character, pcm16 at
// 16 kHz, streamed in 20 ms chunks as fast as possible.
import * as http from "node:http";

const MS_PER_CHAR = 60;
const RATE = 16000;
const BYTES_PER_MS = (RATE * 2) / 1000;
const CHUNK = 20 * BYTES_PER_MS;

/** One second of tone; longer audio repeats it. */
const TONE = (() => {
  const buf = Buffer.alloc(RATE * 2);
  for (let i = 0; i < RATE; i++)
    buf.writeInt16LE(
      Math.round(8000 * Math.sin((2 * Math.PI * 440 * i) / RATE)),
      i * 2
    );
  return buf;
})();

function wordTimings(text: string) {
  return [...text.matchAll(/\S+/g)].map((m) => ({
    word: m[0],
    startMs: m.index * MS_PER_CHAR,
    endMs: (m.index + m[0].length) * MS_PER_CHAR
  }));
}

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const parts: Buffer[] = [];
  for await (const part of req) parts.push(part as Buffer);
  try {
    return JSON.parse(Buffer.concat(parts).toString() || "{}");
  } catch {
    return undefined;
  }
}

export function startTts(port: number) {
  const server = http.createServer(async (req, res) => {
    const path = req.url?.split("?")[0];
    if (req.method === "GET" && path === "/healthz")
      return json(res, 200, { ok: true });
    if (req.method !== "POST" || path !== "/v1/synthesize")
      return json(res, 404, { error: { code: "not_found" } });
    const body = (await readJson(req)) as { text?: unknown } | undefined;
    const text = body?.text;
    if (typeof text !== "string" || !text.length)
      return json(res, 400, {
        error: { code: "bad_request", message: "text is required" }
      });

    const durationMs = text.length * MS_PER_CHAR;
    res.writeHead(200, {
      "content-type": "application/octet-stream",
      "x-fake-duration-ms": String(durationMs),
      "x-fake-word-timings": JSON.stringify(wordTimings(text))
    });
    const total = durationMs * BYTES_PER_MS;
    for (let offset = 0; offset < total; offset += CHUNK) {
      const start = offset % TONE.length;
      res.write(TONE.subarray(start, start + Math.min(CHUNK, total - offset)));
    }
    res.end();
  });
  server.keepAliveTimeout = 65_000;
  server.listen(port, "127.0.0.1");
}
