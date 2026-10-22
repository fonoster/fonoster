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
// Scale harness (pass bar T2): N concurrent calls through one or more appbridge processes.
//
//   npx tsx mods/appbridge/scripts/scale.ts --calls 100 --seconds 30 [--replicas 1]
//     [--harness-workers <n>] [--nats nats://127.0.0.1:4222] [--appbridge-node-args "<args>"]
//
// Each appbridge runs as its own process (its own event loop, like a replica); the replicas share
// the calls through the claim on NATS. The fakes (Roomr node, app, providers) run in their own
// worker processes, by default one per 100 calls, so the load generator does not share an event
// loop with the AppBridge replicas or saturate one of its own: each worker has its own Roomr node, app and
// fake providers and offers its share of the calls to its own app. Every call speaks every 3 s.
//
// Reported: dropped frames in both directions, speak → output.started latency, each AppBridge's
// CPU, memory and event-loop delay, and each harness worker's CPU and event-loop delay. When a
// worker's loop lags (p99 over 20 ms) its numbers measure the harness, not AppBridge, and the
// report says so.
//
// --appbridge-node-args passes node flags to the AppBridge replicas, e.g. "--cpu-prof --cpu-prof-dir=/tmp/p".
import { ChildProcess, execFileSync, fork, spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { distribution, FakesHarness } from "@fonoster/conformance";
import { connect } from "nats";
import { stringify } from "yaml";

const args = Object.fromEntries(
  process.argv.slice(2).reduce<[string, string][]>((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1]]);
    return acc;
  }, [])
);
const CALLS = Number(args.calls ?? 20);
const SECONDS = Number(args.seconds ?? 20);
const REPLICAS = Number(args.replicas ?? 1);
const WORKERS = Math.max(
  1,
  Math.min(CALLS, Number(args["harness-workers"] ?? Math.ceil(CALLS / 100)))
);
const NATS_URL = args.nats ?? "nats://127.0.0.1:4222";
/** Replica i serves its session endpoint on this port + i (the fake nodes spread calls over them). */
const SESSION_BASE_PORT = Number(args["session-port"] ?? 50171);
const APPBRIDGE_NODE_ARGS = (args["appbridge-node-args"] ?? "")
  .split(" ")
  .filter(Boolean);
const PROBE = path.join(__dirname, "loop-probe.cjs");
/** Calls are offered one every RAMP_MS across all workers. */
const RAMP_MS = 20;
/** A worker whose loop lags more than this (p99, ms) is measuring itself. */
const HARNESS_LAG_LIMIT_MS = 20;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ProbeSample = {
  at: number;
  p50: number;
  p99: number;
  max: number;
  cpu: number;
};

type Ready = {
  type: "ready";
  appUrl: string;
  tts: string;
  stt: string;
};

type Go = {
  type: "go";
  /** The replicas' session endpoints; calls go round-robin, as a Service would spread them. */
  endpoints: string[];
  start: number;
  measureFrom: number;
  end: number;
};

type Result = {
  type: "result";
  calls: number;
  connected: number;
  inbound: number;
  outbound: number;
  latencies: number[];
};

// ---- worker: one shard of the fakes --------------------------------------------------------

