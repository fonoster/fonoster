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
import { randomUUID } from "crypto";
import * as http from "http";
import { AddressInfo } from "net";
import {
  CallRecordWriter,
  RECORD_SEALED_SUBJECT,
  RecordIndexEntry
} from "@fonoster/callrecord";
import {
  natsConnectOptions,
  Registry as RegistryNs,
  Sessions,
  Webhooks
} from "@fonoster/common";
import { IdentityClient } from "@fonoster/identity-client";
import { getLogger } from "@fonoster/logger";
import { connect, NatsConnection, StringCodec, Subscription } from "nats";
import { AmdClassifier, loadAmdClassifier } from "./amd/AmdListener";
import { AppStore, YamlAppStore } from "./apps/AppStore";
import { AppConfig, GatewayConfig, validateConfig } from "./config";
import {
  configPairAuthenticator,
  createHangupHandler,
  identityAuthenticator
} from "./http/hangupEndpoint";
import { KEY_SET_PATH, keySetHandler } from "./http/keySetRoute";
import {
  MediaControl,
  MediaEvent,
  NatsMediaControl,
  traceHeaders
} from "./media/MediaControl";
import { CallRecordSink, NullCallRecordSink } from "./record/CallRecordSink";
import { serveRecordMaintenance } from "./record/maintenance";
import { Call, CallInfo } from "./session/Call";
import { Catalog, WorkspaceKeySource } from "./speech/Catalog";
import { telemetry } from "./telemetry";
import { TestCallVerifier } from "./testCalls";

const logger = getLogger({ service: "gateway", filePath: __filename });
const sc = StringCodec();

/** Subject an owning gateway answers for call-control requests from other replicas. */
export const callSubject = (callRef: string) => `gateway.calls.${callRef}`;
/** Outbound session requests from the control plane (MN5), shared across replicas. */
export const OUTBOUND_SUBJECT = "gateway.outbound";

/** Catalog ids sessions resolved (one message per session and id; the control plane counts them). */
export const REGISTRY_USED_SUBJECT = "registry.used";

export type GatewayOptions = {
  config: GatewayConfig;
  record?: CallRecordSink;
  /** Use an existing NATS connection instead of connecting to config.nats.url. */
  nats?: NatsConnection;
  /** Receives call.started, call.ended and call.failed (a WebhookDispatcher's publish). */
  webhooks?: (event: Webhooks.WebhookEvent) => void;
  /** Where apps come from (default: the config's `apps` list). */
  apps?: AppStore;
  /** The provider registry's store (default: `registry.file` from the config). */
  registryStore?: RegistryNs.RegistryStore;
  /** Workspace vendor keys (registry 3.2); without it every call uses the platform keys. */
  workspaceKeys?: WorkspaceKeySource;
  /** The AMD classifier (default: mods/amd's model when the config has `amd`). */
  amdClassifier?: AmdClassifier;
  /**
   * The session registry (add-platform 2.3): `true` (default) writes this gateway's
   * `gateways.<ref>` and `calls.<callRef>` entries when JetStream is available; `false` skips it;
   * a string names another bucket (tests).
   */
  sessions?: boolean | string;
  /** Gives up an unanswered outbound call after this long (default OUTBOUND_ANSWER_TIMEOUT_MS). */
  outboundAnswerTimeoutMs?: number;
};

/** Gateways announce themselves here every 5 s (counted by a private region's agent). */
export const GATEWAY_HEARTBEAT_SUBJECT = "gateway.heartbeat";

/** A node is down after this long without a heartbeat (3 missed beats of 2 s). */
export const NODE_DOWN_AFTER_MS = 6000;

/**
 * An outbound call with no answer, failure or room.ended this long after `gateway.outbound` is
 * given up (the node's dial timeout is 60 s, so a live node always reports first).
 */
export const OUTBOUND_ANSWER_TIMEOUT_MS = 75_000;

/** How long a call.incoming waits on the session registry to check its X-Call-Ref (RV-B7). */
const LEASE_LOOKUP_TIMEOUT_MS = 500;

