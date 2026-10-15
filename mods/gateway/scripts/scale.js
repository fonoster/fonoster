"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
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
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const nats_1 = require("nats");
const yaml_1 = require("yaml");
const conformance_1 = require("@fonoster/conformance");
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--"))
        acc.push([a.slice(2), all[i + 1]]);
    return acc;
}, []));
const CALLS = Number((_a = args.calls) !== null && _a !== void 0 ? _a : 20);
const SECONDS = Number((_b = args.seconds) !== null && _b !== void 0 ? _b : 20);
const NATS_URL = (_c = args.nats) !== null && _c !== void 0 ? _c : "nats://127.0.0.1:4222";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const nc = yield (0, nats_1.connect)({ servers: NATS_URL });
        const harness = yield new conformance_1.FakesHarness().start();
        const nodeId = `scale-${Date.now()}`;
        harness.mediaNode.configure({});
        harness.mediaNode.nodeId = nodeId;
        harness.mediaNode.attachNats(nc, { commands: `media.${nodeId}.commands`, events: `media.${nodeId}.events` });
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gateway-scale-"));
        const configFile = path.join(dir, "gateway.yaml");
        const urls = harness.providerUrls;
        fs.writeFileSync(configFile, (0, yaml_1.stringify)({
            nats: { url: NATS_URL },
            testMode: true,
            apps: [{ ref: "load", url: harness.app.url, flavor: "native", signingSecret: "s", speech: { voice: "fake/default", language: "en-US" } }],
            providers: { fake: { adapter: "fake", capabilities: ["tts", "stt"], tts: { url: urls.tts }, stt: { url: urls.stt } } }
        }));
        const gateway = (0, child_process_1.spawn)(process.execPath, [path.join(__dirname, "..", "dist", "main.js"), configFile], {
            env: Object.assign(Object.assign({}, process.env), { LOGS_LEVEL: "error" }),
            stdio: "ignore"
        });
        yield sleep(1500);
        // Per-call app behaviour and measurements.
        const inboundFrames = [];
        const latencies = [];
        const sessions = [];
        let connected = 0;
        void (() => __awaiter(this, void 0, void 0, function* () {
            for (;;) {
                const conn = yield harness.app.nextConnection(60000).catch(() => undefined);
                if (!conn)
                    return;
                connected++;
                const index = inboundFrames.push(0) - 1;
                const pending = new Map();
                let seq = 0;
                conn.peer.socket.on("message", (raw, isBinary) => {
                    if (isBinary) {
                        inboundFrames[index]++;
                        return;
                    }
                    const msg = JSON.parse(raw.toString());
                    if (msg.type === "output.started" && pending.has(msg.id)) {
                        latencies.push(Date.now() - pending.get(msg.id));
                        pending.delete(msg.id);
                    }
                });
                const timer = setInterval(() => {
                    const id = `s${++seq}`;
                    pending.set(id, Date.now());
                    conn.peer.sendJson({ type: "speak", id, text: `This is test sentence number ${seq}.`, last: true });
                }, 3000);
                sessions.push({ close: () => clearInterval(timer) });
            }
        }))();
        const start = Date.now();
        for (let i = 0; i < CALLS; i++) {
            harness.mediaNode.offerCall({ from: `+1555${i}`, to: "+15550000000" });
            yield sleep(20);
        }
        const rampedAt = Date.now();
        const cpu = [];
        const rss = [];
        const end = rampedAt + SECONDS * 1000;
        const measureFrom = rampedAt + 2000;
        for (const i of inboundFrames.keys())
            inboundFrames[i] = 0;
        let measuring = false;
        while (Date.now() < end) {
            yield sleep(1000);
            if (!measuring && Date.now() >= measureFrom) {
                for (const i of inboundFrames.keys())
                    inboundFrames[i] = 0;
                latencies.length = 0;
                measuring = true;
            }
            const out = (0, child_process_1.execFileSync)("ps", ["-o", "%cpu=,rss=", "-p", String(gateway.pid)]).toString().trim().split(/\s+/);
            cpu.push(Number(out[0]));
            rss.push(Math.round(Number(out[1]) / 1024));
        }
        const measuredSeconds = (Date.now() - measureFrom) / 1000;
        // Outbound (gateway → node): RTP packets per session participant in the measured window.
        const packets = harness.mediaNode.receivedAudio().filter((p) => p.at >= measureFrom);
        const expectedOutbound = connected * measuredSeconds * 50;
        const expectedInbound = connected * measuredSeconds * 50;
        const inbound = inboundFrames.reduce((a, b) => a + b, 0);
        const report = {
            calls: CALLS,
            connected,
            rampSeconds: (rampedAt - start) / 1000,
            measuredSeconds: Math.round(measuredSeconds),
            outboundRtp: { received: packets.length, expected: Math.round(expectedOutbound), ratio: +(packets.length / expectedOutbound).toFixed(4) },
            inboundToApp: { received: inbound, expected: Math.round(expectedInbound), ratio: +(inbound / expectedInbound).toFixed(4) },
            speakToStartedMs: latencies.length ? (0, conformance_1.distribution)(latencies) : null,
            gatewayCpuPercent: (0, conformance_1.distribution)(cpu),
            gatewayRssMb: (0, conformance_1.distribution)(rss),
            host: `${os.cpus()[0].model} x${os.cpus().length}, node ${process.version}`
        };
        console.log(JSON.stringify(report, null, 2));
        for (const s of sessions)
            s.close();
        gateway.kill("SIGTERM");
        yield harness.stop();
        yield nc.close();
        process.exit(0);
    });
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
