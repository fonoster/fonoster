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
import * as dgram from "dgram";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as readline from "readline";
import { buildRoomr, FakesHarness, RoomrBinaries } from "@fonoster/conformance";
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import { AppBridge } from "../src/AppBridge";
import { findRoutes, LocationRoute } from "./routr/location";
import { RoomrRouting, provisionRoomrRouting } from "./routr/provision";

// The first real call through Routr into the new stack (add-roomr 2.2 live check, 4.1):
// caller bot → Routr (Trunk by Request-URI host, Number → Peer `roomr`, least-sessions) →
// Go Roomr node (registered with X-Session-Count) → media-control → appbridge → app.
//
// Needs the throwaway Routr rig (mods/appbridge/test/routr/rig.sh up), NATS and Go. Skipped unless
// ROUTR_LIVE=1. See docs/operators/routr-live-test.md.
const LIVE = process.env.ROUTR_LIVE === "1";
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const ROUTR_SIP = process.env.ROUTR_LIVE_SIP ?? "127.0.0.1:15560";
const ROUTR_API = process.env.ROUTR_LIVE_API ?? "127.0.0.1:15551";
const ROUTR_LOCATION = process.env.ROUTR_LIVE_LOCATION ?? "127.0.0.1:15552";
// How Routr (in Docker) reaches this machine: host.docker.internal's IPv4 on Docker for Mac.
const HOST_ADDR = process.env.ROUTR_LIVE_HOST_ADDR ?? "192.168.65.254";
const SECRET = "routr-live-secret";

const ROUTING: RoomrRouting = {
  aor: "sip:roomr@rig.local",
  username: "roomr",
  password: "rig-roomr-pass",
  inboundUri: "trunk.rig.local",
  number: "+17853178070",
  appRef: "app-rig"
};

/**
 * The node's registration with Routr (sip.registrations): the Peer above, with the session count
 * Routr's least-sessions reads. Small loads re-register on the timer (5+ rooms re-register at
 * once), so the expiry is short here.
 */
function nodeConfig(nodeId: string, sipPort: number): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "routr-live-"));
  const file = path.join(dir, "roomr.yaml");
  fs.writeFileSync(
    file,
    [
      `nodeId: ${nodeId}`,
      `nats: { url: "${NATS_URL}" }`,
      "rtp: { host: 127.0.0.1, advertise: 127.0.0.1 }",
      `outboundProxy: "${ROUTR_SIP}"`,
      "sip:",
      `  listen: "0.0.0.0:${sipPort}"`,
      `  advertise: "${HOST_ADDR}"`,
      "  callRefHeader: X-Call-Ref",
      "  registrations:",
      `    - registrar: "${ROUTR_SIP}"`,
      `      aor: "${ROUTING.aor}"`,
      "      expires: 4s",
      `      auth: { username: "${ROUTING.username}", password: "${ROUTING.password}" }`,
      '      headers: { X-Session-Count: "{sessions}" }',
      ""
    ].join("\n")
  );
  return file;
}

async function freeUdpPort(): Promise<number> {
  const s = dgram.createSocket("udp4");
  await new Promise<void>((r) => s.bind(0, "0.0.0.0", r));
  const port = s.address().port;
  await new Promise<void>((r) => s.close(() => r()));
  return port;
}

function start(
  bin: string,
  args: string[],
  ready: RegExp
): Promise<{ child: ChildProcess; line: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    const lines = readline.createInterface({ input: child.stdout! });
    const timer = setTimeout(
      () => reject(new Error(`${bin} not ready`)),
      10000
    );
    lines.on("line", (line) => {
      if (ready.test(line)) {
        clearTimeout(timer);
        resolve({ child, line });
      }
    });
    child.stderr!.on("data", (d) => {
      if (process.env.ROUTR_LIVE_VERBOSE) process.stderr.write(d);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`${bin} exited with ${code}`));
    });
  });
}

async function until<T>(
  what: string,
  check: () => Promise<T | undefined>,
  timeoutMs = 10000
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const v = await check().catch(() => undefined);
    if (v !== undefined) return v;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 200));
  }
}

/** 16-bit little-endian sine at 16 kHz (the fonoster protocol's default audio). */
function tone(ms: number): Buffer {
  const samples = (16000 * ms) / 1000;
  const buf = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    buf.writeInt16LE(
      Math.round(8000 * Math.sin((2 * Math.PI * 440 * i) / 16000)),
      i * 2
    );
  }
  return buf;
}