export class Gateway {
  readonly calls = new Map<string, Call>();
  readonly record: CallRecordSink;
  private nc?: NatsConnection;
  private ownsNats = false;
  private media?: MediaControl;
  private catalog: Catalog;
  private stops: (() => void)[] = [];
  /** This gateway's session-registry entries (undefined until the bucket is open, or without JetStream). */
  private leases?: Sessions.SessionLeases;
  readonly gatewayRef = randomUUID();
  private server?: http.Server;
  private heartbeats = new Map<string, number>();
  /** Stops the room watch of each outbound call not answered yet. */
  private pendingOutbound = new Set<() => void>();
  readonly apps: AppStore;
  /** Where call.* and call_record.sealed events go (the dispatcher, or the bus in bus mode). */
  private webhooks?: (event: Webhooks.WebhookEvent) => void;

  constructor(private readonly options: GatewayOptions) {
    const problems = validateConfig(options.config);
    if (problems.length)
      throw new Error(
        `invalid gateway config:\n  - ${problems.join("\n  - ")}`
      );
    // No call record configured: keep nothing (call-record, "No record store configured").
    this.record = options.record ?? new NullCallRecordSink();
    this.catalog = new Catalog(
      options.config,
      options.registryStore,
      options.workspaceKeys
    );
    this.apps = options.apps ?? new YamlAppStore(options.config.apps ?? []);
    this.webhooks = options.webhooks;
    // On by default now that @fonoster/amd is a dependency (AO-B2); loaded on first use.
    this.amdClassifier =
      options.amdClassifier ??
      (options.config.amd?.enabled === false
        ? undefined
        : loadAmdClassifier(options.config.amd?.modelDir));
  }

  private readonly amdClassifier?: AmdClassifier;
  private readonly testCalls = new TestCallVerifier(
    this.options.config.testCalls?.publicKeyFile
  );

  get config() {
    return this.options.config;
  }

  get httpPort(): number | undefined {
    return (this.server?.address() as AddressInfo | undefined)?.port;
  }

  async start(): Promise<this> {
    this.nc =
      this.options.nats ??
      (await connect(natsConnectOptions(this.config.nats)));
    this.ownsNats = !this.options.nats;
    // Claim replies carry this gateway's ref: the node ends the room if this gateway is lost.
    this.media = new NatsMediaControl(this.nc, { gatewayRef: this.gatewayRef });
    if (
      !this.webhooks &&
      this.config.webhooks?.enabled &&
      this.config.webhooks.transport === "bus"
    )
      this.webhooks = Webhooks.busWebhookPublisher(this.nc);

    this.stops.push(
      this.media.onIncoming(
        (nodeId, event, traceparent) =>
          void this.onIncoming(nodeId, event, traceparent)
      ),
      this.media.onNodeStatus((event) => this.onNodeStatus(event))
    );
    const watch = setInterval(() => this.checkNodes(), 1000);
    this.stops.push(() => clearInterval(watch));
    const outbound = this.nc.subscribe(OUTBOUND_SUBJECT, {
      queue: "gateway-outbound",
      callback: (err, msg) => {
        if (err) return;
        const request = JSON.parse(sc.decode(msg.data));
        const reply = this.onOutbound(request);
        msg.respond(sc.encode(JSON.stringify(reply)));
      }
    });
    this.stops.push(() => outbound.unsubscribe());
    const gatewayRef = this.gatewayRef;
    const beat = () => {
      this.leases?.set("gateways", gatewayRef, {
        gatewayRef,
        calls: this.calls.size
      });
      this.nc?.publish(
        GATEWAY_HEARTBEAT_SUBJECT,
        sc.encode(
          JSON.stringify({
            type: "gateway.heartbeat",
            gatewayRef,
            calls: this.calls.size,
            at: new Date().toISOString()
          })
        )
      );
    };
    if (this.options.sessions !== false) await this.openSessions();
    beat();
    const beats = setInterval(beat, 5000);
    this.stops.push(() => clearInterval(beats));
    if (this.record instanceof CallRecordWriter)
      this.stops.push(serveRecordMaintenance(this.nc, this.record));
    await this.nc.flush();

    if (this.config.http) {
      const h = this.config.http;
      const authenticate = h.identity
        ? identityAuthenticator(new IdentityClient(h.identity.endpoint))
        : configPairAuthenticator({
            accountSid: h.accountSid ?? "",
            authToken: h.authToken ?? ""
          });
      const hangup = createHangupHandler(authenticate, this.nc);
      const keys = keySetHandler(this.config.callRecord);
      this.server = http.createServer((req, res) =>
        keys && req.method === "GET" && req.url?.split("?")[0] === KEY_SET_PATH
          ? keys(req, res)
          : hangup(req, res)
      );
      await new Promise<void>((r) =>
        this.server!.listen(
          this.config.http!.port,
          this.config.http!.host ?? "0.0.0.0",
          r
        )
      );
    }
    logger.info(`gateway started with ${this.apps.count()} apps`);
    return this;
  }

