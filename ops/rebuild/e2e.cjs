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
/* global process, console, setTimeout, fetch */
// `ops/rebuild/stack e2e`: the nightly end-to-end call (conformance "End-to-end caller bot",
// harden-conformance 2.3). The caller bot dials the seeded number through Routr; the call reaches
// the hosted Autopilot app over the media node and the gateway (fake STT, TTS and LLM). It checks:
//
//   1. the call is answered and the caller hears the greeting
//   2. the caller speaks and hears the agent's reply (audio both ways, one conversation turn)
//   3. the caller hangs up and the bot sees the call end
//   4. a sealed call record for the call is indexed (status completed) and its JWS verifies
//      against the region's records key
//
// Environment: RB_CALLER, RB_TARGET, RB_REQUEST_HOST, RB_TO, RB_QUESTION (16 kHz mono WAV),
// RB_API_HTTP (http://host:port), RB_API_ENDPOINT (gRPC host:port), RB_ADMIN_EMAIL,
// RB_ADMIN_PASSWORD, RB_WORKSPACE (accessKeyId), RB_APP_REF, RB_RECORDS_KEY (the region's
// records signing key, PEM) and RB_OUT (report directory, optional).
const fs = require("fs");
const path = require("path");
const { createPrivateKey, createPublicKey } = require("crypto");
const SDK = require("@fonoster/sdk");
const { verifySignature } = require("@fonoster/callrecord");

