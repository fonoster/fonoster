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
  Roomr,
  Sessions,
  TRACEPARENT_HEADER,
  Webhooks
} from "@fonoster/common";
import { IdentityClient } from "@fonoster/identity-client";
import { getLogger } from "@fonoster/logger";
import {
  connect,
  NatsConnection,
  headers as natsHeaders,
  StringCodec,
  Subscription
} from "nats";
import {
  Admission,
  ADMISSION_TIMEOUT_MS,
  admit,
  grpcAdmission,
  refusalStatus
} from "./admission";
import { AmdClassifier, loadAmdClassifier } from "./amd/AmdListener";
import { AppStore, YamlAppStore } from "./apps/AppStore";
import {
  AppBridgeConfig,
  AppConfig,
  DEFAULT_DRAIN_WAIT_MS,
  DEFAULT_SESSION_LISTEN,
  parseDurationMs,
  validateConfig
} from "./config";
import {
  configPairAuthenticator,
  createHangupHandler,
  identityAuthenticator
} from "./http/hangupEndpoint";
import { KEY_SET_PATH, keySetHandler } from "./http/keySetRoute";
import { ControlStream, StreamTap } from "./media/ControlStream";
import { SessionServer } from "./media/SessionServer";
import { CallRecordSink, NullCallRecordSink } from "./record/CallRecordSink";
import { serveRecordMaintenance } from "./record/maintenance";
import { Call, CallInfo } from "./session/Call";
import { Catalog, WorkspaceKeySource } from "./speech/Catalog";
import { telemetry } from "./telemetry";
import { headerValue, TestCallVerifier } from "./testCalls";

const logger = getLogger({ service: "appbridge", filePath: __filename });
const sc = StringCodec();

/** Subject an owning AppBridge answers for call-control requests from other replicas. */
export const callSubject = (callRef: string) => `appbridge.calls.${callRef}`;

/** Catalog ids sessions resolved (one message per session and id; the control plane counts them). */
export const REGISTRY_USED_SUBJECT = "registry.used";

/** How long a new control stream may take to send Start. */
export const START_TIMEOUT_MS = 5000;

/**
 * Keys of an outbound call's `Start.metadata` that AppBridge reads (redesign-roomr 4.8): the
 * controller names the app in `app_ref`; `app_metadata` (JSON) is the API caller's metadata for
 * `session.start`, and `from`/`to` the parties as the API named them.
 */
export const OUTBOUND_METADATA_KEYS = {
  appRef: "app_ref",
  appMetadata: "app_metadata",
  from: "from",
  to: "to"
} as const;

export type AppBridgeOptions = {
  config: AppBridgeConfig;
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
   * The session registry (add-platform 2.3): `true` (default) writes this AppBridge's
   * `calls.<callRef>` entries when JetStream is available; `false` skips it; a string names
   * another bucket (tests). AppBridge keeps no membership entry of its own (redesign-roomr 15.3).
   */
  sessions?: boolean | string;
  /** Asked before a call starts (default: the config's `authz` service; none admits every call). */
  admission?: Admission;
  /** Sees every control-stream message in and out (tests, debugging). */
  tap?: StreamTap;
};

/** How long the session registry may take to answer whether a callRef is live (RV-B7). */
const LEASE_LOOKUP_TIMEOUT_MS = 500;

/** The user part of a SIP URI (`sip:+1555@host;x=y` → `+1555`); anything else as given. */
export function userPart(uri: string): string {
  const m = /^sips?:([^@;>]+)@/i.exec(uri.trim());
  return m ? m[1] : uri;
}

export class AppBridge {
  readonly calls = new Map<string, Call>();
  readonly record: CallRecordSink;
  private nc?: NatsConnection;
  private ownsNats = false;
  private catalog: Catalog;
  private stops: (() => void)[] = [];
  /** This AppBridge's session-registry entries (undefined until the bucket is open, or without JetStream). */
  private leases?: Sessions.SessionLeases;
  /** Names this replica in its `calls.<callRef>` entries. */
  readonly bridgeRef = randomUUID();
  private server?: http.Server;
  private session?: SessionServer;
  private draining = false;
  readonly apps: AppStore;
  /** Where call.* and call_record.sealed events go (the dispatcher, or the bus in bus mode). */
  private webhooks?: (event: Webhooks.WebhookEvent) => void;

