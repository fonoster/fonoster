/*
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
import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as net from "net";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { stringify } from "yaml";
import { checkHealth } from "../src/healthcheck";

// Signals sent to the built process (dist/main.js): node runs as PID 1 in the image, so a signal
// with no handler yet is ignored there and the container waits out its stop grace period.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const MAIN = path.join(__dirname, "..", "dist", "main.js");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function freePort(): Promise<number> {
  const server = net.createServer();
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as net.AddressInfo).port;
  await new Promise<void>((r) => server.close(() => r()));
  return port;
}

type Exit = { code: number | null; signal: string | null };

/** Resolves with how the process ended, or rejects once `ms` passes. */
function within(exit: Promise<Exit>, ms: number): Promise<Exit> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    exit,
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`AppBridge did not exit within ${ms} ms`)),
        ms
      );
    })
  ]).finally(() => clearTimeout(timer));
}

describe("@appbridge signals", function () {
  this.timeout(30000);
  let child: ChildProcess | undefined;
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "appbridge-signals-"));
  });

  afterEach(() => {
    child?.kill("SIGKILL");
    child = undefined;
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function start(config: object, logsLevel: string, out?: string[]) {
    const file = path.join(dir, "appbridge.yaml");
    fs.writeFileSync(file, stringify(config));
    const p = spawn(process.execPath, [MAIN, file], {
      env: { ...process.env, LOGS_LEVEL: logsLevel },
      stdio: ["ignore", "pipe", "pipe"]
    });
    child = p;
    for (const s of [p.stdout!, p.stderr!])
      s.on("data", (d: Buffer) => out?.push(d.toString()));
    const exit = new Promise<Exit>((resolve) =>
      p.once("exit", (code, signal) => resolve({ code, signal }))
    );
    return { p, exit };
  }

  it("[APB-042] exits 0 at once on SIGTERM while still starting", async function () {
    // A NATS that never answers keeps start() waiting on the connect.
    const { p, exit } = start(
      {
        nats: { url: "nats://10.255.255.1:4222" },
        session: { listen: `127.0.0.1:${await freePort()}` },
        providers: {}
      },
      "none"
    );
    await sleep(1000);
    const sent = Date.now();
    p.kill("SIGTERM");
    const result = await within(exit, 10000);
    expect(result).to.deep.equal({ code: 0, signal: null });
    expect(Date.now() - sent).to.be.below(3000);
  });

  it("[APB-042] drains on SIGTERM once the Session port reports SERVING", async function () {
    if (!NATS_URL) return this.skip();
    const address = `127.0.0.1:${await freePort()}`;
    const out: string[] = [];
    const { p, exit } = start(
      { nats: { url: NATS_URL }, session: { listen: address }, providers: {} },
      "info",
      out
    );
    const deadline = Date.now() + 15000;
    while (!(await checkHealth(address, 500))) {
      if (Date.now() > deadline)
        throw new Error("AppBridge was not SERVING within 15000 ms");
      await sleep(100);
    }
    p.kill("SIGTERM");
    const result = await within(exit, 10000);
    expect(result).to.deep.equal({ code: 0, signal: null });
    expect(out.join("")).to.include("draining");
  });
});