const env = (name, def) => {
  const v = process.env[name] ?? def;
  if (v === undefined) throw new Error(`${name} is not set`);
  return v;
};
const caller = env("RB_CALLER");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function http(method, url, body, headers = {}) {
  const res = await fetch(url, {
    method,
    headers: body
      ? { "content-type": "application/json", ...headers }
      : headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok)
    throw new Error(`${method} ${url}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function until(what, check, timeoutMs, everyMs = 250) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const v = await check();
    if (v !== undefined) return v;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(everyMs);
  }
}

/** The PCM samples of a 16-bit mono 16 kHz WAV (its data chunk). */
function wavPcm(file) {
  const buf = fs.readFileSync(file);
  let off = 12;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "data") return buf.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size % 2);
  }
  throw new Error(`${file}: no data chunk`);
}

/** Waits until the agent has been quiet for `quietMs` after it was heard (or the call ended). */
async function waitQuiet(id, quietMs, maxMs) {
  let last = -1;
  let since = Date.now();
  return until(
    "the agent to finish speaking",
    async () => {
      const s = await http("GET", `${caller}/calls/${id}`);
      if (s.state === "ended") return s;
      if (s.audibleMs !== last) {
        last = s.audibleMs;
        since = Date.now();
      } else if (last > 0 && Date.now() - since >= quietMs) return s;
      return undefined;
    },
    maxMs,
    200
  );
}

const step = (n, text) => console.error(`[e2e] ${n}. ${text}`);

async function main() {
  const report = { startedAt: new Date().toISOString() };
  const startedAt = Date.now() - 1000;

  // 1. Answered, greeting heard. Routr answers 480 until the media node registers: retry.
  let call;
  for (let i = 0; ; i++) {
    call = await http("POST", `${caller}/calls`, {
      Target: env("RB_TARGET"),
      RequestHost: env("RB_REQUEST_HOST"),
      To: env("RB_TO"),
      From: "+15550001111"
    });
    const s = await until(
      "the call to be answered or end",
      async () => {
        const s = await http("GET", `${caller}/calls/${call.id}`);
        return s.state === "answered" || s.state === "ended" ? s : undefined;
      },
      15000
    );
    if (s.state === "answered") break;
    if (i >= 20)
      throw new Error(`the call never connected: ${JSON.stringify(s)}`);
    await sleep(3000);
  }
  const id = call.id;
  const greeting = await waitQuiet(id, 1500, 30000);
  if (greeting.state === "ended")
    throw new Error("the call ended during the greeting");
  if (!(greeting.audibleMs > 0))
    throw new Error("the caller heard no greeting");
  report.greetingAudibleMs = greeting.audibleMs;
  step(
    1,
    `answered (${greeting.codec}); greeting heard: ${greeting.audibleMs} ms`
  );

  // 2. The caller speaks; the agent replies.
  const before = (await http("GET", `${caller}/calls/${id}`)).spokeUntilMs;
  await http("POST", `${caller}/calls/${id}/audio`, {
    Kind: "pcm",
    pcm: wavPcm(env("RB_QUESTION")).toString("base64")
  });
  const spokeUntil = await until(
    "the caller to finish speaking",
    async () => {
      const s = await http("GET", `${caller}/calls/${id}`);
      if (s.state === "ended")
        throw new Error("the call ended while the caller spoke");
      return s.spokeUntilMs && s.spokeUntilMs !== before
        ? s.spokeUntilMs
        : undefined;
    },
    60000,
    50
  );
  const reply = await until(
    "the agent's reply",
    async () => {
      const s = await http("GET", `${caller}/calls/${id}?since=${spokeUntil}`);
      if (s.state === "ended")
        throw new Error("the call ended before the reply");
      return s.firstAudibleAfterMs >= 0 ? s : undefined;
    },
    30000,
    100
  );
  report.replyLatencyMs = reply.firstAudibleAfterMs;
  step(
    2,
    `the caller spoke; the agent replied after ${reply.firstAudibleAfterMs} ms`
  );
  await waitQuiet(id, 1500, 30000);

  // 3. The caller hangs up.
  await http("POST", `${caller}/calls/${id}/hangup`, {});
  const ended = await until(
    "the call to end",
    async () => {
      const s = await http("GET", `${caller}/calls/${id}`);
      return s.state === "ended" ? s : undefined;
    },
    10000
  );
  report.sip = ended.sip;
  step(3, `hung up (SIP ${JSON.stringify(ended.sip)})`);

  // 4. A sealed, verifiable call record.
  const client = new SDK.Client({
    endpoint: env("RB_API_ENDPOINT"),
    accessKeyId: env("RB_WORKSPACE"),
    allowInsecure: true
  });
  await client.login(env("RB_ADMIN_EMAIL"), env("RB_ADMIN_PASSWORD"));
  const headers = {
    authorization: `Bearer ${client.getAccessToken()}`,
    "x-accesskey-id": env("RB_WORKSPACE")
  };
  const api = env("RB_API_HTTP");
  const appRef = env("RB_APP_REF");
  const after = new Date(startedAt).toISOString();
  const indexed = await until(
    "the call record in the index",
    async () => {
      const { items } = await http(
        "GET",
        `${api}/api/records?appRef=${encodeURIComponent(appRef)}&after=${encodeURIComponent(after)}`,
        undefined,
        headers
      );
      return items.find((r) => r.from === "+15550001111" && r.endedAt);
    },
    60000,
    1000
  );
  if (indexed.status !== "completed")
    throw new Error(
      `the record's status is ${indexed.status}: ${JSON.stringify(indexed)}`
    );
  const record = await http(
    "GET",
    `${api}/api/records/${encodeURIComponent(indexed.callRef)}?original=true`,
    undefined,
    headers
  );
  const publicKeyPem = createPublicKey(
    createPrivateKey(fs.readFileSync(env("RB_RECORDS_KEY")))
  ).export({ type: "spki", format: "pem" });
  // The region's key history for the kid the record names: one key in this stack.
  const keys = Object.fromEntries(
    record.jws.signatures.map((s) => [s.header?.kid, publicKeyPem])
  );
  const kid = verifySignature(record.jws, keys);
  if (!kid) throw new Error("the record's signature does not verify");
  Object.assign(report, {
    callRef: indexed.callRef,
    status: indexed.status,
    endReason: indexed.endReason,
    durationSeconds: indexed.durationSeconds,
    parts: record.parts?.map((p) => p.name ?? p),
    kid
  });
  step(
    4,
    `record ${indexed.callRef}: ${indexed.status}, ${indexed.endReason}, ${indexed.durationSeconds} s, signed by ${kid}`
  );

  const out = process.env.RB_OUT;
  if (out) {
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(
      path.join(out, "e2e.json"),
      JSON.stringify(report, null, 2)
    );
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(`[e2e] failed: ${e.message}`);
  process.exit(1);
});