  /** Opens the session registry; without JetStream the gateway runs on heartbeats only. */
  private async openSessions() {
    const bucket =
      typeof this.options.sessions === "string"
        ? this.options.sessions
        : undefined;
    try {
      const kv = await Promise.race([
        Sessions.openSessions(this.nc!, { bucket }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timed out")), 3000).unref()
        )
      ]);
      this.leases = new Sessions.SessionLeases(kv, { logger });
    } catch (e) {
      logger.warn(
        `session registry unavailable (is JetStream on?): ${(e as Error).message}`
      );
    }
  }

  async stop() {
    for (const stop of this.stops) stop();
    for (const unsubscribe of [...this.pendingOutbound]) unsubscribe();
    this.apps.stop?.();
    for (const call of [...this.calls.values()]) call.finish("error");
    await this.leases?.close();
    await new Promise<void>((r) =>
      this.server ? this.server.close(() => r()) : r()
    );
    if (this.ownsNats) await this.nc?.drain();
  }

  findApp = (ref: string): AppConfig | undefined => this.apps.find(ref);
  /**
   * A record was sealed (a CallRecordWriter's onSealed): the index entry goes to the control
   * plane over NATS and the workspace gets `call_record.sealed` with a link, never contents.
   */
  onRecordSealed(entry: RecordIndexEntry) {
    // The call's trace continues in the apiserver's indexing span when the call span is open.
    const traceparent = telemetry.traceparent(entry.callRef);
    this.nc?.publish(
      RECORD_SEALED_SUBJECT,
      sc.encode(JSON.stringify(entry)),
      traceparent ? { headers: traceHeaders(traceparent) } : undefined
    );
    if (entry.status === "erased") return;
    const base = (this.config.callRecord?.recordUrl ?? "/api/records").replace(
      /\/$/,
      ""
    );
    this.webhooks?.(
      Webhooks.callRecordSealed(entry.workspaceRef ?? "default", {
        callRef: entry.callRef,
        version: entry.version,
        recordUrl: `${base}/${encodeURIComponent(entry.callRef)}?version=${entry.version}`
      })
    );
  }

  /**
   * Development fallback when Routr sent no `X-App-Ref` (build log B21): the app a dialed number
   * routes to; apps without numbers catch everything else.
   */
  appForNumber(to: string): AppConfig | undefined {
    return this.apps.forNumber(to);
  }

  private newCall(info: CallInfo): Call {
    let sub: Subscription | undefined;
    const call = new Call(info, {
      config: this.config,
      media: this.media!,
      catalog: this.catalog,
      record: this.record,
      findApp: this.findApp,
      webhooks: this.webhooks,
      amd: this.amdClassifier,
      onCatalogUse: (use) =>
        this.nc?.publish(REGISTRY_USED_SUBJECT, sc.encode(JSON.stringify(use))),
      onEnded: (c) => {
        this.calls.delete(c.callRef);
        void this.leases?.delete("calls", c.callRef);
        sub?.unsubscribe();
      }
    });
    this.calls.set(info.callRef, call);
    // The call in the session registry: any replica (or the control plane) finds its owner.
    void this.leases?.set("calls", info.callRef, {
      callRef: info.callRef,
      gatewayRef: this.gatewayRef,
      nodeId: info.nodeId,
      roomRef: info.roomRef,
      direction: info.direction
    });

    // Call control from other replicas (the Twilio-compatible hang-up endpoint).
    sub = this.nc!.subscribe(callSubject(info.callRef), {
      callback: (err, msg) => {
        if (err) return;
        const request = JSON.parse(sc.decode(msg.data));
        if (request.type === "hangup") {
          // Only the call's own workspace may hang it up (the endpoint answers 404 otherwise);
          // a call without a workspace cannot be hung up this way (RV-B12).
          if (
            !request.accountSid ||
            !call.workspaceRef ||
            request.accountSid !== call.workspaceRef
          ) {
            msg.respond(
              sc.encode(JSON.stringify({ type: "error", code: "not_found" }))
            );
            return;
          }
          void call.hangup("app_hangup");
          msg.respond(sc.encode(JSON.stringify({ type: "ack" })));
        }
      }
    });
    return call;
  }

