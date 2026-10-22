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
import { buildRoomr, RoomrBinaries } from "@fonoster/conformance";
import { expect } from "chai";
import { ChildProcess, execFileSync, spawn } from "child_process";
import * as dgram from "dgram";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as readline from "readline";
import * as net from "net";
import { Roomr } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { RtpLink } from "../src/media/RtpLink";
import { SRTP_SUITE } from "../src/media/srtp";

const NATS_URL = process.env.CONFORMANCE_NATS_URL;

// AppBridge leg against the Go node: pion/srtp must accept what RtpLink sends and the other
// way round (SDES-SRTP is optional: a leg that offers srtp gets it, a plain leg stays plain).
// The node's side of an SRTP leg (SDES keys exchanged in the endpoints, as in Answer/Ready on
// the control stream), reached here through Roomr's Join: two RTP participants in one room.
describe("@appbridge SRTP leg against the Go Roomr node", function () {
  this.timeout(30000);
  let bins: RoomrBinaries | undefined;
  let node: ChildProcess | undefined;
  let client: grpc.Client | undefined;
  const nodeId = `srtp-${Date.now()}`;

  before(async function () {
    this.timeout(120000);
    if (!NATS_URL) return this.skip();
    try {
      execFileSync("openssl", ["version"], { stdio: "ignore" });
    } catch {
      return this.skip();
    }
    bins = buildRoomr(NATS_URL);
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
    const control = await new Promise<number>((resolve) => {
      const server = net.createServer();
      server.listen(0, "127.0.0.1", () => {
        const port = (server.address() as net.AddressInfo).port;
        server.close(() => resolve(port));
      });
    });
    const config = path.join(dir, "roomr.yaml");
    fs.writeFileSync(
      config,
      JSON.stringify({
        nodeId,
        nats: { url: NATS_URL },
        sip: { listen: `127.0.0.1:${sip}` },
        rtp: { host: "127.0.0.1", advertise: "127.0.0.1" },
        control: { grpc: { listen: `127.0.0.1:${control}` } },
        tls: {
          listen: `127.0.0.1:${tlsPort}`,
          cert: path.join(dir, "cert.pem"),
          key: path.join(dir, "key.pem")
        }
      })
    );
    node = spawn(bins.roomr, ["-config", config], {
      stdio: ["ignore", "pipe", "pipe"]
    });
    node.stderr!.on("data", () => undefined);
    await new Promise<void>((resolve, reject) => {
      const lines = readline.createInterface({ input: node!.stdout! });
      lines.on("line", (l) => l.includes("ready") && resolve());
      node!.on("exit", (code) => reject(new Error(`roomr exited ${code}`)));
    });
    const Client = Roomr.roomrPackage().Roomr as grpc.ServiceClientConstructor;
    client = new Client(
      `127.0.0.1:${control}`,
      grpc.credentials.createInsecure()
    );
  });

  after(async function () {
    client?.close();
    node?.kill("SIGKILL");
  });

  function rpc<T>(method: string, request: Record<string, unknown>) {
    return new Promise<T>((resolve, reject) =>
      (
        client as unknown as Record<
          string,
          (
            r: unknown,
            o: grpc.CallOptions,
            cb: (e: grpc.ServiceError | null, res: T) => void
          ) => void
        >
      )[method](request, { deadline: Date.now() + 2000 }, (e, res) =>
        e ? reject(e) : resolve(res)
      )
    );
  }

  type Participant = {
    participantRef: string;
    rtp: { ip: string; port: number; srtpKey?: string };
  };

  async function join(roomRef: string, srtp: boolean) {
    const link = new RtpLink();
    if (srtp) link.enableSrtp();
    const offer = await link.bind("127.0.0.1");
    const joined = await rpc<Participant>("Join", {
      roomRef,
      rtp: {
        ip: offer.host,
        port: offer.port,
        codec: offer.codec,
        srtpKey: offer.srtp?.key ?? ""
      }
    });
    return { link, joined };
  }

  /** Points a link at the node's side of its leg (with the node's key on an SRTP leg). */
  const connect = (link: RtpLink, p: Participant) =>
    link.connect({
      host: p.rtp.ip,
      port: p.rtp.port,
      ...(p.rtp.srtpKey
        ? { srtp: { suite: SRTP_SUITE, key: p.rtp.srtpKey } }
        : {})
    });

  it("[ROM-008] carries audio between two SRTP legs (pion interop) and keeps a plain leg plain", async function () {
    const room = (await rpc<{ roomRef: string }>("CreateRoom", {})).roomRef;
    const plain = await join(room, false);
    expect(plain.joined.rtp.srtpKey ?? "").to.equal("");
    plain.link.close();

    const a = await join(room, true);
    const b = await join(room, true);
    expect(a.joined.rtp.srtpKey).to.match(/^[A-Za-z0-9+/=]{40}$/);
    connect(a.link, a.joined);
    connect(b.link, b.joined);

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
