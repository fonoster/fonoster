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
import { ChildProcess } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  freeSipPort,
  freeTcpPort,
  RoomrBinaries,
  startProcess,
  stopProcess
} from "../fakes/RoomrProcess";
import { goNodeConfig, NodeOverrides } from "./nodeConfig";
import { SipBot, SipSide } from "./sip";

// The Go Roomr node (go/roomr) under the Roomr suite: each node is a process with its own
// roomr.yaml (the suite's config overrides rendered in), started in an empty working directory
// that is also its TMPDIR, so the suite can list every file the node wrote (it writes none). The
// SIP side is the caller bot: caller, trunk (the node's outbound proxy) and registrar.

export type StartedNode = {
  index: number;
  nodeRef: string;
  controlAddr: string;
  /** host:port a caller dials (the node's SIP listener). */
  sipAddr: string;
};

export type NodeContext = { natsUrl: string; sessionEndpoint: string };

/** What the Roomr suite needs from a kind of node: start, kill, drain and inspect them. */
export interface NodeDriver {
  readonly kind: "go" | "fake";
  readonly sip: SipSide;
  prepare(): Promise<void>;
  start(
    index: number,
    overrides: NodeOverrides,
    ctx: NodeContext
  ): Promise<StartedNode>;
  /** Dies without a word (SIGKILL). */
  kill(index: number): void;
  /** SIGTERM: the node drains and exits on its own. */
  sigterm(index: number): void;
  alive(index: number): boolean;
  /** Files the node wrote. */
  files(index: number): string[];
  /** Everything the node logged. */
  output(index: number): string;
  stop(): Promise<void>;
}

type GoNode = {
  child: ChildProcess;
  dir: string;
  config: string;
  log: string[];
};

function listFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(p);
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out;
}

export class GoNodeDriver implements NodeDriver {
  readonly kind = "go" as const;
  private bot: SipBot;
  private nodes: GoNode[] = [];

  constructor(private readonly bins: RoomrBinaries) {
    this.bot = new SipBot(bins.sipcaller);
  }

  get sip(): SipSide {
    return this.bot;
  }

  async prepare() {
    await this.bot.start();
  }

  async start(
    index: number,
    overrides: NodeOverrides,
    ctx: NodeContext
  ): Promise<StartedNode> {
    const nodeRef = `go-${index}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "roomr-node-"));
    const config = path.join(dir, "roomr.yaml");
    const log: string[] = [];
    // A probed port can be taken again before the node binds it: start again on fresh ports.
    for (let attempt = 1; ; attempt++) {
      const sipPort = await freeSipPort();
      const controlAddr = `127.0.0.1:${await freeTcpPort()}`;
      fs.writeFileSync(
        config,
        JSON.stringify(
          goNodeConfig({
            nodeId: nodeRef,
            natsUrl: ctx.natsUrl,
            sipListen: `127.0.0.1:${sipPort}`,
            controlListen: controlAddr,
            sessionEndpoint: ctx.sessionEndpoint,
            outboundProxy: this.bot.trunk,
            registrar: this.bot.registrar,
            overrides
          })
        )
      );
      try {
        const { child } = await startProcess(
          this.bins.roomr,
          ["-config", config],
          /ready/,
          { TMPDIR: dir },
          { cwd: dir, onOutput: (t) => log.push(t) }
        );
        this.nodes[index] = { child, dir, config, log };
        return { index, nodeRef, controlAddr, sipAddr: `127.0.0.1:${sipPort}` };
      } catch (e) {
        if (attempt >= 3) throw e;
      }
    }
  }

  kill(index: number) {
    this.nodes[index]?.child.kill("SIGKILL");
  }

  sigterm(index: number) {
    this.nodes[index]?.child.kill("SIGTERM");
  }

  alive(index: number): boolean {
    const c = this.nodes[index]?.child;
    return !!c && c.exitCode === null && c.signalCode === null;
  }

  files(index: number): string[] {
    const n = this.nodes[index];
    if (!n) return [];
    return listFiles(n.dir)
      .filter((f) => f !== n.config)
      .map((f) => path.relative(n.dir, f));
  }

  output(index: number): string {
    return this.nodes[index]?.log.join("") ?? "";
  }

  async stop() {
    await Promise.all(this.nodes.map((n) => n && stopProcess(n.child)));
    await this.bot.stop();
    for (const n of this.nodes)
      if (n) fs.rmSync(n.dir, { recursive: true, force: true });
    this.nodes = [];
  }
}