async function worker(index: number) {
  const send = (m: Ready | Result) => process.send!(m);
  const nc = await connect({ servers: NATS_URL });
  const harness = await new FakesHarness().start();

  const inboundFrames: number[] = [];
  const latencies: number[] = [];
  const timers: ReturnType<typeof setInterval>[] = [];
  let measuring = false;

  void (async () => {
    for (;;) {
      const conn = await harness.app
        .nextConnection(120000)
        .catch(() => undefined);
      if (!conn) return;
      const i = inboundFrames.push(0) - 1;
      const pending = new Map<string, number>();
      let seq = 0;
      // Only counts are needed: drop the peer's own frame log, which keeps every audio frame.
      conn.peer.socket.removeAllListeners("message");
      conn.peer.socket.on("message", (raw: Buffer, isBinary: boolean) => {
        if (isBinary) {
          if (measuring) inboundFrames[i]++;
          return;
        }
        const msg = JSON.parse(raw.toString());
        if (msg.type === "output.started" && pending.has(msg.id)) {
          if (measuring) latencies.push(Date.now() - pending.get(msg.id)!);
          pending.delete(msg.id);
        }
      });
      timers.push(
        setInterval(() => {
          const id = `s${++seq}`;
          pending.set(id, Date.now());
          conn.peer.sendJson({
            type: "speak",
            id,
            text: `This is test sentence number ${seq}.`,
            last: true
          });
        }, 3000)
      );
    }
  })();

  const urls = harness.providerUrls;
  send({
    type: "ready",
    appUrl: harness.app.url,
    tts: urls.tts,
    stt: urls.stt
  });

  const go = await new Promise<Go>((resolve) =>
    process.on("message", (m: Go) => m.type === "go" && resolve(m))
  );
  // Global call k belongs to worker k % WORKERS and is offered at start + k * RAMP_MS.
  let calls = 0;
  for (let k = index; k < CALLS; k += WORKERS) {
    await sleep(go.start + k * RAMP_MS - Date.now());
    harness.roomrNode.configure({
      endpoint: go.endpoints[k % go.endpoints.length]
    });
    void harness.roomrNode.offerCall({
      from: `+1555${k}`,
      to: "+15550000000",
      appRef: `load-${index}`
    });
    calls++;
  }
  await sleep(go.measureFrom - Date.now());
  measuring = true;
  await sleep(go.end - Date.now());
  measuring = false;

  const outbound = harness.roomrNode
    .receivedAudio()
    .filter((p) => p.at >= go.measureFrom && p.at < go.end).length;
  send({
    type: "result",
    calls,
    connected: inboundFrames.length,
    inbound: inboundFrames.reduce((a, b) => a + b, 0),
    outbound,
    latencies
  });

  await new Promise((r) => process.once("message", r));
  for (const t of timers) clearInterval(t);
  await harness.stop().catch(() => undefined);
  await nc.close();
  process.exit(0);
}

// ---- coordinator ---------------------------------------------------------------------------

