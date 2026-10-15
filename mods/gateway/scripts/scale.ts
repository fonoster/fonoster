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
// Scale harness (pass bar T2): N concurrent calls through one gateway process.
//
//   npx tsx mods/gateway/scripts/scale.ts --calls 100 --seconds 30 [--nats nats://127.0.0.1:4222]
//
// The gateway runs as its own process (its own event loop, like a replica); the fake media node,
// fake app and fake providers run here. Every call speaks every 3 s. Reported: dropped frames in
// both directions, speak → output.started latency, and the gateway's CPU and memory.
import { ChildProcess, execFileSync, spawn } from "child_process";
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
const NATS_URL = args.nats ?? "nats://127.0.0.1:4222";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const nc = await connect({ servers: NATS_URL });
  const harness = await new FakesHarness().start();
  const nodeId = `scale-${Date.now()}`;
  harness.mediaNode.configure({});
  (harness.mediaNode as unknown as { nodeId: string }).nodeId = nodeId;
  harness.mediaNode.attachNats(nc, {
    commands: `media.${nodeId}.commands`,
    events: `media.${nodeId}.events`
  });

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gateway-scale-"));
  const configFile = path.join(dir, "gateway.yaml");
  const urls = harness.providerUrls;
  fs.writeFileSync(
    configFile,
    stringify({
      nats: { url: NATS_URL },
      testMode: true,
      apps: [
        {
          ref: "load",
          url: harness.app.url,
          flavor: "native",
          signingSecret: "s",
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
    })
  );
  const gateway: ChildProcess = spawn(
    process.execPath,
    [path.join(__dirname, "..", "dist", "main.js"), configFile],
    {
      env: { ...process.env, LOGS_LEVEL: "error" },
      stdio: "ignore"
    }
  );
  await sleep(1500);

  // Per-call app behaviour and measurements.
  const inboundFrames: number[] = [];
  const latencies: number[] = [];
  const sessions: { close: () => void }[] = [];
  let connected = 0;

  void (async () => {
    for (;;) {
      const conn = await harness.app
        .nextConnection(60000)
        .catch(() => undefined);
      if (!conn) return;
      connected++;
      const index = inboundFrames.push(0) - 1;
      const pending = new Map<string, number>();
      let seq = 0;
      conn.peer.socket.on("message", (raw: Buffer, isBinary: boolean) => {
        if (isBinary) {
          inboundFrames[index]++;
          return;
        }
        const msg = JSON.parse(raw.toString());
        if (msg.type === "output.started" && pending.has(msg.id)) {
          latencies.push(Date.now() - pending.get(msg.id)!);
          pending.delete(msg.id);
        }
      });
      const timer = setInterval(() => {
        const id = `s${++seq}`;
        pending.set(id, Date.now());
        conn.peer.sendJson({
          type: "speak",
          id,
          text: `This is test sentence number ${seq}.`,
          last: true
        });
      }, 3000);
      sessions.push({ close: () => clearInterval(timer) });
    }
  })();

  const start = Date.now();
  for (let i = 0; i < CALLS; i++) {
    harness.mediaNode.offerCall({ from: `+1555${i}`, to: "+15550000000" });
    await sleep(20);
  }
  const rampedAt = Date.now();

  const cpu: number[] = [];
  const rss: number[] = [];
  const end = rampedAt + SECONDS * 1000;
  const measureFrom = rampedAt + 2000;
  for (const i of inboundFrames.keys()) inboundFrames[i] = 0;
  let measuring = false;
  while (Date.now() < end) {
    await sleep(1000);
    if (!measuring && Date.now() >= measureFrom) {
      for (const i of inboundFrames.keys()) inboundFrames[i] = 0;
      latencies.length = 0;
      measuring = true;
    }
    const out = execFileSync("ps", [
      "-o",
      "%cpu=,rss=",
      "-p",
      String(gateway.pid)
    ])
      .toString()
      .trim()
      .split(/\s+/);
    cpu.push(Number(out[0]));
    rss.push(Math.round(Number(out[1]) / 1024));
  }
  const measuredSeconds = (Date.now() - measureFrom) / 1000;

  // Outbound (gateway → node): RTP packets per session participant in the measured window.
  const packets = harness.mediaNode
    .receivedAudio()
    .filter((p) => p.at >= measureFrom);
  const expectedOutbound = connected * measuredSeconds * 50;
  const expectedInbound = connected * measuredSeconds * 50;
  const inbound = inboundFrames.reduce((a, b) => a + b, 0);

  const report = {
    calls: CALLS,
    connected,
    rampSeconds: (rampedAt - start) / 1000,
    measuredSeconds: Math.round(measuredSeconds),
    outboundRtp: {
      received: packets.length,
      expected: Math.round(expectedOutbound),
      ratio: +(packets.length / expectedOutbound).toFixed(4)
    },
    inboundToApp: {
      received: inbound,
      expected: Math.round(expectedInbound),
      ratio: +(inbound / expectedInbound).toFixed(4)
    },
    speakToStartedMs: latencies.length ? distribution(latencies) : null,
    gatewayCpuPercent: distribution(cpu),
    gatewayRssMb: distribution(rss),
    host: `${os.cpus()[0].model} x${os.cpus().length}, node ${process.version}`
  };
  console.log(JSON.stringify(report, null, 2));

  for (const s of sessions) s.close();
  gateway.kill("SIGTERM");
  await harness.stop();
  await nc.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
