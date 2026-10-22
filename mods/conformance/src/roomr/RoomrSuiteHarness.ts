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
import { Roomr } from "@fonoster/common";
import { NatsConnection, StringCodec, Subscription } from "nats";
import { Harness } from "../runner/Harness";
import { FrameLog, Peer } from "../runner/Peer";
import {
  AppAction,
  CallerAction,
  NatsAction,
  NodeAction,
  RoomrSetup,
  RpcAction,
  RtpAction,
  Setup,
  TrunkAction
} from "../scenario/types";
import {
  FakeController,
  ROOMR_METHODS,
  RoomrMethod,
  RpcResult
} from "./FakeController";
import { FakeSessionEndpoint } from "./FakeSessionEndpoint";
import { NodeDriver, StartedNode } from "./GoNodeDriver";
import { MixParty, tonesHeard } from "./mixMinus";
import { NatsFaultProxy } from "./NatsFaultProxy";
import { NodeOverrides, SUITE_DEFAULTS } from "./nodeConfig";
import { RtpParty, toneWav } from "./rtp";

// The Roomr suite's harness (redesign-roomr 11.2): runs the `media-control` scenario files
// against a Roomr node, the Go node or the fake one (NodeDriver), with nothing else around it:
// the caller, trunk and registrar (SipSide), the fake session endpoint (the app side of every
// control stream, with real RTP app legs), the fake controller (Roomr client over every node),
// RTP participants and listener sinks (rtp_a .. rtp_d), a local HTTP server for hold music, and
// a fault proxy between the nodes and NATS. The runner's peer sees, in arrival order, the
// node's NATS events and heartbeats (as published) and every control-stream message from the
// node (`stream.start`, `stream.dtmf`, `stream.participant_joined`, ..., `stream.ended`,
// `stream.closed`). Measurements (`assert`) observe the node from outside: what the caller,
// the app leg, the trunk, the registrar and the RTP parties heard and saw.

const sc = StringCodec();

const PARTIES = ["a", "b", "c", "d"] as const;

/** Tone of a caller that spoke without naming one (the caller bot's default). */
const DEFAULT_TONE = 440;
/** The hold music's tone. */
const HOLD_TONE = 700;

/** The runner's peer: NATS events, heartbeats and control-stream messages, in arrival order. */
export class RoomrPeer implements Peer {
  readonly frames = new FrameLog();

  push(data: Record<string, unknown>) {
    this.frames.push({ kind: "json", at: Date.now(), data });
  }

  /**
   * Each source keeps its own order but sources interleave freely, so `expect` keeps one cursor
   * per channel: the control streams, the heartbeat subject and the event subjects.
   */
  channel(data: Record<string, unknown>): string {
    const type = String(data.type ?? "");
    if (type.startsWith("stream.")) return "stream";
    if (type === "node.heartbeat" || type === "node.down") return "heartbeat";
    return "nats";
  }

  sendJson(): void {
    throw new Error(
      "the Roomr suite sends with rpc, app, caller and trunk steps"
    );
  }

  sendBinary(): void {
    throw new Error("audio is RTP: use caller, app and rtp steps");
  }

  close() {
    this.frames.markClosed();
  }
}

type CallerCall = { id: string; hz?: number };

export class RoomrSuiteHarness implements Harness {
  readonly endpoint = new FakeSessionEndpoint();
  readonly controller: FakeController;
  readonly proxy: NatsFaultProxy;
  readonly parties = new Map<string, RtpParty & { hz?: number }>();
  nodes: StartedNode[] = [];
  private peer?: RoomrPeer;
  private sub?: Subscription;
  private media?: http.Server;
  private mediaUrl = "";
  private setupDone?: RoomrSetup;
  private callers = new Map<string, CallerCall>();
  private lastCaller?: string;
  private appHz?: number;
  private secrets = new Set<string>();
  private rpcLog: unknown[] = [];

  constructor(
    readonly driver: NodeDriver,
    private readonly nc: NatsConnection,
    natsUrl: string
  ) {
    this.proxy = new NatsFaultProxy(natsUrl);
    this.controller = new FakeController(() => this.nodes);
  }

  /** Starts everything but the nodes (they start on connect, after the scenario's setup). */
  async start(): Promise<this> {
    await this.proxy.start();
    await this.endpoint.start();
    await this.driver.prepare();
    for (const name of PARTIES)
      this.parties.set(name, await new RtpParty().bind());
    const wav = toneWav(HOLD_TONE, 2000);
    this.media = http.createServer((req, res) => {
      if (req.url === "/hold.wav") {
        res.writeHead(200, { "Content-Type": "audio/wav" });
        return res.end(wav);
      }
      res.writeHead(404).end();
    });
    await new Promise<void>((r) =>
      this.media!.listen(0, "127.0.0.1", () => r())
    );
    this.mediaUrl = `http://127.0.0.1:${(this.media.address() as { port: number }).port}`;
    return this;
  }

