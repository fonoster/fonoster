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
import * as fs from "fs";
import * as path from "path";
import { CellSecrets } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Msg, NatsConnection, StringCodec, Subscription } from "nats";
import { DatabaseApplier } from "./apply/DatabaseApplier";
import { RefMap, RoutrApplier, RoutrPort } from "./apply/RoutrApplier";
import { RelayResponder } from "./relay";
import {
  Components,
  ConfigSnapshot,
  Heartbeat,
  RegionIdentity,
  RelayRequest,
  subjects
} from "./types";

const logger = getLogger({ service: "region-agent", filePath: __filename });
const sc = StringCodec();

// The cell side of a private region (task 3.3): heartbeats, config sync into the cell's own
// systems, the relay responder, and call-record index and usage forwarding. It talks to the
// cell's NATS; the cell's NATS carries `region.<ref>.>` to the control plane over the leaf node.

/** Where the cell's gateways publish sealed records' index entries (call-record). */
export const RECORD_SEALED_SUBJECT = "callrecord.sealed";
export const GATEWAY_HEARTBEAT_SUBJECT = "gateway.heartbeat";
/** A media node counts while its heartbeats (every 2 s) are this fresh. */
const NODE_FRESH_MS = 10_000;
/** A gateway counts while its heartbeats (every 5 s) are this fresh. */
const GATEWAY_FRESH_MS = 20_000;

export type AgentState = {
  /** The enrollment the state belongs to; a new enrollment starts over (RC-B11). */
  regionRef?: string;
  tokenId?: string;
  /** The config version last applied; -1 before the first snapshot. */
  configVersion: number;
  routrRefs: RefMap;
  secretsNeeded: string[];
  /** Call seconds by period (YYYY-MM, UTC), rounded up to minutes per call. */
  usage: Record<string, number>;
  revoked?: { at: string; reason: string };
};

export type RegionAgentOptions = {
  identity: RegionIdentity;
  nc: NatsConnection;
  version: string;
  /** Where state.json and relay-audit.jsonl live. */
  stateDir: string;
  heartbeatMs?: number;
  /** First heartbeat after this long (lets component counts fill; default 6 s). */
  firstHeartbeatMs?: number;
  /** Retry of the config request while the control plane does not answer (default 10 s). */
  configRetryMs?: number;
  db?: DatabaseApplier;
  routr?: RoutrPort;
  relay?: RelayResponder;
  secrets?: CellSecrets.CellSecretStore;
  /** Whether the cell's hosted Autopilot answers. */
  autopilotProbe?: () => Promise<boolean>;
  now?: () => number;
};

