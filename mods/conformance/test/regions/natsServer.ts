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
import { ChildProcess, execFileSync, spawn } from "child_process";
import * as fs from "fs";
import * as net from "net";
import * as path from "path";

// Real nats-server processes for the regions suite: the control plane's region hub (operator
// mode, TLS leaf listener) and a cell's server (one outbound leaf remote). The binary comes from
// NATS_SERVER_BIN or the PATH; the suite skips without it. Test certificates are made with openssl
// at test time, so no private key is ever committed.

/** The nats-server binary, or undefined when this machine has none. */
export function natsServerBin(): string | undefined {
  const candidates = [
    process.env.NATS_SERVER_BIN,
    ...(process.env.PATH ?? "")
      .split(path.delimiter)
      .map((d) => path.join(d, "nats-server")),
    path.join(process.env.HOME ?? "", "go", "bin", "nats-server")
  ];
  return candidates.find((c) => c && fs.existsSync(c));
}

export function hasOpenssl() {
  try {
    execFileSync("openssl", ["version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** A TCP port free on 127.0.0.1 right now. */
export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address() as net.AddressInfo;
      s.close(() => resolve(port));
    });
  });
}

export type TestCerts = { ca: string; cert: string; key: string };

/** A throwaway CA and a server certificate for 127.0.0.1, valid for one day. */
export function makeCerts(dir: string): TestCerts {
  const p = (f: string) => path.join(dir, f);
  const run = (...args: string[]) =>
    execFileSync("openssl", args, { cwd: dir, stdio: "pipe" });
  const ec = ["-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:prime256v1"];
  run(
    "req",
    "-x509",
    ...ec,
    "-nodes",
    "-keyout",
    p("ca.key"),
    "-out",
    p("ca.pem"),
    "-days",
    "1",
    "-subj",
    "/CN=fonoster-test-ca"
  );
  run(
    "req",
    ...ec,
    "-nodes",
    "-keyout",
    p("server.key"),
    "-out",
    p("server.csr"),
    "-subj",
    "/CN=127.0.0.1"
  );
  fs.writeFileSync(p("san.ext"), "subjectAltName=IP:127.0.0.1,DNS:localhost\n");
  run(
    "x509",
    "-req",
    "-in",
    p("server.csr"),
    "-CA",
    p("ca.pem"),
    "-CAkey",
    p("ca.key"),
    "-CAcreateserial",
    "-out",
    p("server.pem"),
    "-days",
    "1",
    "-extfile",
    p("san.ext")
  );
  return { ca: p("ca.pem"), cert: p("server.pem"), key: p("server.key") };
}

export type NatsServerOptions = {
  /** Where nats.conf is written; includes resolve from here. */
  dir: string;
  conf: string;
  httpPort: number;
  env?: Record<string, string | undefined>;
};

/** One nats-server process with its monitoring endpoint. */
export class NatsServer {
  private child?: ChildProcess;
  readonly log: string[] = [];

  constructor(
    private readonly bin: string,
    readonly options: NatsServerOptions
  ) {}

  get monitor() {
    return `http://127.0.0.1:${this.options.httpPort}`;
  }

  /** Starts the server and resolves once /healthz answers. */
  async start(timeoutMs = 10_000) {
    const confFile = path.join(this.options.dir, "nats.conf");
    fs.writeFileSync(confFile, this.options.conf);
    const child = spawn(this.bin, ["-c", confFile], {
      cwd: this.options.dir,
      env: { ...process.env, ...this.options.env },
      stdio: ["ignore", "pipe", "pipe"]
    });
    this.child = child;
    const collect = (b: Buffer) =>
      this.log.push(...b.toString().split("\n").filter(Boolean));
    child.stdout!.on("data", collect);
    child.stderr!.on("data", collect);
    let exited: number | null | undefined;
    child.once("exit", (code) => (exited = code));
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      if (exited !== undefined)
        throw new Error(
          `nats-server exited (${exited}): ${this.log.slice(-5).join(" | ")}`
        );
      const ok = await fetch(`${this.monitor}/healthz`)
        .then((r) => r.ok)
        .catch(() => false);
      if (ok) return this;
      if (Date.now() > deadline)
        throw new Error(
          `nats-server did not become healthy: ${this.log.slice(-5).join(" | ")}`
        );
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  /** A monitoring document (varz, leafz, connz, …). */
  async get<T = Record<string, unknown>>(what: string): Promise<T> {
    const r = await fetch(`${this.monitor}/${what}`);
    return (await r.json()) as T;
  }

  /** Stops the process and waits for it to exit. */
  async stop() {
    const child = this.child;
    this.child = undefined;
    if (!child || child.exitCode !== null) return;
    const gone = new Promise((r) => child.once("exit", r));
    child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 5000);
    await gone;
    clearTimeout(timer);
  }
}