  /** A claimed `call.incoming`: Routr's X-App-Ref picks the app (B21). */
  private async onIncoming(
    nodeId: string,
    event: MediaEvent,
    traceparent?: string
  ) {
    const participant = event.participant as
      | { participantRef: string; tracks?: unknown[] }
      | undefined;
    const roomRef = event.roomRef as string;
    const to = String(event.to ?? "");
    const appRef = event.appRef as string | undefined;
    // A callRef (X-Call-Ref) that names a live call never joins it, here or on another replica
    // (the session registry): the new call gets its own ref, its room's (RV-B7).
    let callRef = (event.callRef as string) ?? roomRef;
    if (this.calls.has(callRef) || (await this.liveElsewhere(callRef))) {
      logger.warn(
        `call.incoming with the callRef of a live call (${callRef}); using room ${roomRef}`
      );
      callRef = this.calls.has(roomRef) ? `${roomRef}-${Date.now()}` : roomRef;
    }
    const info: CallInfo = {
      nodeId,
      roomRef,
      callRef,
      callerRef:
        (event.participantRef as string) ?? participant?.participantRef ?? "",
      direction: "inbound",
      from: String(event.from ?? ""),
      to,
      metadata: (event.metadata as Record<string, unknown>) ?? {},
      callerTracks: participant?.tracks,
      traceparent
    };
    const app = appRef ? this.findApp(appRef) : this.appForNumber(to);
    const call = this.newCall(info);
    if (!app) {
      // A minimal record: parties, timing and the reason (call-record, minimal records).
      call.record("event", {
        type: "call.started",
        direction: "inbound",
        appRef: appRef ?? null,
        workspaceRef: null,
        from: info.from,
        to
      });
      call.record("event", { type: "call.unrouted", appRef, to });
      call.record("event", { type: "call.failed", reason: "no_app" });
      this.webhooks?.(
        Webhooks.callFailed("default", {
          callRef: info.callRef,
          appRef,
          from: info.from,
          to,
          direction: "inbound",
          reason: "no_app"
        })
      );
      return call.reject(404);
    }
    // Browser test calls only reach apps of their token's workspace (add-talk-in-browser D4).
    const test = this.testCalls.check(
      event.headers as Record<string, unknown> | undefined,
      app.workspaceRef
    );
    if (!test.ok) {
      logger.warn(
        `call ${info.callRef}: test call to app ${app.ref} denied (${test.reason})`
      );
      call.record("event", {
        type: "call.started",
        direction: "inbound",
        appRef: app.ref,
        workspaceRef: app.workspaceRef ?? null,
        from: info.from,
        to
      });
      call.record("event", { type: "call.failed", reason: "test_call_denied" });
      return call.reject(403);
    }
    // The caller hears ringing while the app is dialed (media-control, "Ringing before answer").
    void call
      .mediaCommand({ type: "ring", participantRef: info.callerRef })
      .catch(() => undefined);
    try {
      await call.run(app);
    } catch (e) {
      logger.error(`call ${info.callRef} failed: ${(e as Error).message}`);
      await call.hangup("error");
    }
  }