  vars(): Record<string, unknown> {
    const vars: Record<string, unknown> = {
      trunk: this.driver.sip.trunk,
      media: this.mediaUrl,
      session: this.endpoint.address,
      node_kind: this.driver.kind
    };
    for (const [name, p] of this.parties) vars[`rtp_${name}`] = p.endpoint();
    return vars;
  }

  async setup(setup: Setup) {
    this.setupDone = setup.roomr ?? {};
    const s = this.setupDone;
    if (s.app) await this.appStep(s.app);
    if (s.trunk) await this.trunkStep(s.trunk);
    if (s.registrar) await this.driver.sip.registrarAuth(s.registrar);
    if (s.trunk?.auth?.password) this.secrets.add(s.trunk.auth.password);
  }

  /** Subscribes to the nodes' subjects, then starts the nodes and waits for their heartbeats. */
  async connect(): Promise<RoomrPeer> {
    const peer = (this.peer = new RoomrPeer());
    const refs = new Set<string>();
    this.sub = this.nc.subscribe("roomr.>", {
      callback: (err, msg) => {
        if (err) return;
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(sc.decode(msg.data));
        } catch {
          return;
        }
        if (!refs.has(String(data.node_ref ?? ""))) return;
        if (msg.subject.endsWith(".heartbeat")) this.controller.heartbeat(data);
        peer.push(data);
      }
    });
    await this.nc.flush();
    this.endpoint.on(
      "frame",
      (f: { type: string; data: Record<string, unknown> }) =>
        peer.push({ type: f.type, ...f.data })
    );
    const s = this.setupDone ?? {};
    const count = s.nodes ?? 1;
    for (let i = 0; i < count; i++) {
      const overrides: NodeOverrides = {
        ...SUITE_DEFAULTS,
        ...(s.config ?? {}),
        ...(s.node_config?.[i] ?? {})
      };
      for (const r of overrides.registrations ?? [])
        if (r.auth?.password) this.secrets.add(r.auth.password);
      const node = await this.driver.start(i, overrides, {
        natsUrl: this.proxy.url,
        sessionEndpoint: this.endpoint.address
      });
      refs.add(node.nodeRef);
      this.nodes[i] = node;
    }
    const deadline = Date.now() + 5000;
    while (
      this.controller.eligible().length < this.nodes.length &&
      Date.now() < deadline
    )
      await new Promise((r) => setTimeout(r, 25));
    return peer;
  }

  async stop() {
    this.sub?.unsubscribe();
    this.controller.close();
    await this.driver.stop();
    await this.endpoint.stop();
    await this.proxy.stop();
    for (const p of this.parties.values()) p.close();
    const media = this.media;
    if (media) await new Promise<void>((r) => media.close(() => r()));
  }

  // ---- steps ------------------------------------------------------------------------------

  private callId(name?: string): string {
    const key = name ?? this.lastCaller;
    const c = key ? this.callers.get(key) : undefined;
    if (!c) throw new Error(`no caller call${name ? ` named ${name}` : ""}`);
    return c.id;
  }

  async caller(action: CallerAction) {
    const sip = this.driver.sip;
    if (action.call) {
      const call = action.call;
      const node = this.nodes[call.node ?? 0];
      if (!node) throw new Error(`no node ${call.node ?? 0}`);
      const headers: Record<string, string> = { ...(call.headers ?? {}) };
      if (call.appRef) headers["X-App-Ref"] = call.appRef;
      if (call.callRef) headers["X-Call-Ref"] = call.callRef;
      const id = await sip.call(node.sipAddr, {
        to: call.to,
        from: call.from,
        headers,
        codecs: call.codecs
      });
      const name = call.name ?? "caller";
      this.callers.set(name, { id });
      this.lastCaller = name;
    }
    const target = action.name;
    if (action.audio) {
      const hz =
        action.audio.kind === "silence" ? 0 : (action.audio.hz ?? DEFAULT_TONE);
      const c = this.callers.get(target ?? this.lastCaller ?? "");
      if (c && hz) c.hz = hz;
      await sip.speak(this.callId(target), hz, action.audio.ms ?? 500);
    }
    if (action.dtmf) await sip.dtmf(this.callId(target), action.dtmf);
    if (action.mute !== undefined)
      await sip.mute(this.callId(target), action.mute);
    if (action.hangup) await sip.hangup(this.callId(target));
    if (action.nodeCrash) this.driver.kill(0);
    if (action.drop)
      throw new Error("drop is a voice-session fake-node action");
  }

  async rpc(action: RpcAction): Promise<RpcResult> {
    const request = action.request ?? {};
    const to = request.to as { auth?: { password?: string } } | undefined;
    if (to?.auth?.password) this.secrets.add(to.auth.password);
    let result: RpcResult;
    if (action.method === "place") {
      result = await this.controller.place(request, action.order);
    } else {
      if (!(ROOMR_METHODS as readonly string[]).includes(action.method))
        throw new Error(`unknown Roomr method ${action.method}`);
      result = await this.controller.call(
        action.node ?? 0,
        action.method as RoomrMethod,
        request
      );
    }
    this.rpcLog.push(result);
    // An RTP participant the harness plays: start sending to the node's side of its leg.
    const rtp = request.rtp as { port?: number } | undefined;
    const reply = result.ok
      ? (result.reply?.rtp as { ip?: string; port?: number } | undefined)
      : undefined;
    if (rtp?.port && reply?.ip && reply.port)
      for (const p of this.parties.values())
        if (p.port === rtp.port) p.start({ ip: reply.ip, port: reply.port });
    return result;
  }

  async appStep(action: AppAction) {
    const e = this.endpoint;
    if (action.sip_status !== undefined)
      e.configure({ sipStatus: action.sip_status });
    if (action.answer_after_ms !== undefined)
      e.configure({ answerAfterMs: action.answer_after_ms });
    if (action.max_duration_s !== undefined)
      e.configure({ maxDurationS: action.max_duration_s });
    if (action.mode) await e.setMode(action.mode);
    if (action.kill) return e.kill();
    const stream = () => {
      const s = e.stream(action.call_ref);
      if (!s) throw new Error("no control stream");
      return s;
    };
    if (action.answer)
      await stream().answer({ maxDurationS: e.options.maxDurationS });
    if (action.send) stream().send(action.send);
    if (action.audio) {
      const hz =
        action.audio.kind === "silence" ? 0 : (action.audio.hz ?? DEFAULT_TONE);
      if (hz) this.appHz = hz;
      stream().appLeg.play(hz, action.audio.ms ?? 500);
    }
    if (action.mute !== undefined) stream().appLeg.muted = action.mute;
  }

  async trunkStep(action: TrunkAction) {
    await this.driver.sip.trunkMode(action.mode ?? "answer", {
      afterMs: action.after_ms,
      auth: action.auth,
      challenge: action.challenge
    });
    if (action.auth?.password) this.secrets.add(action.auth.password);
  }

  natsStep(action: NatsAction) {
    if (action.drop === "connection") this.proxy.dropConnection();
    if (action.drop === "messages") this.proxy.dropMessages(action.prefix);
    if (action.restore) this.proxy.restore();
  }

  nodeStep(action: NodeAction) {
    const i = action.index ?? 0;
    if (action.kill) this.driver.kill(i);
    if (action.sigterm) this.driver.sigterm(i);
  }

  rtpStep(action: RtpAction) {
    const p = this.parties.get(action.name);
    if (!p) throw new Error(`no RTP party ${action.name}`);
    if (action.audio) {
      const hz =
        action.audio.kind === "silence" ? 0 : (action.audio.hz ?? DEFAULT_TONE);
      if (hz) p.hz = hz;
      p.play(hz, action.audio.ms ?? 500);
    }
    if (action.mute !== undefined) p.muted = action.mute;
  }

  // ---- measurements -----------------------------------------------------------------------

  /**
   * Whether the caller is on hold, observed on the node: while the caller speaks a tone and the
   * app sends silence, the app leg hears (almost) nothing. `audio` also reports what the caller
   * heard meanwhile (its hold music).
   */
  private async holdProbe(): Promise<{ held: boolean; holdAudioMs: number }> {
    const id = this.callId();
    const stream = this.endpoint.stream();
    if (!stream) throw new Error("no control stream to probe hold with");
    const t0 = Date.now();
    await this.driver.sip.speak(id, DEFAULT_TONE, 700);
    await new Promise((r) => setTimeout(r, 800));
    const from = t0 + 150;
    const appHeard = stream.appLeg.audibleMsSince(from);
    const callerHeard = await this.driver.sip.audibleMsSince(id, from);
    return { held: appHeard < 100, holdAudioMs: callerHeard };
  }

  private async mix(since: number): Promise<Record<string, string[]>> {
    const window = Date.now() - since;
    const parties: MixParty[] = [];
    for (const [name, c] of this.callers)
      parties.push({
        name,
        hz: c.hz,
        heard: await this.driver.sip.heard(c.id, window)
      });
    for (const [name, p] of this.parties)
      if (p.remote || p.heard.length)
        parties.push({
          name,
          hz: p.remote ? p.hz : undefined,
          heard: p.pcmBetween(since)
        });
    const s = this.endpoint.stream();
    if (s?.answered)
      parties.push({
        name: "app",
        hz: this.appHz,
        heard: s.appLeg.pcmBetween(since)
      });
    return tonesHeard(parties);
  }

  private leaked(): boolean {
    if (!this.secrets.size) return false;
    const texts = [
      ...(this.peer?.frames.items ?? []).map((f) => JSON.stringify(f.data)),
      ...this.rpcLog.map((r) => JSON.stringify(r)),
      ...this.nodes.map((_, i) => this.driver.output(i))
    ];
    return texts.some((t) => [...this.secrets].some((s) => t.includes(s)));
  }

  async measure(name: string, since: number): Promise<unknown> {
    const sip = this.driver.sip;
    const call = async () => sip.status(this.callId());
    const lastTrunk = async () => (await sip.trunkCalls()).slice(-1)[0];
    const health = async (i: number) =>
      this.driver.alive(i) &&
      (await Roomr.checkGrpcHealth(this.nodes[i].controlAddr, 1000))
        ? "SERVING"
        : this.driver.alive(i)
          ? "NOT_SERVING"
          : "DOWN";
    const named = /^caller\.(\w+)\.(sip|state|digits|codec|heard_ms)$/.exec(
      name
    );
    if (named) {
      const id = this.callId(named[1]);
      if (named[2] === "heard_ms") return sip.audibleMsSince(id, since);
      const s = await sip.status(id);
      return (s as Record<string, unknown>)[named[2]] ?? "";
    }
    const party = /^rtp\.(\w+)\.heard_ms$/.exec(name);
    if (party) return this.parties.get(party[1])?.audibleMsSince(since);
    const heartbeats = (i: number) =>
      (this.peer?.frames.items ?? []).filter(
        (f) =>
          f.kind === "json" &&
          f.at >= since &&
          f.data.type === "node.heartbeat" &&
          f.data.node_ref === this.nodes[i]?.nodeRef
      ).length;
    const node = /^node\.(\d+)\.(health|alive|files|heartbeats)$/.exec(name);
    if (node) {
      const i = Number(node[1]);
      if (node[2] === "health") return health(i);
      if (node[2] === "alive") return this.driver.alive(i);
      if (node[2] === "heartbeats") return heartbeats(i);
      return this.driver.files(i);
    }
    switch (name) {
      case "caller.sip":
      case "media.sip":
        return (await call()).sip;
      case "caller.state":
        return (await call()).state;
      case "caller.digits":
        return (await call()).digits ?? "";
      case "caller.codec":
        return (await call()).codec ?? "";
      case "caller.secure":
        return (await call()).secure ?? false;
      case "caller.heard_ms":
        return sip.audibleMsSince(this.callId(), since);
      case "app.heard_ms":
        return this.endpoint.stream()?.appLeg.audibleMsSince(since) ?? 0;
      case "app.streams":
        return this.endpoint.streams.length;
      case "media.held":
        return (await this.holdProbe()).held;
      case "media.hold_audio_ms":
        return (await this.holdProbe()).holdAudioMs;
      case "mix":
        return this.mix(since);
      case "trunk.invites":
        return sip.invites();
      case "trunk.challenged":
        return sip.challenged();
      case "trunk.refers":
        return sip.refers();
      case "trunk.calls":
        return sip.trunkCalls();
      case "trunk.state":
        return (await lastTrunk())?.state ?? "none";
      case "trunk.heard_ms": {
        const t = await lastTrunk();
        return t ? sip.audibleMsSince(t.id, since) : 0;
      }
      case "registrar.registers":
        return sip.registers();
      case "node.health":
        return health(0);
      case "node.alive":
        return this.driver.alive(0);
      case "node.files":
        return this.driver.files(0);
      case "heartbeats":
        return heartbeats(0);
      case "secrets.leaked":
        return this.leaked();
      case "controller.attempts":
        return this.controller.attempts;
      case "nats.dropped":
        return this.proxy.dropped;
      default:
        return undefined;
    }
  }
}
