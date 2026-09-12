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
import { readFileSync } from "fs";
import * as net from "net";
import { join } from "path";
import { expect } from "chai";
import { v4 as uuidv4 } from "uuid";
// Must be the first local import: esbuild (via tsx) hoists `import`
// statements above other top-level code within a file, so setting
// process.env directly in this file — after its own imports, in source
// order — would run too late for ../src/envs.ts to see the overrides.
// Imports across files still execute in the order they're imported, so this
// module's top-level side effect (setting process.env) runs before the
// modules under test load theirs.
import {
  AGI_PORT,
  AUDIOSOCKET_PORT,
  FRAME_BYTES,
  PROBE_MS,
  TIMEOUT_MS
} from "./setAmdTestEnv";

/* eslint-disable import/order */
import { startAgiServer } from "../src/agi/server";
import { startAudioSocketServer } from "../src/audiosocket/server";
import { classifyPcm } from "../src/amd/AmdModel";
import { buildAmdVariables } from "../src/amd/buildAmdVariables";
/* eslint-enable import/order */

const MIN_CONFIDENCE = 0; // matches setAmdTestEnv's AMD_MIN_CONFIDENCE

const FIXTURE_PCM = readFileSync(
  join(__dirname, "amd", "fixtures", "fixture.pcm")
);

// The probe stops as soon as it has collected exactly this many bytes (see
// PROBE_MS above), so this is the exact prefix amd will classify.
const BYTES_NEEDED = Math.ceil((PROBE_MS / 1000) * 16000 * 2);

// --- Minimal AudioSocket protocol bytes, hand-rolled to avoid depending on
// @fonoster/streams' internal (unexported) Message class. Mirrors the wire
// format read by mods/streams/src/Message.ts. ---
function idMessage(uuid: string): Buffer {
  const payload = Buffer.from(uuid.replace(/-/g, ""), "hex");
  const header = Buffer.alloc(3);
  header[0] = 0x01; // MessageType.ID
  header.writeUInt16BE(payload.length, 1);
  return Buffer.concat([header, payload]);
}

function slinMessage(payload: Buffer): Buffer {
  const header = Buffer.alloc(3);
  header[0] = 0x10; // MessageType.SLIN
  header.writeUInt16BE(payload.length, 1);
  return Buffer.concat([header, payload]);
}

/** Plays the Asterisk side of the AudioSocket leg: connects, sends the ID
 * message, then streams the fixture PCM frame-by-frame (one `write()` per
 * 20 ms frame, spaced out) so each frame reliably lands as its own TCP
 * "data" event on the receiving end — a single multi-KB write can otherwise
 * be split across reads and mis-parsed as more than one AudioSocket message,
 * which is a real fragility of the protocol handling this test works around
 * rather than exercises. Resolves once amd hangs up. */
function playAudioSocketLeg(host: string, port: number, uuid: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ port, host });
    let offset = 0;
    let sendTimer: NodeJS.Timeout;

    socket.on("connect", () => {
      socket.write(idMessage(uuid));
      sendTimer = setInterval(() => {
        if (socket.destroyed || offset >= FIXTURE_PCM.length) {
          clearInterval(sendTimer);
          return;
        }
        socket.write(slinMessage(FIXTURE_PCM.subarray(offset, offset + FRAME_BYTES)));
        offset += FRAME_BYTES;
      }, 5);
    });

    socket.on("close", () => {
      clearInterval(sendTimer);
      resolve();
    });
    socket.on("error", (err) => {
      clearInterval(sendTimer);
      reject(err);
    });
    // A socket with no "data" listener stays in paused mode, which can defer
    // "end"/"close" indefinitely once amd sends its HANGUP message
    // and half-closes — draining reads (even without using the payload) is
    // what lets the close sequence complete.
    socket.on("data", () => undefined);
  });
}

/** Plays the Asterisk side of one AGI session: sends the header block
 * (embedding `mode` as `agi_arg_1`, exactly like `AGI(agi://...,${AMD_MODE})`
 * in the dialplan would), then answers whatever EXEC/SET VARIABLE commands
 * the server issues, recording every AMD variable it's told to set. Resolves
 * once amd closes the connection (see AgiChannel.close()) — the same
 * signal that tells a real Asterisk AGI() app to resume the dialplan.
 *
 * `stuckExec: true` simulates an unreachable/stalled AudioSocket leg: the
 * client still receives "EXEC AudioSocket ...", but never connects to it and
 * never sends back a "200 result=..." acknowledgement — exactly the
 * condition that used to hang the AGI session forever (see
 * src/agi/server.ts's `work`/`timeout` race). */