  /**
   * Whether another gateway holds a live `calls.<callRef>` lease. A registry that does not answer
   * in time counts as no (the call is not held up; the local check still applies).
   */
  private async liveElsewhere(callRef: string): Promise<boolean> {
    if (!this.leases) return false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const entry = await Promise.race([
        this.leases.get("calls", callRef),
        new Promise<undefined>((r) => {
          timer = setTimeout(() => r(undefined), LEASE_LOOKUP_TIMEOUT_MS);
        })
      ]);
      return !!entry && entry.gatewayRef !== this.gatewayRef;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  private onNodeStatus(event: MediaEvent) {
    const nodeId = String(event.nodeId ?? "");
    if (!nodeId) return;
    if (event.type === "node.heartbeat")
      this.heartbeats.set(nodeId, Date.now());
    else if (event.type === "node.down") this.heartbeats.delete(nodeId);
  }

  /** Ends the calls of nodes that stopped sending heartbeats (media-control, liveness). */
  private checkNodes() {
    const now = Date.now();
    for (const [nodeId, at] of this.heartbeats) {
      if (now - at < NODE_DOWN_AFTER_MS) continue;
      this.heartbeats.delete(nodeId);
      logger.warn(`media node ${nodeId} missed its heartbeats`);
      for (const call of [...this.calls.values()])
        if (call.info.nodeId === nodeId) call.nodeLost();
    }
  }

  /**
   * An outbound call placed by the control plane: the gateway watches the room and opens the
   * app's session only when the callee answers (VS13). Call progress is not sent to the app.
   * The watch ends on answer, on a failed dial, on room.ended, or after `outboundAnswerTimeoutMs`
   * without an answer (the node died while ringing); the last three get a minimal record and
   * `call.failed`.
   */
  private onOutbound(request: {
    nodeId: string;
    roomRef: string;
    appRef: string;
    callRef?: string;
    from?: string;
    to?: string;
    metadata?: Record<string, unknown>;
  }) {
    const app = this.findApp(request.appRef);
    if (!app) return { type: "error", code: "unknown_app" };
    const callRef = request.callRef ?? request.roomRef;
    let answered: Call | undefined;
    let settled = false;
    let watching = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = () => {
      if (!watching) return;
      watching = false;
      clearTimeout(timer);
      stop();
      this.pendingOutbound.delete(unsubscribe);
    };
    /** The call ended before anyone answered. */
    const failed = (reason: string, progress?: string, sipStatus?: unknown) => {
      unsubscribe();
      if (settled) return;
      settled = true;
      const entry = (message: Record<string, unknown>) =>
        this.record.append(callRef, {
          at: Date.now(),
          source: "event",
          message
        });
      entry({
        type: "call.started",
        direction: "outbound",
        appRef: app.ref,
        workspaceRef: app.workspaceRef ?? null,
        from: request.from ?? "",
        to: request.to ?? ""
      });
      if (progress) entry({ type: "call.progress", status: progress });
      entry({ type: "call.failed", reason, sipStatus });
      this.record.close(callRef);
      this.webhooks?.(
        Webhooks.callFailed(app.workspaceRef ?? "default", {
          callRef,
          appRef: app.ref,
          from: request.from ?? "",
          to: request.to ?? "",
          direction: "outbound",
          reason
        })
      );
    };
    const stop = this.media!.subscribeRoom(
      request.nodeId,
      request.roomRef,
      (event) => {
        if (event.type === "participant.joined" && answered) {
          // The callee's tracks follow call.answered (the recording listener needs their ids).
          if (event.participantRef === answered.info.callerRef) {
            answered.recording.noteTracks(event.participantRef, event.tracks);
            unsubscribe();
          }
        } else if (event.type === "call.answered" && !settled) {
          settled = true;
          clearTimeout(timer);
          setTimeout(unsubscribe, 5000);
          const call = this.newCall({
            nodeId: request.nodeId,
            roomRef: request.roomRef,
            callRef,
            callerRef: String(event.participantRef ?? ""),
            direction: "outbound",
            from: request.from ?? "",
            to: request.to ?? "",
            metadata: request.metadata ?? {}
          });
          answered = call;
          void call.run(app).catch(() => call.hangup("error"));
        } else if (
          event.type === "call.progress" &&
          event.status !== "ringing"
        ) {
          failed(String(event.status), String(event.status), event.sipStatus);
        } else if (event.type === "room.ended") {
          // Ended before an answer (no call.progress came: the node ended an orphan room).
          if (answered) unsubscribe();
          else failed(String(event.reason ?? "node_error"));
        }
      }
    );
    // No answer, no failure and no room.ended in time: the node is gone.
    timer = setTimeout(
      () => failed("node_error"),
      this.options.outboundAnswerTimeoutMs ?? OUTBOUND_ANSWER_TIMEOUT_MS
    );
    timer.unref?.();
    this.pendingOutbound.add(unsubscribe);
    return { type: "ack", callRef, gatewayRef: this.gatewayRef };
  }

  /** Outbound calls watched until answer (tests and metrics). */
  get pendingOutboundCount() {
    return this.pendingOutbound.size;
  }
}
