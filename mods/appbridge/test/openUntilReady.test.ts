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
import { expect } from "chai";
import { openUntilReady } from "../src/apps/openUntilReady";

function fakeLog() {
  const lines: { level: string; message: string }[] = [];
  return {
    lines,
    warn: (message: string) => lines.push({ level: "warn", message }),
    info: (message: string) => lines.push({ level: "info", message })
  };
}

function clock() {
  let t = 0;
  return {
    now: () => t,
    sleep: async (ms: number) => {
      t += ms;
    }
  };
}

describe("@appbridge[startup] first database load", function () {
  it("retries while the tables do not exist yet, with a warn line, then loads", async function () {
    const log = fakeLog();
    let calls = 0;
    const value = await openUntilReady(
      "apps",
      async () => {
        calls++;
        if (calls < 3)
          throw new Error(
            "Invalid `prisma.application.findMany()` invocation:\n\nThe table `public.applications` does not exist in the current database."
          );
        return "store";
      },
      log,
      clock()
    );
    expect(value).to.equal("store");
    expect(calls).to.equal(3);
    expect(log.lines.filter((l) => l.level === "warn")).to.have.length(2);
    expect(log.lines[0].message).to.match(
      /^apps not ready yet, retrying in 2s .*applications` does not exist/
    );
    expect(log.lines.at(-1)).to.deep.equal({
      level: "info",
      message: "apps loaded (attempt 3)"
    });
  });

  it("logs nothing when the first load works", async function () {
    const log = fakeLog();
    await openUntilReady("apps", async () => 1, log, clock());
    expect(log.lines).to.deep.equal([]);
  });

  it("gives up after the timeout with the last error", async function () {
    const log = fakeLog();
    let error: Error | undefined;
    try {
      await openUntilReady(
        "registry",
        async () => {
          throw new Error("still missing");
        },
        log,
        { ...clock(), retryMs: 1000, timeoutMs: 5000 }
      );
    } catch (e) {
      error = e as Error;
    }
    expect(error?.message).to.equal("still missing");
    expect(log.lines.length).to.be.within(4, 5);
  });
});