function readProbe(file: string, from: number, to: number) {
  const samples: ProbeSample[] = fs.existsSync(file)
    ? fs
        .readFileSync(file, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l) as ProbeSample)
        .filter((s) => s.at > from && s.at <= to)
    : [];
  if (!samples.length) return null;
  return {
    cpuPercent: distribution(samples.map((s) => s.cpu)),
    // Per-second p50 and p99 lag, each as its median over the window, and the worst stall.
    eventLoopDelayMs: {
      p50: distribution(samples.map((s) => s.p50)).p50,
      p99: distribution(samples.map((s) => s.p99)).p50,
      max: Math.max(...samples.map((s) => s.max))
    }
  };
}

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "appbridge-scale-"));
  const probeFile = (name: string) => path.join(dir, `probe-${name}.jsonl`);

  const workers = Array.from({ length: WORKERS }, (_, i) =>
    fork(__filename, ["--worker", String(i), ...process.argv.slice(2)], {
      execArgv: [...process.execArgv, "--require", PROBE],
      env: { ...process.env, SCALE_PROBE_FILE: probeFile(`harness-${i}`) },
      stdio: ["ignore", "ignore", "inherit", "ipc"]
    })
  );
  const next = <T extends { type: string }>(w: ChildProcess, type: string) =>
    new Promise<T>((resolve, reject) => {
      const onMessage = (m: T) => {
        if (m.type !== type) return;
        w.off("message", onMessage);
        resolve(m);
      };
      w.on("message", onMessage);
      w.once("exit", (code) =>
        reject(new Error(`harness worker exited (${code})`))
      );
    });
  const ready = await Promise.all(workers.map((w) => next<Ready>(w, "ready")));

  const endpoints = Array.from(
    { length: REPLICAS },
    (_, i) => `127.0.0.1:${SESSION_BASE_PORT + i}`
  );
  const configFile = (i: number) => path.join(dir, `appbridge-${i}.yaml`);
  const config = (i: number) =>
    stringify({
      nats: { url: NATS_URL },
      session: { listen: endpoints[i] },
      apps: ready.map((r, i) => ({
        ref: `load-${i}`,
        url: r.appUrl,
        protocol: "fonoster",
        signingSecret: "s",
        speech: {
          voice: `fake${i}/default`,
          sttModel: `fake${i}/default`,
          language: "en-US"
        }
      })),
      providers: Object.fromEntries(
        ready.map((r, i) => [
          `fake${i}`,
          {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            tts: { url: r.tts },
            stt: { url: r.stt }
          }
        ])
      )
    });
  for (let i = 0; i < REPLICAS; i++) fs.writeFileSync(configFile(i), config(i));
  const appbridges: ChildProcess[] = Array.from({ length: REPLICAS }, (_, i) =>
    spawn(
      process.execPath,
      [
        "--require",
        PROBE,
        ...APPBRIDGE_NODE_ARGS,
        path.join(__dirname, "..", "dist", "main.js"),
        configFile(i)
      ],
      {
        env: {
          ...process.env,
          LOGS_LEVEL: "error",
          SCALE_PROBE_FILE: probeFile(`appbridge-${i}`)
        },
        stdio: "ignore"
      }
    )
  );
  await sleep(1500);

  const start = Date.now() + 200;
  const rampedAt = start + CALLS * RAMP_MS;
  const measureFrom = rampedAt + 2000;
  const end = rampedAt + SECONDS * 1000;
  const go: Go = { type: "go", endpoints, start, measureFrom, end };
  const results = workers.map((w) => next<Result>(w, "result"));
  for (const w of workers) w.send(go);

  // Per replica: CPU % and RSS MB samples (ps), alongside the in-process probe.
  const cpu: number[][] = appbridges.map(() => []);
  const rss: number[][] = appbridges.map(() => []);
  while (Date.now() < end) {
    await sleep(1000);
    if (Date.now() < measureFrom) continue;
    for (const [i, appbridge] of appbridges.entries()) {
      const out = execFileSync("ps", [
        "-o",
        "%cpu=,rss=",
        "-p",
        String(appbridge.pid)
      ])
        .toString()
        .trim()
        .split(/\s+/);
      cpu[i].push(Number(out[0]));
      rss[i].push(Math.round(Number(out[1]) / 1024));
    }
  }
  const shards = await Promise.all(results);
  await sleep(1100); // the probes' last sample of the window
  const measuredSeconds = (end - measureFrom) / 1000;

  const connected = shards.reduce((a, s) => a + s.connected, 0);
  const outbound = shards.reduce((a, s) => a + s.outbound, 0);
  const inbound = shards.reduce((a, s) => a + s.inbound, 0);
  const latencies = shards.flatMap((s) => s.latencies);
  // Each connected call carries 50 frames a second in each direction.
  const expected = Math.round(connected * measuredSeconds * 50);
  const harness = workers.map((_, i) =>
    readProbe(probeFile(`harness-${i}`), measureFrom, end + 1000)
  );
  const harnessLagged = harness.some(
    (h) => !h || h.eventLoopDelayMs.p99 > HARNESS_LAG_LIMIT_MS
  );

  const report = {
    calls: CALLS,
    replicas: REPLICAS,
    harnessWorkers: WORKERS,
    connected,
    rampSeconds: (rampedAt - start) / 1000,
    measuredSeconds,
    outboundRtp: {
      received: outbound,
      expected,
      ratio: +(outbound / expected).toFixed(4)
    },
    inboundToApp: {
      received: inbound,
      expected,
      ratio: +(inbound / expected).toFixed(4)
    },
    speakToStartedMs: latencies.length ? distribution(latencies) : null,
    appBridgeCpuPercent: cpu.map((samples) => distribution(samples)),
    appBridgeRssMb: rss.map((samples) => distribution(samples)),
    appBridgeEventLoopDelayMs: appbridges.map(
      (_, i) =>
        readProbe(probeFile(`appbridge-${i}`), measureFrom, end + 1000)
          ?.eventLoopDelayMs ?? null
    ),
    harness,
    ...(harnessLagged
      ? {
          warning: `a harness worker's event loop lagged (p99 > ${HARNESS_LAG_LIMIT_MS} ms): raise --harness-workers`
        }
      : {}),
    host: `${os.cpus()[0].model} x${os.cpus().length}, node ${process.version}`
  };
  console.log(JSON.stringify(report, null, 2));

  for (const w of workers) w.send({ type: "stop" });
  for (const appbridge of appbridges) appbridge.kill("SIGTERM");
  await Promise.all(
    [...workers, ...appbridges].map(
      (p) =>
        new Promise((r) =>
          p.exitCode !== null ? r(undefined) : p.once("exit", r)
        )
    )
  );
  fs.rmSync(dir, { recursive: true, force: true });
  process.exit(0);
}

const role = process.argv.indexOf("--worker");
(role >= 0 ? worker(Number(process.argv[role + 1])) : main()).catch((e) => {
  console.error(e);
  process.exit(1);
});
