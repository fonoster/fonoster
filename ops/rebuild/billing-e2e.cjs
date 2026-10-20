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
// `ops/rebuild/stack billing-e2e`: a call is refused once the balance is gone (add-billing-service
// 7.1), on the stack with the billing profile and a Trial of a few credits
// (RB_BILLING_TRIAL_CREDITS). The caller bot dials the seeded number through Routr:
//
//   1. the first call is admitted and answered; the caller holds it, then hangs up
//   2. its usage (call seconds) reaches billing through the apiserver and uses up the Trial
//   3. a later call is refused with SIP 402 before it is answered
//
// Usage arrives after the call's record is sealed, so step 3 retries for up to two minutes; a call
// answered meanwhile is hung up at once.
//
// Environment: RB_CALLER, RB_TARGET, RB_REQUEST_HOST, RB_TO and RB_HOLD_SECONDS (default 40).

const env = (name, def) => {
  const v = process.env[name] ?? def;
  if (v === undefined) throw new Error(`${name} is not set`);
  return v;
};
const caller = env("RB_CALLER");
const holdMs = Number(env("RB_HOLD_SECONDS", "40")) * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function http(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok)
    throw new Error(`${method} ${url}: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Dials the seeded number; resolves once the call is answered or has ended. */
async function dial() {
  const call = await http("POST", `${caller}/calls`, {
    Target: env("RB_TARGET"),
    RequestHost: env("RB_REQUEST_HOST"),
    To: env("RB_TO"),
    From: "+15550001111"
  });
  const deadline = Date.now() + 20000;
  for (;;) {
    const s = await http("GET", `${caller}/calls/${call.id}`);
    if (s.state === "answered" || s.state === "ended") return s;
    if (Date.now() > deadline)
      throw new Error(`call ${call.id} neither answered nor ended`);
    await sleep(250);
  }
}

const hangUp = (id) => http("POST", `${caller}/calls/${id}/hangup`, {});
const step = (n, text) => console.error(`[billing-e2e] ${n}. ${text}`);

async function main() {
  // 1. Admitted and answered. Routr answers 480 until the Roomr node registers: retry.
  let first;
  for (let i = 0; ; i++) {
    first = await dial();
    if (first.state === "answered") break;
    if (first.sip.includes(402))
      throw new Error("the first call was refused: the Trial had no credits");
    if (i >= 20)
      throw new Error(`the call never connected: ${JSON.stringify(first)}`);
    await sleep(3000);
  }
  step(1, `answered; holding ${holdMs / 1000} s`);
  await sleep(holdMs);
  await hangUp(first.id);
  step(2, "hung up; waiting for its usage to use up the Trial");

  // 3. Refused once billing has the usage.
  const deadline = Date.now() + 120000;
  for (let n = 1; ; n++) {
    const s = await dial();
    if (s.state === "answered") await hangUp(s.id);
    else if (s.sip.includes(402)) {
      step(3, `call ${n} after it refused with SIP ${JSON.stringify(s.sip)}`);
      return;
    }
    if (Date.now() > deadline)
      throw new Error(
        `no call was refused within two minutes (last: ${JSON.stringify(s)})`
      );
    await sleep(5000);
  }
}

main().catch((e) => {
  console.error(`[billing-e2e] FAILED: ${e.message}`);
  process.exit(1);
});
