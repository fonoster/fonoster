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
import * as net from "net";
import * as os from "os";
import * as path from "path";
import * as readline from "readline";

/** The Go Roomr node's source, relative to this package. */
export const ROOMR_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "go",
  "roomr"
);

/** Builds roomr and sipcaller into a temp dir; undefined when there is no Go toolchain. */
export function buildRoomr(natsUrl: string): RoomrBinaries | undefined {
  try {
    execFileSync("go", ["version"], { stdio: "ignore" });
  } catch {
    return undefined;
  }
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), "roomr-"));
  execFileSync("go", ["build", "-o", bin + path.sep, "./cmd/..."], {
    cwd: ROOMR_DIR,
    env: { ...process.env, GOTOOLCHAIN: process.env.GOTOOLCHAIN ?? "local" },
    stdio: "inherit"
  });
  return {
    natsUrl,
    roomr: path.join(bin, "roomr"),
    sipcaller: path.join(bin, "sipcaller")
  };
}

// A real Roomr node process (go/roomr) and the SIP caller bot (sipcaller) that calls it.
// Harnesses use it to run scenarios over real SIP and RTP.

export type RoomrBinaries = {
  natsUrl: string;
  /** Paths of the built `roomr` and `sipcaller` binaries. */
  roomr: string;
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
  /** The negotiated codec ("PCMU/8000", "opus/48000", ...). */
  codec?: string;
  /** True when the call's media is SRTP. */
  secure?: boolean;
  /** With a since time: ms from it to the first audible agent frame (-1: none yet). */
  firstAudibleAfterMs?: number;
  /** When the caller's queued speech finished (unix ms; 0 while speaking or before any). */
  spokeUntilMs?: number;
};

async function freeTcpPort(): Promise<number> {
  const s = net.createServer();
  await new Promise<void>((r) => s.listen(0, "127.0.0.1", r));
  const port = (s.address() as net.AddressInfo).port;
  await new Promise<void>((r) => s.close(() => r()));
  return port;
}

/** A port free for both UDP and TCP: the node listens for SIP on both. */
async function freeSipPort(): Promise<number> {
  const port = await freeTcpPort();
  const udp = dgram.createSocket("udp4");
  const bound = await new Promise<boolean>((r) => {
    udp.once("error", () => r(false));
    udp.bind(port, "127.0.0.1", () => r(true));
  });
  await new Promise<void>((r) => udp.close(() => r()));
  return bound ? port : freeSipPort();
}

/** Spawns a process and resolves with the first stdout line that matches. */
function startProcess(
  bin: string,
  args: string[],
  ready: RegExp,
  env?: Record<string, string | undefined>
): Promise<{ child: ChildProcess; line: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: env && { ...process.env, ...env }
    });
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

