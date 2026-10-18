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
import { buildMediaNode, MediaNodeBinaries } from "@fonoster/conformance";
import { expect } from "chai";
import { ChildProcess, execFileSync, spawn } from "child_process";
import * as dgram from "dgram";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as readline from "readline";
import { connect, NatsConnection } from "nats";
import { RtpLink } from "../src/media/RtpLink";
import { newSrtpKey, SrtpContext } from "../src/media/srtp";

const NATS_URL = process.env.CONFORMANCE_NATS_URL;

function rtpPacket(seq: number, payload: Buffer, ssrc = 0x1234): Buffer {
  const header = Buffer.alloc(12);
  header[0] = 0x80;
  header[1] = 96;
  header.writeUInt16BE(seq & 0xffff, 2);
  header.writeUInt32BE(seq * 320, 4);
  header.writeUInt32BE(ssrc, 8);
  return Buffer.concat([header, payload]);
}

describe("@gateway SRTP (AES_CM_128_HMAC_SHA1_80)", function () {
  it("round-trips packets, across a sequence number wrap", function () {
    const key = newSrtpKey();
    const tx = new SrtpContext(key);
    const rx = new SrtpContext(key);
    for (const seq of [65533, 65534, 65535, 0, 1, 2]) {
      const plain = rtpPacket(seq, Buffer.from(`frame ${seq}`));
      const secret = tx.protect(plain);
      expect(secret.length).to.equal(plain.length + 10);
      expect(secret.subarray(12, plain.length)).to.not.deep.equal(
        plain.subarray(12)
      );
      expect(rx.unprotect(secret)).to.deep.equal(plain);
    }
  });

  it("drops plain, tampered and wrongly keyed packets", function () {
    const key = newSrtpKey();
    const rx = new SrtpContext(key);
    const plain = rtpPacket(7, Buffer.alloc(40, 1));
    expect(rx.unprotect(plain)).to.equal(undefined);
    const secret = new SrtpContext(key).protect(plain);
    secret[20] ^= 1;
    expect(rx.unprotect(secret)).to.equal(undefined);
    expect(rx.unprotect(new SrtpContext(newSrtpKey()).protect(plain))).to.equal(
      undefined
    );
  });
});

// The gateway leg against the Go node with -require-encryption: the node's pion/srtp must accept
// what RtpLink sends and the other way round (media-control "Encrypted deployment uses SRTP").
describe("@gateway SRTP leg against the Go media node", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let bins: MediaNodeBinaries | undefined;
  let node: ChildProcess | undefined;
  const nodeId = `srtp-${Date.now()}`;

  before(async function () {
    this.timeout(120000);
    if (!NATS_URL) return this.skip();
    try {
      execFileSync("openssl", ["version"], { stdio: "ignore" });
    } catch {
      return this.skip();
    }
    bins = buildMediaNode(NATS_URL);
    if (!bins) return this.skip();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "srtp-node-"));
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-days",
        "1",
        "-subj",
        "/CN=127.0.0.1",
        "-keyout",
        path.join(dir, "key.pem"),
        "-out",
        path.join(dir, "cert.pem")
      ],
      { stdio: "ignore" }
    );
    const free = async () => {
      const s = dgram.createSocket("udp4");
      await new Promise<void>((r) => s.bind(0, "127.0.0.1", r));
      const port = s.address().port;
      await new Promise<void>((r) => s.close(() => r()));
      return port;
    };
    const sip = await free();
    const tlsPort = await free();
    node = spawn(
      bins.medianode,
      [
        "-node-id",
        nodeId,
        "-nats",
        NATS_URL,
        "-sip",
        `127.0.0.1:${sip}`,
        "-rtp",
        "127.0.0.1",
        "-rtp-advertise",
        "127.0.0.1",
        "-require-encryption",
        "-tls",
        `127.0.0.1:${tlsPort}`,
        "-tls-cert",
        path.join(dir, "cert.pem"),
        "-tls-key",
        path.join(dir, "key.pem")
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    node.stderr!.on("data", () => undefined);
    await new Promise<void>((resolve, reject) => {
      const lines = readline.createInterface({ input: node!.stdout! });
      lines.on("line", (l) => l.includes("ready") && resolve());
      node!.on("exit", (code) => reject(new Error(`medianode exited ${code}`)));
    });
    nc = await connect({ servers: NATS_URL });
  });

  after(async function () {
    node?.kill("SIGKILL");
    await nc?.close();
  });

  async function command(cmd: Record<string, unknown>) {
    const msg = await nc.request(
      `media.${nodeId}.commands`,
      Buffer.from(JSON.stringify(cmd)),
      { timeout: 2000 }
    );
    return JSON.parse(Buffer.from(msg.data).toString()) as Record<
      string,
      unknown
    >;
  }

  async function join(roomRef: string, srtp: boolean) {
    const link = new RtpLink();
    if (srtp) link.enableSrtp();
    const offer = await link.bind("127.0.0.1");
    const ack = await command({
      type: "participant.add",
      id: `p-${Math.random()}`,
      roomRef,
      kind: "session",
      rtp: offer
    });
    return { link, ack };
  }

  it("refuses a plain gateway leg and carries audio between two SRTP legs (pion interop)", async function () {
    const room = (await command({ type: "room.create", id: "c1" }))
      .roomRef as string;
    const plain = await join(room, false);
    expect(plain.ack.code).to.equal("encryption_required");
    plain.link.close();

    const a = await join(room, true);
    const b = await join(room, true);
    expect(a.ack.type).to.equal("ack");
    const block = a.ack.rtp as { srtp?: { suite: string; key: string } };
    expect(block.srtp?.suite).to.equal("AES_CM_128_HMAC_SHA1_80");
    a.link.connect(a.ack.rtp as never);
    b.link.connect(b.ack.rtp as never);

    let loud = 0;
    b.link.on("frame", (f: Buffer) => {
      let sum = 0;
      for (let i = 0; i < f.length; i += 2) sum += f.readInt16LE(i) ** 2;
      if (Math.sqrt(sum / (f.length / 2)) > 300) loud++;
    });
    const tone = Buffer.alloc(640);
    for (let i = 0; i < 320; i++) {
      tone.writeInt16LE(
        Math.round(6000 * Math.sin((2 * Math.PI * 600 * i) / 16000)),
        i * 2
      );
    }
    for (let i = 0; i < 25; i++) {
      a.link.send(tone);
      await new Promise((r) => setTimeout(r, 20));
    }
    await new Promise((r) => setTimeout(r, 150));
    a.link.close();
    b.link.close();
    expect(loud).to.be.greaterThan(15);
  });
});
