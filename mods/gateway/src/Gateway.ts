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
import * as http from "http";
import { AddressInfo } from "net";
import {
  CallRecordWriter,
  RECORD_SEALED_SUBJECT,
  RecordIndexEntry
} from "@fonoster/callrecord";
import { Registry as RegistryNs, Webhooks } from "@fonoster/common";
import { IdentityClient } from "@fonoster/identity-client";
import { getLogger } from "@fonoster/logger";
import { connect, NatsConnection, StringCodec, Subscription } from "nats";
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
  NatsMediaControl
} from "./media/MediaControl";
import { CallRecordSink, MemoryCallRecordSink } from "./record/CallRecordSink";
import { serveRecordMaintenance } from "./record/maintenance";
import { Call, CallInfo } from "./session/Call";
import { Catalog, WorkspaceKeySource } from "./speech/Catalog";

const logger = getLogger({ service: "gateway", filePath: __filename });
const sc = StringCodec();

/** Subject an owning gateway answers for call-control requests from other replicas. */
export const callSubject = (callRef: string) => `gateway.calls.${callRef}`;
/** Outbound session requests from the control plane (MN5), shared across replicas. */
export const OUTBOUND_SUBJECT = "gateway.outbound";

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
};

/** A node is down after this long without a heartbeat (3 missed beats of 2 s). */
export const NODE_DOWN_AFTER_MS = 6000;

export class Gateway {
  readonly calls = new Map<string, Call>();
  readonly record: CallRecordSink;
  private nc?: NatsConnection;
  private ownsNats = false;
  private media?: MediaControl;
  private catalog: Catalog;
  private stops: (() => void)[] = [];
  private server?: http.Server;
  private heartbeats = new Map<string, number>();
  readonly apps: AppStore;

  constructor(private readonly options: GatewayOptions) {
    const problems = validateConfig(options.config);
    if (problems.length)
      throw new Error(
        `invalid gateway config:\n  - ${problems.join("\n  - ")}`
      );
    this.record = options.record ?? new MemoryCallRecordSink();
    this.catalog = new Catalog(
      options.config,
      options.registryStore,
      options.workspaceKeys
    );
    this.apps = options.apps ?? new YamlAppStore(options.config.apps ?? []);
  }

  get config() {
    return this.options.config;
  }

  get httpPort(): number | undefined {
    return (this.server?.address() as AddressInfo | undefined)?.port;
  }

  async start(): Promise<this> {
    this.nc =
      this.options.nats ?? (await connect({ servers: this.config.nats.url }));
    this.ownsNats = !this.options.nats;
    this.media = new NatsMediaControl(this.nc);

    this.stops.push(
      this.media.onIncoming(
        (nodeId, event) => void this.onIncoming(nodeId, event)
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

  async stop() {
    for (const stop of this.stops) stop();
    this.apps.stop?.();
    for (const call of [...this.calls.values()]) call.finish("error");
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
    this.nc?.publish(RECORD_SEALED_SUBJECT, sc.encode(JSON.stringify(entry)));
    if (entry.status === "erased") return;
    const base = (this.config.callRecord?.recordUrl ?? "/api/records").replace(
      /\/$/,
      ""
    );
    this.options.webhooks?.(
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
      webhooks: this.options.webhooks,
      onEnded: (c) => {
        this.calls.delete(c.callRef);
        sub?.unsubscribe();
      }
    });
    this.calls.set(info.callRef, call);

    // Call control from other replicas (the Twilio-compatible hang-up endpoint).
    sub = this.nc!.subscribe(callSubject(info.callRef), {
      callback: (err, msg) => {
        if (err) return;
        const request = JSON.parse(sc.decode(msg.data));
        if (request.type === "hangup") {
          // Only the call's own workspace may hang it up (the endpoint answers 404 otherwise).
          if (
            request.accountSid &&
            call.workspaceRef &&
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
  private async onIncoming(nodeId: string, event: MediaEvent) {
    const participant = event.participant as
      | { participantRef: string; tracks?: unknown[] }
      | undefined;
    const roomRef = event.roomRef as string;
    const to = String(event.to ?? "");
    const appRef = event.appRef as string | undefined;
    const info: CallInfo = {
      nodeId,
      roomRef,
      callRef: (event.callRef as string) ?? roomRef,
      callerRef:
        (event.participantRef as string) ?? participant?.participantRef ?? "",
      direction: "inbound",
      from: String(event.from ?? ""),
      to,
      metadata: (event.metadata as Record<string, unknown>) ?? {},
      callerTracks: participant?.tracks
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
      this.options.webhooks?.(
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
    let subscribed = true;
    const unsubscribe = () => {
      if (subscribed) stop();
      subscribed = false;
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
        } else if (event.type === "call.answered") {
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
          unsubscribe();
          this.record.append(callRef, {
            at: Date.now(),
            source: "event",
            message: {
              type: "call.started",
              direction: "outbound",
              appRef: app.ref,
              workspaceRef: app.workspaceRef ?? null,
              from: request.from ?? "",
              to: request.to ?? ""
            }
          });
          this.record.append(callRef, {
            at: Date.now(),
            source: "event",
            message: { type: "call.progress", status: event.status }
          });
          this.record.append(callRef, {
            at: Date.now(),
            source: "event",
            message: {
              type: "call.failed",
              reason: event.status,
              sipStatus: event.sipStatus
            }
          });
          this.record.close(callRef);
          this.options.webhooks?.(
            Webhooks.callFailed(app.workspaceRef ?? "default", {
              callRef,
              appRef: app.ref,
              from: request.from ?? "",
              to: request.to ?? "",
              direction: "outbound",
              reason: String(event.status)
            })
          );
        }
      }
    );
    return { type: "ack", callRef };
  }
}