describe("@appbridge live call through Routr (ROUTR_LIVE=1)", function () {
  this.timeout(60000);
  let nc: NatsConnection;
  let bins: RoomrBinaries | undefined;
  const procs: ChildProcess[] = [];
  let harness: FakesHarness;
  let appbridge: AppBridge;
  let botUrl = "";
  let nodePort = 0;
  let nodeProc: ChildProcess | undefined;

  const bot = async <T = Record<string, unknown>>(
    path: string,
    body?: unknown
  ): Promise<T> => {
    const res = await fetch(`${botUrl}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`caller bot ${path}: ${res.status}`);
    return (await res.json()) as T;
  };

  const nodeRoute = async (): Promise<LocationRoute | undefined> =>
    (await findRoutes(ROUTR_LOCATION, ROUTING.aor)).find(
      (r) => r.advertisedPort === String(nodePort)
    );

  before(async function () {
    this.timeout(180000);
    if (!LIVE || !NATS_URL) return this.skip();
    bins = buildRoomr(NATS_URL);
    if (!bins) return this.skip();
    nc = await connect({ servers: NATS_URL });

    await provisionRoomrRouting(ROUTR_API, ROUTING);

    nodePort = await freeUdpPort();
    const node = await start(
      bins.roomr,
      ["-config", nodeConfig(`routr-live-${Date.now()}`, nodePort)],
      /ready/
    );
    procs.push(node.child);
    nodeProc = node.child;

    const caller = await start(
      bins.sipcaller,
      ["-host", "127.0.0.1", "-sip-advertise", HOST_ADDR],
      /^listening /
    );
    procs.push(caller.child);
    botUrl = `http://${caller.line.split(" ")[1]}`;

    harness = await new FakesHarness().start();
    const urls = harness.providerUrls;
    appbridge = await new AppBridge({
      nats: nc,
      config: {
        nats: { url: NATS_URL },
        apps: [
          {
            ref: ROUTING.appRef,
            url: harness.app.url,
            protocol: "fonoster",
            signingSecret: SECRET,
            speech: { voice: "fake/default", language: "en-US" }
          }
        ],
        providers: {
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          }
        }
      }
    }).start();
  });

  after(async function () {
    await appbridge?.stop();
    await harness?.stop();
    for (const p of procs) p.kill("SIGKILL");
    await nc?.close();
  });

  it("the node registers with Routr and X-Session-Count lands in the route", async function () {
    this.timeout(60000);
    // Routes of nodes killed by earlier runs stay until their Expires runs out (30 s by default);
    // least-sessions could pick one, so wait until ours is the only route.
    const route = await until(
      "the node's route to be the only one in Routr",
      async () => {
        const routes = await findRoutes(ROUTR_LOCATION, ROUTING.aor);
        return routes.length === 1 &&
          routes[0].advertisedPort === String(nodePort)
          ? routes[0]
          : undefined;
      },
      45000
    );
    expect(route.user).to.equal(ROUTING.username);
    expect(route.sessionCount).to.equal(0);
  });

  it("a call to the Number reaches the app with appRef from X-App-Ref, and audio flows both ways", async () => {
    const call = await bot<{ id: string }>("/calls", {
      target: ROUTR_SIP,
      requestHost: ROUTING.inboundUri,
      to: ROUTING.number,
      from: "+15550001111"
    });

    const { peer } = await harness.app.nextConnection(10000);
    const start = await peer.frames.waitUntil(
      () =>
        peer.frames.items.find(
          (f) => f.kind === "json" && f.data.type === "session.start"
        ),
      Date.now() + 5000
    );
    expect(start, "session.start").to.not.equal(undefined);
    const msg = (start as { data: Record<string, unknown> }).data;
    expect(msg.appRef).to.equal(ROUTING.appRef);
    expect(msg.to).to.equal(ROUTING.number);
    expect(msg.direction).to.equal("inbound");

    await until("the caller to be answered", async () => {
      const s = await bot<{ state: string }>(`/calls/${call.id}`);
      return s.state === "answered" ? s : undefined;
    });

    // Caller → app: the bot speaks a tone; the app receives audio frames on track 1.
    const before = peer.frames.items.length;
    await bot(`/calls/${call.id}/audio`, { kind: "tone", ms: 800 });
    const heardBytes = await until("caller audio at the app", async () => {
      const bytes = peer.frames.items
        .slice(before)
        .filter((f) => f.kind === "binary")
        .reduce((n, f) => n + (f.data as Buffer).length - 1, 0);
      return bytes >= 16000 ? bytes : undefined; // ≥ 500 ms of PCM16 16 kHz
    });
    expect(heardBytes).to.be.at.least(16000);

    // App → caller: one second of tone in 20 ms frames; the bot hears it.
    const since = Date.now();
    const audio = tone(1000);
    for (let i = 0; i < audio.length; i += 640) {
      peer.sendBinary(audio.subarray(i, i + 640));
      await new Promise((r) => setTimeout(r, 20));
    }
    const heard = await until("agent audio at the caller", async () => {
      const s = await bot<{ audibleMsSince: number }>(
        `/calls/${call.id}?since=${since}`
      );
      return s.audibleMsSince >= 500 ? s.audibleMsSince : undefined;
    });
    expect(heard).to.be.at.least(500);

    // The node re-registers on load changes: Routr sees one session for least-sessions.
    const busy = await until("X-Session-Count 1 in Routr", async () => {
      const r = await nodeRoute();
      return r && r.sessionCount === 1 ? r : undefined;
    });
    expect(busy.sessionCount).to.equal(1);

    // Caller hangs up: BYE crosses Routr, the app's socket closes, the count returns to 0.
    await bot(`/calls/${call.id}/hangup`, {});
    await until("the app socket to close", async () =>
      peer.frames.closed ? true : undefined
    );
    const idle = await until("X-Session-Count 0 in Routr", async () => {
      const r = await nodeRoute();
      return r && r.sessionCount === 0 ? r : undefined;
    });
    expect(idle.sessionCount).to.equal(0);
  });

  it("a node that exits on SIGTERM drains and removes its route", async () => {
    const exited = new Promise((r) => nodeProc!.once("exit", r));
    nodeProc!.kill("SIGTERM");
    await exited;
    const routes = await findRoutes(ROUTR_LOCATION, ROUTING.aor).catch(
      () => [] as LocationRoute[]
    );
    expect(routes.filter((r) => r.advertisedPort === String(nodePort))).to.be
      .empty;
  });
});
