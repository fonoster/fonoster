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
import { IdentityClient } from "@fonoster/identity-client";
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import { createSharedRateLimiter } from "../../src/utils/rateLimiter";
import { StandaloneIdentity, startStandaloneIdentity } from "./standalone";

// The send limits across Identity replicas (ST-4, audit #11): the counters are in the database,
// so codes (here reset codes, which every configuration serves) requested round robin from two replicas, and after a restart, are still
// limited per contact. Needs PERSISTENCE_TEST_DATABASE_URL and a built `fonoster-identity`.

/** The gRPC status of one SendResetPasswordCode (0 when it succeeded). */
const send = (client: IdentityClient, email: string) =>
  client.sendResetPasswordCode(email, "").then(
    () => 0,
    (e: { code: number }) => e.code
  );

describe("@identity[shared send limits] (needs PERSISTENCE_TEST_DATABASE_URL)", function () {
  this.timeout(90_000);
  let identity: StandaloneIdentity | undefined;

  before(async function () {
    identity = await startStandaloneIdentity();
    if (!identity)
      throw new Error(
        "PERSISTENCE_TEST_DATABASE_URL is required: a skipped case is Blocked, never Pass"
      );
  });

  after(async () => {
    await identity?.stop();
  });

  it("[API-044] counts one window across limiter instances (replicas) and restarts", async function () {
    const opts = { name: "test", limit: 3, windowMs: 60_000 };
    const replicas = [1, 2, 3].map(() =>
      createSharedRateLimiter(identity!.prisma, opts)
    );
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await replicas[i % 3]("k1"));
    expect(results).to.deep.equal([true, true, true, false]);
    // A restarted replica starts with no memory and still refuses.
    const restarted = createSharedRateLimiter(identity!.prisma, opts);
    expect(await restarted("k1")).to.equal(false);
    expect(await restarted("k2")).to.equal(true);
    // A new window starts once the old one is over.
    await identity!.prisma.$executeRawUnsafe(
      `UPDATE rate_limit_windows SET started_at = now() - interval '2 minutes' WHERE key = 'test:k1'`
    );
    expect(await restarted("k1")).to.equal(true);
  });

  it("[API-044] limits codes per address across two replicas of the service and a restart", async function () {
    const a = new IdentityClient(identity!.endpoint);
    const second = await identity!.replica();
    const b = new IdentityClient(second.endpoint);
    const email = "limits@identity.test";
    // 3 reset codes per address per 10 minutes: round robin over the two replicas.
    const codes = [
      await send(a, email),
      await send(b, email),
      await send(a, email),
      await send(b, email)
    ];
    expect(codes).to.deep.equal([0, 0, 0, status.RESOURCE_EXHAUSTED]);
    // B restarts: its replacement still refuses.
    b.close();
    await second.stop();
    const third = await identity!.replica();
    const c = new IdentityClient(third.endpoint);
    expect(await send(c, email)).to.equal(status.RESOURCE_EXHAUSTED);
    expect(await send(c, "other@identity.test")).to.equal(0);
    a.close();
    c.close();
  });
});