  constructor(private readonly options: AppBridgeOptions) {
    const problems = validateConfig(options.config);
    if (problems.length)
      throw new Error(
        `invalid AppBridge config:\n  - ${problems.join("\n  - ")}`
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
    // Set here, not as field initializers: with define semantics those run before `options` is
    // assigned.
    this.testCalls = new TestCallVerifier(
      options.config.testCalls?.publicKeyFile
    );
    this.admission =
      options.admission ??
      (options.config.authz
        ? grpcAdmission(
            options.config.authz.address,
            options.config.authz.timeoutMs
          )
        : undefined);
  }

  private readonly amdClassifier?: AmdClassifier;
  private readonly testCalls: TestCallVerifier;
  private readonly admission?: Admission;

  get config() {
    return this.options.config;
  }

  get httpPort(): number | undefined {
    return (this.server?.address() as AddressInfo | undefined)?.port;
  }

  /** The port Session.Connect and the health check are served on (after start). */
  get sessionPort(): number | undefined {
    return this.session?.port;
  }

  /** A loopback session endpoint for this replica (tests and fakes dial it). */
  get sessionEndpoint(): string {
    return `127.0.0.1:${this.sessionPort}`;
  }

  async start(): Promise<this> {
    this.nc =
      this.options.nats ??
      (await connect(natsConnectOptions(this.config.nats)));
    this.ownsNats = !this.options.nats;
    if (
      !this.webhooks &&
      this.config.webhooks?.enabled &&
      this.config.webhooks.transport === "bus"
    )
      this.webhooks = Webhooks.busWebhookPublisher(this.nc);

    if (this.options.sessions !== false) await this.openSessions();
    if (this.record instanceof CallRecordWriter)
      this.stops.push(serveRecordMaintenance(this.nc, this.record));
    await this.nc.flush();

    // The session endpoint: Roomr nodes open one control stream per call here (5.3).
    const keepalive = this.config.session?.keepalive;
    this.session = new SessionServer((stream) => void this.onStream(stream), {
      listen: this.config.session?.listen ?? DEFAULT_SESSION_LISTEN,
      keepaliveMs:
        keepalive === undefined ? undefined : parseDurationMs(keepalive)
    });
    await this.session.start();

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
    logger.info(
      `appbridge started with ${this.apps.count()} apps; sessions on port ${this.sessionPort}`
    );
    return this;
  }

  /** Opens the session registry; without JetStream AppBridge keeps no call entries. */
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

  /**
   * SIGTERM (13.3, control-plane "AppBridge drains on SIGTERM"): the health check reports
   * NOT_SERVING so the Service sends new streams elsewhere; open streams and app sockets keep
   * running until their calls end or `maxWaitMs` (session.drainWait, 1 h by default) passes.
   * Resolves when no call is left or the wait is over; `stop()` then ends what remains.
   */
  async drain(maxWaitMs?: number): Promise<void> {
    this.draining = true;
    this.session?.drain();
    const configured = this.config.session?.drainWait;
    const wait =
      maxWaitMs ??
      (configured === undefined
        ? DEFAULT_DRAIN_WAIT_MS
        : parseDurationMs(configured));
    const deadline = Date.now() + wait;
    logger.info(
      `draining: ${this.calls.size} calls, waiting up to ${Math.round(wait / 1000)} s`
    );
    while (this.calls.size > 0 && Date.now() < deadline)
      await new Promise((r) => setTimeout(r, Math.min(200, wait)));
  }

  /** Whether drain() was called (readiness is failing). */
  get isDraining() {
    return this.draining;
  }

  async stop() {
    for (const stop of this.stops) stop();
    this.apps.stop?.();
    // Calls still running end now: the app gets session.end (error), the node a Hangup.
    for (const call of [...this.calls.values()]) await call.hangup("error");
    await this.session?.stop();
    await this.leases?.close();
    await new Promise<void>((r) =>
      this.server ? this.server.close(() => r()) : r()
    );
    this.admission?.close?.();
    if (this.ownsNats) await this.nc?.drain();
  }

  findApp = (ref: string): AppConfig | undefined => this.apps.find(ref);

  /**
   * An app by ref, reloading once when the cache doesn't have it: an agent created a moment ago
   * answers its first call instead of a 404 until the next background refresh.
   */
  private async findAppFresh(ref: string): Promise<AppConfig | undefined> {
    const cached = this.findApp(ref);
    if (cached || !this.apps.refresh) return cached;
    try {
      await this.apps.refresh();
    } catch (e) {
      logger.warn(`app refresh on a miss failed: ${(e as Error).message}`);
    }
    return this.findApp(ref);
  }
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

  private newCall(info: CallInfo, stream: ControlStream): Call {
    let sub: Subscription | undefined;
    const call = new Call(info, {
      config: this.config,
      stream,
      catalog: this.catalog,
      record: this.record,
      findApp: this.findApp,
      webhooks: this.webhooks,
      amd: this.amdClassifier,
      onCatalogUse: (use) =>
        this.nc?.publish(REGISTRY_USED_SUBJECT, sc.encode(JSON.stringify(use))),
      // With the app and parties, so the control plane can send call.ended (appbridge-lost)
      // when this AppBridge dies mid-call.
      onAnswered: (c) => {
        if (this.calls.get(c.callRef) === c)
          void this.leases?.set("calls", c.callRef, {
            ...lease,
            ...c.startedParties(),
            // Billing counts an owner's active calls from these entries (add-billing-service D7).
            workspaceRef: c.workspaceRef ?? null
          });
      },
      onEnded: (c) => {
        this.calls.delete(c.callRef);
        void this.leases?.delete("calls", c.callRef);
        sub?.unsubscribe();
      }
    });
    this.calls.set(info.callRef, call);
    // The call in the session registry: any replica (or the control plane) finds its owner.
    const lease = {
      callRef: info.callRef,
      bridgeRef: this.bridgeRef,
      nodeId: info.nodeId,
      roomRef: info.roomRef,
      direction: info.direction
    };
    void this.leases?.set("calls", info.callRef, lease);

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

  /**
   * A new control stream from a Roomr node (5.3): `Start` first, then the call is routed by its
   * direction. A stream that sends anything else first, or nothing in time, is closed.
   */
  private async onStream(stream: Roomr.SessionServerStream) {
    const start = await ControlStream.first(stream, START_TIMEOUT_MS);
    if (!start) {
      try {
        stream.end();
      } catch {
        // already gone
      }
      return;
    }
    // Wrapped at once: what the node sends next is held until the call listens.
    const control = new ControlStream(stream, this.options.tap);
    control.callRef = start.callRef;
    try {
      if (start.direction === "OUTBOUND") await this.onOutbound(start, control);
      else await this.onIncoming(start, control);
    } catch (e) {
      logger.error(
        `call ${start.callRef}: setup failed: ${(e as Error).message}`
      );
      control.hangup();
      control.close();
    }
  }

  /** An inbound call: Routr's X-App-Ref in the INVITE headers picks the app (B21). */
  private async onIncoming(start: Roomr.SessionStart, control: ControlStream) {
    const headers = start.headers ?? {};
    const roomRef = start.roomRef;
    const to = start.to ?? "";
    const appRef = headerValue(headers, "X-App-Ref");
    // A callRef that names a live call never joins it, here or on another replica (the session
    // registry): the new call gets its own ref, its room's (RV-B7).
    let callRef = start.callRef || roomRef;
    if (this.calls.has(callRef) || (await this.liveElsewhere(callRef))) {
      logger.warn(
        `inbound call with the callRef of a live call (${callRef}); using room ${roomRef}`
      );
      callRef =
        this.calls.has(roomRef) || roomRef === callRef
          ? `${roomRef}-${Date.now()}`
          : roomRef;
    }
    const info: CallInfo = {
      nodeId: start.nodeRef,
      roomRef,
      callRef,
      callerRef: "",
      direction: "inbound",
      from: start.from ?? "",
      to,
      metadata: { ...(start.metadata ?? {}) },
      nodeMedia: start.media,
      traceparent: headerValue(headers, TRACEPARENT_HEADER)
    };
    const app = appRef
      ? await this.findAppFresh(appRef)
      : this.appForNumber(to);
    const call = this.newCall(info, control);
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
      // voice-session "Missing app reference": Reject with 404, no app socket.
      return call.reject(404);
    }
    // Browser test calls only reach apps of their token's workspace (add-talk-in-browser D4).
    const test = this.testCalls.check(headers, app.workspaceRef);
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
    if (test.test) {
      call.origin = "browser_test";
      // The SIP leg of a browser test runs between the media node's internal names
      // (internal → roomr): record who tested and the agent they called instead (#1060).
      call.info.from = test.caller ?? "browser";
      call.info.to = app.ref;
    }
    // Admission while the caller hears ringing (add-billing-service D7); the node sent 180.
    if (this.admission) {
      const decision = await admit(
        this.admission,
        {
          callRef: info.callRef,
          appRef: app.ref,
          workspaceRef: app.workspaceRef ?? "",
          direction: "inbound",
          origin: test.test ? "browser_test" : "call",
          from: info.from,
          to
        },
        this.options.config.authz?.timeoutMs ?? ADMISSION_TIMEOUT_MS
      );
      if (decision.failed)
        logger.warn(
          `call ${info.callRef}: admitted without an answer from authorization (${decision.failed})`
        );
      if (!decision.authorized) {
        const reason = decision.reason ?? "not_authorized";
        logger.info(`call ${info.callRef}: refused (${reason})`);
        call.record("event", {
          type: "call.started",
          direction: "inbound",
          appRef: app.ref,
          workspaceRef: app.workspaceRef ?? null,
          from: info.from,
          to
        });
        call.record("event", { type: "call.failed", reason });
        this.webhooks?.(
          Webhooks.callFailed(app.workspaceRef ?? "default", {
            callRef: info.callRef,
            appRef: app.ref,
            from: info.from,
            to,
            direction: "inbound",
            reason
          })
        );
        return call.reject(refusalStatus(decision.reason));
      }
    }
    try {
      await call.run(app);
    } catch (e) {
      logger.error(`call ${info.callRef} failed: ${(e as Error).message}`);
      await call.hangup("error");
    }
  }

  /**
   * An outbound call the callee answered (5.3): the controller named the app in
   * `Start.metadata.app_ref`; AppBridge connects the app and sends Ready. Calls that end before
   * an answer (busy, no answer, rejected) open no stream and never reach AppBridge.
   */
  private async onOutbound(start: Roomr.SessionStart, control: ControlStream) {
    const metadata = start.metadata ?? {};
    const appRef = metadata[OUTBOUND_METADATA_KEYS.appRef];
    const callRef = start.callRef || start.roomRef;
    const info: CallInfo = {
      nodeId: start.nodeRef,
      roomRef: start.roomRef,
      callRef,
      callerRef: "",
      direction: "outbound",
      from: metadata[OUTBOUND_METADATA_KEYS.from] ?? userPart(start.from ?? ""),
      to: metadata[OUTBOUND_METADATA_KEYS.to] ?? userPart(start.to ?? ""),
      metadata: appMetadata(metadata),
      nodeMedia: start.media,
      traceparent: headerValue(start.headers, TRACEPARENT_HEADER)
    };
    const app = appRef ? await this.findAppFresh(appRef) : undefined;
    const call = this.newCall(info, control);
    if (!app) {
      call.record("event", {
        type: "call.started",
        direction: "outbound",
        appRef: appRef ?? null,
        workspaceRef: null,
        from: info.from,
        to: info.to
      });
      call.record("event", { type: "call.failed", reason: "unknown_app" });
      this.webhooks?.(
        Webhooks.callFailed("default", {
          callRef,
          appRef: appRef ?? "",
          from: info.from,
          to: info.to,
          direction: "outbound",
          reason: "unknown_app"
        })
      );
      return call.reject(404);
    }
    try {
      await call.run(app);
    } catch (e) {
      logger.error(`call ${callRef} failed: ${(e as Error).message}`);
      await call.hangup("error");
    }
  }

  /**
   * Whether another AppBridge holds a live `calls.<callRef>` lease. A registry that does not answer
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
      return !!entry && entry.bridgeRef !== this.bridgeRef;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * The API caller's metadata for `session.start`: `app_metadata` (JSON) when the controller set
 * it, else every key except the ones AppBridge reads itself.
 */
export function appMetadata(
  metadata: Record<string, string>
): Record<string, unknown> {
  const raw = metadata[OUTBOUND_METADATA_KEYS.appMetadata];
  if (raw !== undefined) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
        return parsed as Record<string, unknown>;
    } catch {
      // not JSON: fall through to the plain keys
    }
  }
  const reserved = new Set<string>(Object.values(OUTBOUND_METADATA_KEYS));
  return Object.fromEntries(
    Object.entries(metadata).filter(([k]) => !reserved.has(k))
  );
}

/** NATS headers carrying a W3C traceparent (trace propagation between services). */
export function traceHeaders(traceparent: string) {
  const h = natsHeaders();
  h.set(TRACEPARENT_HEADER, traceparent);
  return h;
}