export class RegionAgent {
  readonly subjects: ReturnType<typeof subjects>;
  readonly state: AgentState;
  private subs: Subscription[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private nodes = new Map<string, { at: number; rooms: number }>();
  private gateways = new Map<string, { at: number; calls: number }>();
  private applying: Promise<unknown> = Promise.resolve();
  private routr?: RoutrApplier;
  private stopped = false;
  /** Set while the control plane pauses config sync (unsupported version). */
  paused?: { reason: string; requiredVersion?: string };
  /** Resolves after each applied (or skipped) snapshot; for tests and logs. */
  onApplied?: (version: number, result: Record<string, unknown>) => void;

  constructor(private readonly options: RegionAgentOptions) {
    this.subjects = subjects(options.identity.regionRef);
    this.state = this.loadState();
    if (options.routr)
      this.routr = new RoutrApplier(options.routr, this.state.routrRefs);
  }

  private now() {
    return this.options.now?.() ?? Date.now();
  }

  private get stateFile() {
    return path.join(this.options.stateDir, "state.json");
  }

  private loadState(): AgentState {
    const fresh: AgentState = {
      configVersion: -1,
      routrRefs: {},
      secretsNeeded: [],
      usage: {}
    };
    const { regionRef, tokenId } = this.options.identity;
    let saved: AgentState | undefined;
    try {
      saved = JSON.parse(fs.readFileSync(this.stateFile, "utf8"));
    } catch {
      saved = undefined;
    }
    if (!saved || saved.regionRef !== regionRef)
      return { ...fresh, regionRef, tokenId };
    if (saved.tokenId !== tokenId)
      // Re-enrolled: apply the next snapshot in full; the cell's Routr refs stay valid.
      return {
        ...fresh,
        ...saved,
        configVersion: -1,
        revoked: undefined,
        tokenId
      };
    return { ...fresh, ...saved };
  }

  private saveState() {
    CellSecrets.writePrivateFile(
      this.stateFile,
      JSON.stringify(this.state, null, 2)
    );
  }

  private publish(subject: string, body: unknown) {
    this.options.nc.publish(subject, sc.encode(JSON.stringify(body)));
  }

  private on(subject: string, handler: (msg: Msg, body: unknown) => void) {
    const sub = this.options.nc.subscribe(subject, {
      callback: (err, msg) => {
        if (err) return;
        let body: unknown;
        try {
          body = JSON.parse(sc.decode(msg.data));
        } catch {
          return; // not ours
        }
        try {
          handler(msg, body);
        } catch (e) {
          logger.warn(`${subject}: ${(e as Error).message}`);
        }
      }
    });
    this.subs.push(sub);
  }

  async start(): Promise<this> {
    if (this.state.revoked)
      logger.warn(
        `this cell was revoked (${this.state.revoked.reason}); re-enroll with a new token`
      );
    const s = this.subjects;
    this.on("media.*.heartbeat", (_m, b) => {
      const e = b as { type?: string; nodeId?: string; rooms?: number };
      if (e.type === "node.heartbeat" && e.nodeId)
        this.nodes.set(e.nodeId, { at: this.now(), rooms: e.rooms ?? 0 });
      else if (e.type === "node.down" && e.nodeId) this.nodes.delete(e.nodeId);
    });
    this.on(GATEWAY_HEARTBEAT_SUBJECT, (_m, b) => {
      const e = b as { gatewayRef?: string; calls?: number };
      if (e.gatewayRef)
        this.gateways.set(e.gatewayRef, {
          at: this.now(),
          calls: e.calls ?? 0
        });
    });
    this.on(s.config, (_m, b) => this.enqueue(b as ConfigSnapshot));
    this.on(s.secretsNeeded, (_m, b) => this.onSecretsNeeded(b));
    this.on(s.revoked, (_m, b) => this.onRevoked(b));
    this.on(s.relay, (m, b) => void this.onRelay(m, b as RelayRequest));
    this.on(RECORD_SEALED_SUBJECT, (_m, b) => this.onSealed(b));
    await this.options.nc.flush();

    void this.requestConfig();
    const every = this.options.heartbeatMs ?? 30_000;
    this.timers.push(
      setTimeout(() => {
        void this.heartbeat();
        this.timers.push(setInterval(() => void this.heartbeat(), every));
      }, this.options.firstHeartbeatMs ?? 6000)
    );
    this.publishUsage();
    logger.info(
      `region agent for ${this.options.identity.regionRef} started (config v${this.state.configVersion})`
    );
    return this;
  }

  async stop() {
    this.stopped = true;
    this.timers.forEach((t) =>
      clearTimeout(t as ReturnType<typeof setTimeout>)
    );
    this.timers.forEach((t) =>
      clearInterval(t as ReturnType<typeof setInterval>)
    );
    this.subs.forEach((s) => s.unsubscribe());
    await this.applying.catch(() => undefined);
  }

  /** Asks for a snapshot until one arrives (the control plane may not be reachable yet). */
  async requestConfig(): Promise<void> {
    const retry = this.options.configRetryMs ?? 10_000;
    if (this.stopped) return;
    try {
      const reply = await this.options.nc.request(
        this.subjects.configRequest,
        sc.encode(
          JSON.stringify({
            type: "region.config.request",
            haveVersion: this.state.configVersion
          })
        ),
        { timeout: Math.min(retry, 5000) }
      );
      const body = JSON.parse(sc.decode(reply.data));
      if (body.type === "region.config") await this.enqueue(body);
      else if (body.type === "region.config.paused") {
        // Unsupported version (RG-B4): calls keep running on the last config; ask again later.
        this.paused = {
          reason: String(body.reason ?? "unsupported"),
          requiredVersion: body.requiredVersion
        };
        logger.warn(
          `config sync paused by the control plane: ${this.paused.reason}${
            body.requiredVersion
              ? ` (upgrade this cell to ${body.requiredVersion})`
              : ""
          }`
        );
        if (!this.stopped)
          this.timers.push(
            setTimeout(() => void this.requestConfig(), retry * 6)
          );
      } else logger.verbose("config is current");
    } catch (e) {
      logger.verbose(`config request: ${(e as Error).message}; retrying`);
      if (!this.stopped)
        this.timers.push(setTimeout(() => void this.requestConfig(), retry));
    }
  }

  /** Applies snapshots one at a time, in arrival order. */
  enqueue(snapshot: ConfigSnapshot): Promise<unknown> {
    this.applying = this.applying
      .catch(() => undefined)
      .then(() => this.apply(snapshot));
    return this.applying;
  }

  private async apply(snapshot: ConfigSnapshot) {
    if (snapshot?.type !== "region.config" || !snapshot.kinds) return;
    const version = Number(snapshot.configVersion);
    if (version <= this.state.configVersion) {
      logger.verbose(`config v${version} already applied`);
      return;
    }
    const result: Record<string, unknown> = {};
    try {
      if (this.options.db) result.db = await this.options.db.apply(snapshot);
      if (this.routr) result.routr = await this.routr.apply(snapshot);
    } catch (e) {
      // Calls keep running on the last applied config; the next snapshot or request retries.
      logger.error(`config v${version} failed: ${(e as Error).message}`);
      if (this.routr) this.state.routrRefs = this.routr.refs;
      this.saveState();
      return;
    }
    this.state.configVersion = version;
    this.paused = undefined;
    if (this.routr) this.state.routrRefs = this.routr.refs;
    this.saveState();
    logger.info(`config v${version} applied`, result);
    this.onApplied?.(version, result);
    void this.heartbeat();
  }

  private onSecretsNeeded(b: unknown) {
    const names = ((b as { names?: unknown[] }).names ?? []).map(String);
    this.state.secretsNeeded = names;
    this.saveState();
    const set = new Set(this.secretsSet());
    const missing = names.filter((n) => !set.has(n));
    if (missing.length)
      logger.warn(
        `secrets missing in this cell: ${missing.join(", ")} (fonoster-region secrets set <name>)`
      );
  }

  private onRevoked(b: unknown) {
    const reason = String((b as { reason?: string }).reason ?? "revoked");
    this.state.revoked = { at: new Date(this.now()).toISOString(), reason };
    this.saveState();
    logger.error(
      `the control plane revoked this cell (${reason}); calls keep running on the last config. Re-issue a token and run fonoster-region enroll to reconnect.`
    );
  }

  private async onRelay(msg: Msg, req: RelayRequest) {
    if (!msg.reply) return;
    const chunks = this.options.relay
      ? await this.options.relay.respond(req)
      : [
          {
            type: "region.relay.error" as const,
            id: String(req.id ?? ""),
            code: "store_unavailable"
          }
        ];
    for (const chunk of chunks)
      this.options.nc.publish(msg.reply, sc.encode(JSON.stringify(chunk)));
  }

  private onSealed(b: unknown) {
    const entry = b as {
      callRef?: string;
      durationSeconds?: number;
      startedAt?: string;
      endedAt?: string | null;
      status?: string;
    };
    if (!entry.callRef) return;
    // The control plane attributes the entry to the region's workspace anyway (contract 5).
    this.publish(this.subjects.index, {
      ...entry,
      workspaceRef: this.options.identity.workspaceRef
    });
    if (entry.status === "erased" || !entry.durationSeconds) return;
    const period = String(entry.endedAt ?? entry.startedAt ?? "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(period)) return;
    this.state.usage[period] =
      (this.state.usage[period] ?? 0) +
      Math.ceil(entry.durationSeconds / 60) * 60;
    this.saveState();
    this.publishUsage(period);
  }

  private publishUsage(
    period = new Date(this.now()).toISOString().slice(0, 7)
  ) {
    this.publish(this.subjects.usage, {
      type: "region.usage",
      minutes: Math.round((this.state.usage[period] ?? 0) / 60),
      period
    });
  }

  private secretsSet(): string[] {
    try {
      return this.options.secrets?.names() ?? [];
    } catch (e) {
      logger.warn(`cell secrets unreadable: ${(e as Error).message}`);
      return [];
    }
  }

  /** What the cell runs right now. */
  async components(): Promise<{ components: Components; activeCalls: number }> {
    const now = this.now();
    const nodes = [...this.nodes.values()].filter(
      (n) => now - n.at < NODE_FRESH_MS
    );
    const gateways = [...this.gateways.values()].filter(
      (g) => now - g.at < GATEWAY_FRESH_MS
    );
    const autopilot = this.options.autopilotProbe
      ? await this.options.autopilotProbe().catch(() => false)
      : false;
    return {
      components: {
        mediaNodes: nodes.length,
        gateways: gateways.length,
        autopilot
      },
      activeCalls: gateways.length
        ? gateways.reduce((n, g) => n + g.calls, 0)
        : nodes.reduce((n, x) => n + x.rooms, 0)
    };
  }

  async heartbeat(): Promise<Heartbeat | undefined> {
    if (this.stopped || this.state.revoked) return undefined;
    const { components, activeCalls } = await this.components();
    const beat: Heartbeat = {
      type: "region.heartbeat",
      regionRef: this.options.identity.regionRef,
      version: this.options.version,
      components,
      activeCalls,
      secretsSet: this.secretsSet(),
      configVersion: Math.max(0, this.state.configVersion),
      at: new Date(this.now()).toISOString()
    };
    this.publish(this.subjects.heartbeat, beat);
    return beat;
  }
}
