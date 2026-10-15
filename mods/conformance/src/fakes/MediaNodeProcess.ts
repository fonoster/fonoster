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
import * as dgram from "dgram";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as readline from "readline";

/** The Go media node's source, relative to this package. */
export const MEDIANODE_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "go",
  "medianode"
);

/** Builds medianode and sipcaller into a temp dir; undefined when there is no Go toolchain. */
export function buildMediaNode(natsUrl: string): MediaNodeBinaries | undefined {
  try {
    execFileSync("go", ["version"], { stdio: "ignore" });
  } catch {
    return undefined;
  }
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), "medianode-"));
  execFileSync("go", ["build", "-o", bin + path.sep, "./cmd/..."], {
    cwd: MEDIANODE_DIR,
    env: { ...process.env, GOTOOLCHAIN: process.env.GOTOOLCHAIN ?? "local" },
    stdio: "inherit"
  });
  return {
    natsUrl,
    medianode: path.join(bin, "medianode"),
    sipcaller: path.join(bin, "sipcaller")
  };
}

// A real media node process (go/medianode) and the SIP caller bot (sipcaller) that calls it.
// Harnesses use it to run scenarios over real SIP and RTP.

export type MediaNodeBinaries = {
  natsUrl: string;
  /** Paths of the built `medianode` and `sipcaller` binaries. */
  medianode: string;
  sipcaller: string;
};

export type BotCallStatus = {
  id: string;
  sip: number[];
  state: "calling" | "answered" | "ended";
  heardMs: number;
  audibleMs: number;
  audibleMsSince: number;
  lastAudibleAfterMs: number;
};

async function freeUdpPort(): Promise<number> {
  const s = dgram.createSocket("udp4");
  await new Promise<void>((r) => s.bind(0, "127.0.0.1", r));
  const port = s.address().port;
  await new Promise<void>((r) => s.close(() => r()));
  return port;
}

/** Spawns a process and resolves with the first stdout line that matches. */
function startProcess(
  bin: string,
  args: string[],
  ready: RegExp
): Promise<{ child: ChildProcess; line: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    const lines = readline.createInterface({ input: child.stdout! });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${bin} did not start`));
    }, 10000);
    lines.on("line", (line) => {
      if (ready.test(line)) {
        clearTimeout(timer);
        resolve({ child, line });
      }
    });
    child.stderr!.on("data", () => undefined);
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`${bin} exited with ${code}`));
    });
  });
}

async function stopProcess(p: ChildProcess) {
  if (p.exitCode !== null || p.signalCode !== null) return;
  const exited = new Promise((r) => p.once("exit", r));
  p.kill("SIGKILL");
  await exited;
}

export class MediaNodeProcess {
  readonly nodeId = `go-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  heartbeatMs = 2000;
  private node?: ChildProcess;
  private bot?: ChildProcess;
  private botUrl = "";
  private sipPort = 0;
  private debugPort = 0;
  /** The bot's current call. */
  callId?: string;

  constructor(private readonly bins: MediaNodeBinaries) {}

  async start() {
    this.sipPort = await freeUdpPort();
    // The bot first: it is also the callee the node dials (Routr's place in production).
    const bot = await startProcess(this.bins.sipcaller, [], /^listening /);
    this.bot = bot.child;
    this.botUrl = `http://${bot.line.split(" ")[1]}`;
    const { address } = await this.api<{ address: string }>("/sip");
    this.debugPort = await freeUdpPort();
    this.node = (
      await startProcess(
        this.bins.medianode,
        [
          "-node-id",
          this.nodeId,
          "-nats",
          this.bins.natsUrl,
          "-sip",
          `127.0.0.1:${this.sipPort}`,
          "-sip-advertise",
          "127.0.0.1",
          "-rtp",
          "127.0.0.1",
          "-rtp-advertise",
          "127.0.0.1",
          "-heartbeat",
          `${this.heartbeatMs}ms`,
          "-outbound-proxy",
          address,
          "-debug",
          `127.0.0.1:${this.debugPort}`
        ],
        /ready/
      )
    ).child;
  }

  /** How the bot answers what the node dials (media-control dialOutcome). */
  async callee(outcome: "answered" | "busy" | "no_answer" | "failed") {
    const mode = {
      answered: "answer",
      busy: "busy",
      no_answer: "unavailable",
      failed: "decline"
    }[outcome];
    const res = await fetch(`${this.botUrl}/callee`, {
      method: "POST",
      body: JSON.stringify({ mode, afterMs: 20 })
    });
    if (!res.ok) throw new Error(`caller bot /callee: ${res.status}`);
  }

  async stop() {
    await Promise.all([this.node, this.bot].map((p) => p && stopProcess(p)));
  }

  /** Kills the node without warning (no heartbeats, replies or BYEs). */
  crash() {
    this.node?.kill("SIGKILL");
  }

  private async api<T = BotCallStatus>(
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.botUrl}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`caller bot ${path}: ${res.status}`);
    return (await res.json()) as T;
  }

  /** Places a call to the node, adding the headers Routr would (X-App-Ref, X-Call-Ref). */
  async call(call: {
    to?: string;
    from?: string;
    appRef?: string;
    callRef?: string;
  }) {
    const headers: Record<string, string> = {};
    if (call.appRef) headers["X-App-Ref"] = call.appRef;
    if (call.callRef) headers["X-Call-Ref"] = call.callRef;
    const status = await this.api("/calls", {
      target: `127.0.0.1:${this.sipPort}`,
      to: call.to ?? "+15550002222",
      from: call.from,
      headers
    });
    this.callId = status.id;
    return status;
  }

  status(since?: number) {
    return this.api(`/calls/${this.callId}${since ? `?since=${since}` : ""}`);
  }

  dtmf(digits: string) {
    return this.api(`/calls/${this.callId}/dtmf`, { digits });
  }

  speak(kind: string, ms: number) {
    return this.api(`/calls/${this.callId}/audio`, { kind, ms });
  }

  hangup() {
    return this.api(`/calls/${this.callId}/hangup`, {});
  }

  /** Whether any room on the node has a participant on hold (from the node's debug endpoint). */
  async held(): Promise<boolean> {
    const res = await fetch(`http://127.0.0.1:${this.debugPort}/rooms`);
    const rooms = (await res.json()) as { held: boolean }[];
    return rooms.some((r) => r.held);
  }

  /** SIP statuses the caller received, without the 100 Trying transport detail. */
  async sip(): Promise<number[]> {
    if (!this.callId) return [];
    return (await this.status()).sip.filter((s) => s !== 100);
  }
}
