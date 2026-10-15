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
import { getLogger } from "@fonoster/logger";
import { connect, NatsConnection, StringCodec, Subscription } from "nats";
import { AppConfig, GatewayConfig, validateConfig } from "./config";
import { createHangupHandler } from "./http/hangupEndpoint";
import { KEY_SET_PATH, keySetHandler } from "./http/keySetRoute";
import {
  MediaControl,
  MediaEvent,
  NatsMediaControl
} from "./media/MediaControl";
import { CallRecordSink, MemoryCallRecordSink } from "./record/CallRecordSink";
import { Call, CallInfo } from "./session/Call";
import { Catalog } from "./speech/Catalog";

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
};

export class Gateway {
  readonly calls = new Map<string, Call>();
  readonly record: CallRecordSink;
  private nc?: NatsConnection;
  private ownsNats = false;
  private media?: MediaControl;
  private catalog: Catalog;
  private stops: (() => void)[] = [];
  private server?: http.Server;

  constructor(private readonly options: GatewayOptions) {
    const problems = validateConfig(options.config);
    if (problems.length)
      throw new Error(
        `invalid gateway config:\n  - ${problems.join("\n  - ")}`
      );
    this.record = options.record ?? new MemoryCallRecordSink();
    this.catalog = new Catalog(options.config);
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
      )
    );
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
    await this.nc.flush();

    if (this.config.http) {
      const hangup = createHangupHandler(this.config.http, this.nc);
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
    logger.info(`gateway started with ${this.config.apps.length} apps`);
    return this;
  }

  async stop() {
    for (const stop of this.stops) stop();
    for (const call of [...this.calls.values()]) call.finish("error");
    await new Promise<void>((r) =>
      this.server ? this.server.close(() => r()) : r()
    );
    if (this.ownsNats) await this.nc?.drain();
  }

  findApp = (ref: string): AppConfig | undefined =>
    this.config.apps.find((a) => a.ref === ref);

  /** The app a dialed number routes to; apps without numbers catch everything else. */
  appForNumber(to: string): AppConfig | undefined {
    return (
      this.config.apps.find((a) => a.numbers?.includes(to)) ??
      this.config.apps.find((a) => !a.numbers?.length)
    );
  }

  private newCall(info: CallInfo): Call {
    let sub: Subscription | undefined;
    const call = new Call(info, {
      config: this.config,
      media: this.media!,
      catalog: this.catalog,
      record: this.record,
      findApp: this.findApp,
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
          void call.hangup("app_hangup");
          msg.respond(sc.encode(JSON.stringify({ type: "ack" })));
        }
      }
    });
    return call;
  }

  private async onIncoming(nodeId: string, event: MediaEvent) {
    const participant = event.participant as
      | { participantRef: string }
      | undefined;
    const roomRef = event.roomRef as string;
    const to = String(event.to ?? "");
    const info: CallInfo = {
      nodeId,
      roomRef,
      callRef: (event.callRef as string) ?? roomRef,
      callerRef: participant?.participantRef ?? "",
      direction: "inbound",
      from: String(event.from ?? ""),
      to,
      metadata: (event.metadata as Record<string, unknown>) ?? {}
    };
    const app = this.appForNumber(to);
    const call = this.newCall(info);
    if (!app) {
      call.record("event", { type: "call.unrouted", to });
      return call.hangup("error");
    }
    try {
      await call.run(app);
    } catch (e) {
      logger.error(`call ${info.callRef} failed: ${(e as Error).message}`);
      await call.hangup("error");
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
    const unsubscribe = this.media!.subscribeRoom(
      request.nodeId,
      request.roomRef,
      (event) => {
        if (event.type === "call.answered") {
          unsubscribe();
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
          void call.run(app).catch(() => call.hangup("error"));
        } else if (
          event.type === "call.progress" &&
          event.status !== "ringing"
        ) {
          unsubscribe();
          this.record.append(callRef, {
            at: Date.now(),
            source: "event",
            message: { type: "call.progress", status: event.status }
          });
          this.record.close(callRef);
        }
      }
    );
    return { type: "ack", callRef };
  }
}
