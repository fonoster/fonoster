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
import { endpointsHash } from "./endpoints";
import { RelayResponder } from "./relay";
import { normalizeSnapshot, UNKNOWN_WORKSPACE } from "./snapshot";
import {
  CELL_WORKSPACE_KEYS_SUBJECT,
  Components,
  ConfigSnapshot,
  Endpoints,
  Heartbeat,
  RegionIdentity,
  RelayRequest,
  subjects
} from "./types";

const logger = getLogger({ service: "region-agent", filePath: __filename });
const sc = StringCodec();

// The region side (task 3.3; public and private regions alike, PR-13): heartbeats, config sync
// into the region's own systems for every workspace bound to it (PR-14), the relay responder,
// call-record index and usage forwarding per workspace, and bring-your-own keys fetched per call
// for public regions (PR-20). It talks to the cell's NATS; the cell's NATS carries
// `region.<ref>.>` to the control plane over the leaf node.

/** Where the cell's gateways publish sealed records' index entries (call-record). */
export const RECORD_SEALED_SUBJECT = "callrecord.sealed";
export const GATEWAY_HEARTBEAT_SUBJECT = "gateway.heartbeat";
/** A media node counts while its heartbeats (every 2 s) are this fresh. */
const NODE_FRESH_MS = 10_000;
/** A gateway counts while its heartbeats (every 5 s) are this fresh. */
const GATEWAY_FRESH_MS = 20_000;
/** How long a bring-your-own key request waits for the control plane (contract 6). */
const KEY_TIMEOUT_MS = 2000;