export class RoomrProcess {
  readonly nodeId = `go-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  heartbeatMs = 2000;
  /** The node's room limit (maxRooms); unset keeps the node's default. */
  maxRooms?: number;
  /** Extra environment for the node (e.g. OTEL_EXPORTER_OTLP_ENDPOINT). */
  env?: Record<string, string | undefined>;
  private node?: ChildProcess;
  private bot?: ChildProcess;
  private botUrl = "";
  private configDir?: string;
  private sipPort = 0;
  /** Whether the caller is on hold, from the hold and resume commands sent to the node. */
  private holding = false;
  /** Where the node serves Roomr (gRPC). */
  controlAddr = "";
  /** Where the node opens each call's control stream (AppBridge's Session port). */
  sessionEndpoint?: string;
  /** The bot's SIP address: the node's outbound proxy, and the proxy CreateCall may name. */
  botSipAddress = "";
  /** The bot's current call. */
  callId?: string;

  constructor(private readonly bins: RoomrBinaries) {}

  async start() {
    // The bot first: it is also the callee the node dials (Routr's place in production).
    const bot = await startProcess(this.bins.sipcaller, [], /^listening /);
    this.bot = bot.child;
    this.botUrl = `http://${bot.line.split(" ")[1]}`;
    const { address } = await this.api<{ address: string }>("/sip");
    this.botSipAddress = address;
    // A probed port can be taken again before the node binds it; the node then exits before
    // reporting ready, so start it again on fresh ports.
    const startNode = (attempt: number): Promise<ChildProcess> =>
      this.startNode(address).catch((err) =>
        attempt < 3 ? startNode(attempt + 1) : Promise.reject(err)
      );
    this.node = await startNode(1);
  }

  private async startNode(outboundProxy: string): Promise<ChildProcess> {
    this.sipPort = await freeSipPort();
    // Roomr (gRPC) needs a free TCP port too.
    this.controlAddr = `127.0.0.1:${await freeTcpPort()}`;
    // The node's only flag is -config: everything else is in the file (JSON is YAML).
    this.configDir ??= fs.mkdtempSync(path.join(os.tmpdir(), "roomr-config-"));
    const configPath = path.join(this.configDir, "roomr.yaml");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        nodeId: this.nodeId,
        nats: { url: this.bins.natsUrl },
        sip: {
          listen: `127.0.0.1:${this.sipPort}`,
          advertise: "127.0.0.1",
          // The deployments' call-ref header: the bot's X-Call-Ref names inbound calls.
          callRefHeader: "X-Call-Ref"
        },
        rtp: { host: "127.0.0.1", advertise: "127.0.0.1" },
        heartbeatInterval: `${this.heartbeatMs}ms`,
        outboundProxy,
        control: { grpc: { listen: this.controlAddr } },
        // Each call's control stream (redesign-roomr): the AppBridge under test.
        ...(this.sessionEndpoint
          ? { sessionEndpoint: this.sessionEndpoint }
          : {}),
        ...(this.maxRooms !== undefined ? { maxRooms: this.maxRooms } : {})
      })
    );
    return (
      await startProcess(
        this.bins.roomr,
        ["-config", configPath],
        /ready/,
        this.env
      )
    ).child;
  }

  /**
   * Follows the hold and resume commands sent to the node on a control stream (media.held): the
   * session endpoint's tap reports each message here.
   */
  noteStreamMessage(type: string, body: Record<string, unknown> = {}) {
    if (type === "hold") this.holding = true;
    if (type === "resume") this.holding = false;
    // A warm transfer holds the caller until it completes or fails.
    if (type === "transfer" && body.mode === "warm") this.holding = true;
    if (type === "transferResult") this.holding = false;
  }

  /**
   * How the bot answers what the node dials, by its own mode names ("answer", "busy",
   * "no_answer" rings forever, "unavailable", "decline"); with auth it challenges each INVITE.
   */
  async calleeMode(
    mode: string,
    auth?: { username: string; password: string }
  ) {
    const res = await fetch(`${this.botUrl}/callee`, {
      method: "POST",
      body: JSON.stringify({ mode, afterMs: 20, ...auth })
    });
    if (!res.ok) throw new Error(`caller bot /callee: ${res.status}`);
  }

  /** Every call the bot placed or received, and how many INVITEs it challenged. */
  botCalls() {
    return this.api<{
      calls: (BotCallStatus & {
        headers?: Record<string, string>;
        requestUri?: string;
      })[];
      challenged: number;
    }>("/calls");
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
    if (this.configDir)
      fs.rmSync(this.configDir, { recursive: true, force: true });
  }

  /**
   * Stops the node the way an orchestrator does (SIGTERM: drain, unregister, flush telemetry) and
   * waits for it to exit; a second SIGTERM stops a drain that still has rooms, and SIGKILL follows
   * if it hangs.
   */
  async shutdown(timeoutMs = 10000) {
    const p = this.node;
    if (!p || p.exitCode !== null || p.signalCode !== null) return;
    const exited = new Promise((r) => p.once("exit", r));
    p.kill("SIGTERM");
    const again = setTimeout(() => p.kill("SIGTERM"), timeoutMs / 2);
    const kill = setTimeout(() => p.kill("SIGKILL"), timeoutMs);
    await exited;
    clearTimeout(again);
    clearTimeout(kill);
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
    /** Codecs to offer, in order (default PCMU only). */
    codecs?: string[];
    /** Leave RFC 4733 out of the offer (SIP INFO and in-band DTMF). */
    noTelephoneEvent?: boolean;
  }) {
    const headers: Record<string, string> = {};
    if (call.appRef) headers["X-App-Ref"] = call.appRef;
    if (call.callRef) headers["X-Call-Ref"] = call.callRef;
    const status = await this.api("/calls", {
      target: `127.0.0.1:${this.sipPort}`,
      to: call.to ?? "+15550002222",
      from: call.from,
      headers,
      codecs: call.codecs,
      noTelephoneEvent: call.noTelephoneEvent
    });
    this.callId = status.id;
    return status;
  }

  status(since?: number) {
    return this.api(`/calls/${this.callId}${since ? `?since=${since}` : ""}`);
  }

  /** Sends keypresses as RFC 4733 events (default), SIP INFO or in-band tones. */
  dtmf(digits: string, mode: "rfc4733" | "info" | "inband" = "rfc4733") {
    return this.api(`/calls/${this.callId}/dtmf`, { digits, mode });
  }

  speak(kind: string, ms: number) {
    return this.api(`/calls/${this.callId}/audio`, { kind, ms });
  }

  /** The caller says recorded speech: 16-bit little-endian PCM at 16 kHz (sent as PCMU). */
  speakPcm(pcm: Buffer) {
    return this.api(`/calls/${this.callId}/audio`, {
      kind: "pcm",
      pcm: pcm.toString("base64")
    });
  }

  /** Everything the caller heard so far, as 16-bit little-endian PCM at 16 kHz. */
  async heard(): Promise<Buffer> {
    const res = await fetch(`${this.botUrl}/calls/${this.callId}/heard`);
    if (!res.ok) throw new Error(`caller bot heard: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  hangup() {
    return this.api(`/calls/${this.callId}/hangup`, {});
  }

  /** Whether the caller is on hold (the node has no debug endpoint: from its commands and events). */
  async held(): Promise<boolean> {
    return this.holding;
  }

  /** SIP statuses the caller received, without the 100 Trying transport detail. */
  async sip(): Promise<number[]> {
    if (!this.callId) return [];
    return (await this.status()).sip.filter((s) => s !== 100);
  }
}
