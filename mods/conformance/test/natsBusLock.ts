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
/**
 * Loaded by mocha before any test file (see .mocharc.cjs): one test run at a time on the
 * conformance NATS server (CONFORMANCE_NATS_URL).
 *
 * The suites' gateways all join the `gateway-incoming` queue group on `gateway.incoming`, so two
 * runs on one server (two worktrees, or the dev container and the host, sharing `nats-test`)
 * claim each other's calls: the call goes to the other run's gateway and the fake app of the run
 * that placed it fails with "no connection reached the fake app". The run holds a key in a
 * JetStream KV bucket for its whole duration; another run waits for it. The key expires 30 s after
 * its last refresh, so a killed run does not hold the server.
 */
import { randomUUID } from "crypto";
import { hostname } from "os";
import { connect, KV, NatsConnection } from "nats";

const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const BUCKET = "conformance_bus_lock";
const KEY = "owner";
const TTL_MS = 30_000;
const REFRESH_MS = 10_000;
/** How long a run waits for another one before failing (a full suite takes minutes). */
const WAIT_MS = Number(
  process.env.CONFORMANCE_NATS_LOCK_WAIT_MS ?? 30 * 60_000
);

const owner = `${hostname()}:${process.pid}:${randomUUID()}`;
let nc: NatsConnection | undefined;
let kv: KV | undefined;
let refresh: ReturnType<typeof setInterval> | undefined;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function holder(): Promise<string | undefined> {
  const entry = await kv!.get(KEY);
  return entry && entry.operation === "PUT" ? entry.string() : undefined;
}

async function acquire() {
  nc = await connect({ servers: NATS_URL, name: `conformance-lock ${owner}` });
  try {
    kv = await nc.jetstream().views.kv(BUCKET, {
      history: 1,
      ttl: TTL_MS,
      description: "one test run at a time"
    });
  } catch (e) {
    // No JetStream: nothing to lock with (the suites that need it skip or fail on their own).
    console.warn(`conformance NATS lock unavailable: ${(e as Error).message}`);
    await nc.close();
    nc = undefined;
    return;
  }
  const deadline = Date.now() + WAIT_MS;
  let announced = false;
  for (;;) {
    try {
      await kv.create(KEY, owner);
      break;
    } catch {
      if (Date.now() > deadline)
        throw new Error(
          `another test run holds ${NATS_URL} (${await holder()}); gave up after ${WAIT_MS} ms`
        );
      if (!announced) {
        console.warn(
          `waiting for another test run on ${NATS_URL} to finish (${await holder()})`
        );
        announced = true;
      }
      await sleep(1000);
    }
  }
  refresh = setInterval(() => {
    kv?.put(KEY, owner).catch(() => undefined);
  }, REFRESH_MS);
  refresh.unref();
}

async function release() {
  clearInterval(refresh);
  try {
    if (kv && (await holder()) === owner) await kv.delete(KEY);
  } finally {
    await nc?.close();
  }
}

export const mochaHooks = NATS_URL
  ? {
      async beforeAll(this: { timeout(ms: number): void }) {
        this.timeout(WAIT_MS + 10_000);
        await acquire();
      },
      async afterAll() {
        await release();
      }
    }
  : {};
