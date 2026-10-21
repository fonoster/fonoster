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
import * as net from "net";
import { URL } from "url";

// NATS fault injection (redesign-roomr 11.11): a TCP proxy between a Roomr node and NATS. The
// node connects to the proxy; the suite can drop the connection (every client socket is cut and
// new ones are refused until `restore`) or drop messages (the node's PUB and HPUB operations on
// matching subjects are discarded while the rest of the protocol, PING and PONG included, flows,
// so the client never notices). Observers connect to NATS directly and see what got through.

type Link = { client: net.Socket; server: net.Socket; filter: PubFilter };

/** Parses the client-to-server NATS protocol and drops publishes while told to. */
class PubFilter {
  private buf = Buffer.alloc(0);
  /** Bytes of a dropped message's payload (and its CRLF) still to skip. */
  private skip = 0;
  /** Bytes of a kept message's payload (and its CRLF) still to pass. */
  private pass = 0;

  constructor(private readonly dropping: (subject: string) => boolean) {}

  push(chunk: Buffer): Buffer {
    this.buf = Buffer.concat([this.buf, chunk]);
    const out: Buffer[] = [];
    for (;;) {
      if (this.pass > 0) {
        const n = Math.min(this.pass, this.buf.length);
        out.push(this.buf.subarray(0, n));
        this.buf = this.buf.subarray(n);
        this.pass -= n;
        if (this.pass > 0) break;
        continue;
      }
      if (this.skip > 0) {
        const n = Math.min(this.skip, this.buf.length);
        this.buf = this.buf.subarray(n);
        this.skip -= n;
        if (this.skip > 0) break;
        continue;
      }
      const eol = this.buf.indexOf("\r\n");
      if (eol < 0) break;
      const line = this.buf.subarray(0, eol + 2);
      this.buf = this.buf.subarray(eol + 2);
      const words = line.toString("latin1").trim().split(/\s+/);
      const op = words[0]?.toUpperCase();
      if (op === "PUB" || op === "HPUB") {
        // PUB <subject> [reply] <bytes>; HPUB <subject> [reply] <header bytes> <total bytes>
        const size = Number(words[words.length - 1]) + 2;
        if (this.dropping(words[1] ?? "")) {
          this.skip = size;
          continue;
        }
        out.push(line);
        this.pass = size;
        continue;
      }
      out.push(line);
    }
    return Buffer.concat(out);
  }
}

export class NatsFaultProxy {
  private server?: net.Server;
  private links = new Set<Link>();
  private refusing = false;
  private dropPrefix?: string;
  /** Publishes dropped so far. */
  dropped = 0;
  url = "";

  constructor(private readonly upstream: string) {}

  /** Listens on a loopback port; `url` is what a node puts in its config. */
  async start(): Promise<string> {
    const target = new URL(this.upstream.replace(/^nats:/, "http:"));
    const host = target.hostname;
    const port = Number(target.port || 4222);
    this.server = net.createServer((client) => {
      if (this.refusing) return client.destroy();
      const server = net.connect(port, host);
      const link: Link = {
        client,
        server,
        filter: new PubFilter((subject) => {
          const drop =
            this.dropPrefix !== undefined &&
            subject.startsWith(this.dropPrefix);
          if (drop) this.dropped++;
          return drop;
        })
      };
      this.links.add(link);
      const close = () => {
        this.links.delete(link);
        client.destroy();
        server.destroy();
      };
      client.on("data", (d) => {
        const out = link.filter.push(d);
        if (out.length) server.write(out);
      });
      server.on("data", (d) => client.write(d));
      client.on("error", close);
      server.on("error", close);
      client.on("close", close);
      server.on("close", close);
    });
    await new Promise<void>((resolve) =>
      this.server!.listen(0, "127.0.0.1", () => resolve())
    );
    const { port: own } = this.server.address() as net.AddressInfo;
    this.url = `nats://127.0.0.1:${own}`;
    return this.url;
  }

  /** Cuts every connection and refuses new ones until `restore`. */
  dropConnection() {
    this.refusing = true;
    for (const l of [...this.links]) {
      l.client.destroy();
      l.server.destroy();
    }
    this.links.clear();
  }

  /** Discards publishes whose subject starts with `prefix` (default every roomr.* subject). */
  dropMessages(prefix = "roomr.") {
    this.dropPrefix = prefix;
  }

  /** Accepts connections and forwards every message again. */
  restore() {
    this.refusing = false;
    this.dropPrefix = undefined;
  }

  async stop() {
    this.dropConnection();
    const server = this.server;
    this.server = undefined;
    if (server) await new Promise<void>((r) => server.close(() => r()));
  }
}