export type AgentState = {
  /** The enrollment the state belongs to; a new enrollment starts over (RC-B11). */
  regionRef?: string;
  tokenId?: string;
  /** The config version last applied; -1 before the first snapshot. */
  configVersion: number;
  routrRefs: RefMap;
  secretsNeeded: string[];
  /** The workspaces of the last applied snapshot; records of others are not forwarded. */
  workspaces: string[];
  /** Call seconds by workspace, then period (YYYY-MM, UTC), rounded up to minutes per call. */
  usage: Record<string, Record<string, number>>;
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
  /** The cell's public connection details (task 3.6); re-read before each heartbeat. */
  endpoints?: () => Omit<Endpoints, "type" | "updatedAt"> | undefined;
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
  private sentEndpoints?: { hash: string; updatedAt: string };
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
      workspaces: this.options.identity.workspaceRef
        ? [this.options.identity.workspaceRef]
        : [],
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
    // Usage of the one-workspace cells was {period: seconds}.
    const usage: AgentState["usage"] = {};
    for (const [k, v] of Object.entries(saved.usage ?? {}))
      if (typeof v === "object" && v) usage[k] = v;
      else if (typeof v === "number" && this.options.identity.workspaceRef)
        (usage[this.options.identity.workspaceRef] ??= {})[k] = v;
    saved = { ...saved, usage };
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
    this.on(s.endpointsRequest, () => void this.publishEndpoints(true));
    this.on(s.relay, (m, b) => void this.onRelay(m, b as RelayRequest));
    this.on(RECORD_SEALED_SUBJECT, (_m, b) => this.onSealed(b));
    this.on(
      CELL_WORKSPACE_KEYS_SUBJECT,
      (m, b) => void this.onKeyRequest(m, b)
    );
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
    this.publishEndpoints(true);
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
    if (
      snapshot?.type !== "region.config" ||
      (!snapshot.kinds && !snapshot.workspaces)
    )
      return;
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
    this.state.workspaces = Object.keys(
      normalizeSnapshot(snapshot, this.options.identity.workspaceRef).workspaces
    )
      .filter((w) => w !== UNKNOWN_WORKSPACE)
      .sort();
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
        `secrets missing in this region: ${missing.join(", ")} (fonoster-regions secrets set <name>)`
      );
  }

  private onRevoked(b: unknown) {
    const reason = String((b as { reason?: string }).reason ?? "revoked");
    this.state.revoked = { at: new Date(this.now()).toISOString(), reason };
    this.saveState();
    logger.error(
      `the control plane revoked this cell (${reason}); calls keep running on the last config. Re-issue a token and run fonoster-regions enroll to reconnect.`
    );
  }

  private async onRelay(msg: Msg, req: RelayRequest) {
    if (!msg.reply) return;
    // Only records of a workspace of this region, for the workspace the caller is in (contract 5).
    const foreign =
      !req.workspaceRef || !this.state.workspaces.includes(req.workspaceRef);
    const chunks = foreign
      ? [
          {
            type: "region.relay.error" as const,
            id: String(req.id ?? ""),
            code: req.workspaceRef ? "not_found" : "bad_request"
          }
        ]
      : this.options.relay
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

  /**
   * A gateway asks for a workspace's bring-your-own key (contract 6): forwarded to the control
   * plane for this one call. Never cached, stored or logged; `{}` means "use the region's key".
   */
  private async onKeyRequest(msg: Msg, b: unknown) {
    if (!msg.reply) return;
    const { workspaceRef, provider } = (b ?? {}) as {
      workspaceRef?: string;
      provider?: string;
    };
    let answer: { value?: string } = {};
    if (
      this.options.identity.kind !== "private" &&
      !this.state.revoked &&
      typeof workspaceRef === "string" &&
      typeof provider === "string" &&
      this.state.workspaces.includes(workspaceRef)
    ) {
      try {
        const reply = await this.options.nc.request(
          this.subjects.secretsGet,
          sc.encode(
            JSON.stringify({
              type: "region.secrets.get",
              workspaceRef,
              provider
            })
          ),
          { timeout: KEY_TIMEOUT_MS }
        );
        const r = JSON.parse(sc.decode(reply.data));
        if (
          r?.type === "region.secrets.value" &&
          typeof r.value === "string" &&
          r.workspaceRef === workspaceRef
        )
          answer = { value: r.value };
      } catch (e) {
        // The message names the subject only, never a value.
        logger.verbose(`workspace key request: ${(e as Error).message}`);
      }
    }
    msg.respond(sc.encode(JSON.stringify(answer)));
  }

  private onSealed(b: unknown) {
    const entry = b as {
      callRef?: string;
      workspaceRef?: string | null;
      accessKeyId?: string | null;
      durationSeconds?: number;
      startedAt?: string;
      endedAt?: string | null;
      status?: string;
    };
    if (!entry.callRef) return;
    // Only records of the region's workspaces cross the link (contract 5).
    const ws = entry.workspaceRef ?? entry.accessKeyId ?? undefined;
    if (!ws || !this.state.workspaces.includes(ws)) {
      logger.warn(
        `record ${entry.callRef} of workspace ${ws ?? "?"} is not in this region; not indexed`
      );
      return;
    }
    this.publish(this.subjects.index, { ...entry, workspaceRef: ws });
    if (entry.status === "erased" || !entry.durationSeconds) return;
    const period = String(entry.endedAt ?? entry.startedAt ?? "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(period)) return;
    const usage = (this.state.usage[ws] ??= {});
    usage[period] =
      (usage[period] ?? 0) + Math.ceil(entry.durationSeconds / 60) * 60;
    this.saveState();
    this.publishUsage(period, [ws]);
  }

  /** `region.usage` per workspace (contract 3); at start, every workspace of the region. */
  private publishUsage(
    period = new Date(this.now()).toISOString().slice(0, 7),
    workspaces = this.state.workspaces
  ) {
    for (const workspaceRef of workspaces)
      this.publish(this.subjects.usage, {
        type: "region.usage",
        workspaceRef,
        minutes: Math.round(
          (this.state.usage[workspaceRef]?.[period] ?? 0) / 60
        ),
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

  /**
   * Sends `region.endpoints` when they changed (or always with `force`, e.g. after a reconnect);
   * returns their hash.
   */
  publishEndpoints(force = false): string | undefined {
    let e: ReturnType<NonNullable<RegionAgentOptions["endpoints"]>>;
    try {
      e = this.options.endpoints?.();
    } catch (err) {
      logger.warn(`endpoints: ${(err as Error).message}`);
      return this.sentEndpoints?.hash;
    }
    if (!e) return undefined;
    const hash = endpointsHash(e);
    if (!force && this.sentEndpoints?.hash === hash) return hash;
    const updatedAt =
      this.sentEndpoints?.hash === hash
        ? this.sentEndpoints.updatedAt
        : new Date(this.now()).toISOString();
    this.sentEndpoints = { hash, updatedAt };
    const message: Endpoints = { type: "region.endpoints", ...e, updatedAt };
    this.publish(this.subjects.endpoints, message);
    return hash;
  }

  async heartbeat(): Promise<Heartbeat | undefined> {
    if (this.stopped || this.state.revoked) return undefined;
    const hash = this.publishEndpoints();
    const { components, activeCalls } = await this.components();
    const beat: Heartbeat = {
      type: "region.heartbeat",
      regionRef: this.options.identity.regionRef,
      version: this.options.version,
      components,
      activeCalls,
      secretsSet: this.secretsSet(),
      configVersion: Math.max(0, this.state.configVersion),
      ...(hash ? { endpointsHash: hash } : {}),
      at: new Date(this.now()).toISOString()
    };
    this.publish(this.subjects.heartbeat, beat);
    return beat;
  }
}