function connectFakeAgiClient(
  mode?: string,
  options: { stuckExec?: boolean } = {}
): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ port: AGI_PORT, host: "127.0.0.1" });
    const seen: Record<string, string> = {};
    let buffer = "";

    socket.on("connect", () => {
      const headers = [
        "agi_network: yes",
        `agi_uniqueid: ${Date.now()}.1`,
        "agi_channel: Local/integration-test-00000001;1",
        "agi_language: en",
        "agi_type: Local",
        "agi_callerid: unknown",
        "agi_calleridname: unknown",
        "agi_context: smoke-test",
        "agi_extension: 7000",
        "agi_priority: 1",
        ...(mode !== undefined ? [`agi_arg_1: ${mode}`] : []),
        "",
        ""
      ].join("\n");
      socket.write(headers);
    });

    socket.on("data", (data) => {
      buffer += data.toString();
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) handleCommand(line);
        newline = buffer.indexOf("\n");
      }
    });

    socket.on("close", () => resolve(seen));
    socket.on("error", reject);
    // Drain reads so "close" fires once amd ends the connection —
    // same paused-socket gotcha as playAudioSocketLeg above.
    socket.on("data", () => undefined);

    function handleCommand(line: string) {
      const setVarMatch = line.match(/^SET VARIABLE (\S+) "?([^"]*)"?$/);
      if (setVarMatch) {
        seen[setVarMatch[1]] = setVarMatch[2];
        socket.write("200 result=1\n");
        return;
      }

      if (line.startsWith("EXEC AudioSocket")) {
        if (options.stuckExec) return; // never ack — simulate a stuck EXEC
        const args = line.replace("EXEC AudioSocket ", "");
        const [uuid, hostPort] = args.split(",");
        const [host, portStr] = hostPort.split(":");
        void playAudioSocketLeg(host, Number(portStr), uuid).finally(() => {
          socket.write("200 result=1\n");
        });
        return;
      }

      // Anything else this test doesn't expect: ack it so the session
      // doesn't stall.
      socket.write("200 result=1\n");
    }
  });
}

describe("@amd/agi+audiosocket integration", function () {
  let audioSocket: ReturnType<typeof startAudioSocketServer>;
  let agiServer: ReturnType<typeof startAgiServer>;

  before(function (done) {
    audioSocket = startAudioSocketServer();
    agiServer = startAgiServer();
    // Both listeners bind synchronously-ish but asynchronously signal
    // "ready" with no handle exposed to await here; a short delay is
    // simpler than plumbing that through just for this test.
    setTimeout(done, 100);
  });

  after(function () {
    audioSocket.close();
    agiServer.close();
  });

  it("defaults to compact, native-AMD-compatible variables when no mode arg is passed", async function () {
    this.timeout(30000);

    const seen = await connectFakeAgiClient(undefined);

    const direct = buildAmdVariables(
      { kind: "classified", ...(await classifyPcm(FIXTURE_PCM.subarray(0, BYTES_NEEDED))), latencyMs: 0 },
      "compact",
      MIN_CONFIDENCE
    );

    expect(seen).to.deep.equal(direct);
    expect(Object.keys(seen).sort()).to.deep.equal(["AMDCAUSE", "AMDSTATUS"]);
    expect(["HUMAN", "MACHINE", "NOTSURE"]).to.include(seen.AMDSTATUS);
  });

  it('reports the full variable range when the AGI arg is "full"', async function () {
    this.timeout(30000);

    const seen = await connectFakeAgiClient("full");

    const classification = await classifyPcm(FIXTURE_PCM.subarray(0, BYTES_NEEDED));
    const direct = buildAmdVariables(
      { kind: "classified", ...classification, latencyMs: 0 },
      "full",
      MIN_CONFIDENCE
    );

    expect(seen.AMDSTATUS).to.equal(direct.AMDSTATUS);
    expect(seen.AMDCAUSE).to.equal(direct.AMDCAUSE);
    expect(seen.AMDCONFIDENCE).to.equal(direct.AMDCONFIDENCE);
    expect(seen.AMDDETECTOR).to.equal(direct.AMDDETECTOR);
    expect(Object.keys(seen).sort()).to.deep.equal(
      ["AMDCAUSE", "AMDCONFIDENCE", "AMDDETECTOR", "AMDLATENCYMS", "AMDSTATUS"]
    );
    expect(Number(seen.AMDLATENCYMS)).to.be.a("number").and.be.at.least(0);
    expect(["HUMAN", "MACHINE", "VOICEMAIL", "IVR", "UNKNOWN"]).to.include(
      seen.AMDSTATUS
    );
  });

  it('anything other than the literal "full" falls back to compact (e.g. a typo)', async function () {
    this.timeout(30000);

    const seen = await connectFakeAgiClient("Full"); // wrong case on purpose

    expect(Object.keys(seen).sort()).to.deep.equal(["AMDCAUSE", "AMDSTATUS"]);
  });

  it("closes the session within the deadline instead of hanging when EXEC AudioSocket is never acknowledged", async function () {
    this.timeout(TIMEOUT_MS + 10000);

    const startedAt = Date.now();
    await connectFakeAgiClient(undefined, { stuckExec: true });
    const elapsedMs = Date.now() - startedAt;

    // The key regression check: the session must not hang forever (it used
    // to, since the deadline only raced the post-EXEC wait, not EXEC itself).
    // Generous upper bound since this is timing-sensitive under CI load.
    expect(elapsedMs).to.be.lessThan(TIMEOUT_MS + 5000);
    expect(elapsedMs).to.be.at.least(TIMEOUT_MS - 100);
  });
});
