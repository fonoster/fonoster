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
import { AUDIBLE_RMS, FRAME_MS, FRAME_SAMPLES, rms, toneFrame } from "./rtp";
import {
  InviteSeen,
  RegisterSeen,
  SipCallOptions,
  SipCallStatus,
  SipSide,
  TrunkMode,
  TrunkOptions
} from "./sip";

// The SIP side for the fake node (redesign-roomr 11.6): the caller, the trunk and the registrar
// in memory, with the caller bot's observable behaviour (statuses, digits, what each leg heard,
// INVITEs and REGISTERs recorded, challenges counted). Calls carry 16 kHz frames to and from the
// fake node's mixer instead of RTP; the app legs and RTP participants stay real UDP.

/** The fake node's side of an INVITE a caller sends. */
export interface VirtualNode {
  invite(call: VCall, options: SipCallOptions): void;
}

/** One call, as the caller (placed to a node) or as the trunk (dialed by a node). */
export class VCall {
  readonly sip: number[] = [];
  state: "calling" | "answered" | "ended" = "calling";
  digits = "";
  codec?: string;
  requestUri?: string;
  headers?: Record<string, string>;
  muted = false;
  private heardFrames: { at: number; samples: Int16Array; audible: boolean }[] =
    [];
  private speech: Int16Array[] = [];
  /** The node's handlers for what this leg does (set when the node takes the call). */
  onBye?: () => void;
  onCancel?: () => void;
  onDtmf?: (digit: string) => void;

  constructor(
    readonly id: string,
    readonly role: "caller" | "trunk"
  ) {}

  status(): SipCallStatus {
    return {
      id: this.id,
      sip: [...this.sip],
      state: this.state,
      digits: this.digits,
      ...(this.codec ? { codec: this.codec } : {}),
      ...(this.requestUri ? { requestUri: this.requestUri } : {}),
      ...(this.headers ? { headers: this.headers } : {})
    };
  }

  // ---- the node's side ----------------------------------------------------------------

  /** A response from the node (provisional, 200 or final failure). */
  respond(status: number) {
    if (this.state === "ended") return;
    this.sip.push(status);
    if (status === 200) this.state = "answered";
    else if (status >= 300) this.state = "ended";
  }

  /** The node sent BYE. */
  bye() {
    this.state = "ended";
  }

  /** The next frame this leg sends, or undefined when it sends nothing (muted, not answered). */
  pull(): Int16Array | undefined {
    if (this.state !== "answered" || this.muted) return undefined;
    return this.speech.shift() ?? new Int16Array(FRAME_SAMPLES);
  }

  /** A frame of the room's mix for this leg. */
  push(samples: Int16Array) {
    if (this.state !== "answered") return;
    this.heardFrames.push({
      at: Date.now(),
      samples,
      audible: rms(samples) > AUDIBLE_RMS
    });
  }

  // ---- the caller's side --------------------------------------------------------------

  speak(hz: number, ms: number) {
    const n = Math.round(ms / FRAME_MS);
    this.speech = Array.from({ length: n }, (_, i) =>
      hz ? toneFrame(hz, i) : new Int16Array(FRAME_SAMPLES)
    );
  }

  heard(ms: number): Int16Array {
    const frames = this.heardFrames.slice(-Math.ceil(ms / FRAME_MS));
    const out = new Int16Array(frames.length * FRAME_SAMPLES);
    frames.forEach((f, i) =>
      out.set(f.samples.subarray(0, FRAME_SAMPLES), i * FRAME_SAMPLES)
    );
    return out;
  }

  audibleMsSince(since: number): number {
    return (
      this.heardFrames.filter((f) => f.at >= since && f.audible).length *
      FRAME_MS
    );
  }
}

/** A dial's outcome for the node: the answered leg, or the final SIP status. */
export type DialOutcome = { call?: VCall; status: number };

export type DialRequest = {
  uri: string;
  headers?: Record<string, string>;
  auth?: { username: string; password: string };
  from?: string;
  signal?: AbortSignal;
};

export type RegisterRequest = {
  aor: string;
  expires: string;
  headers: Record<string, string>;
  auth?: { username: string; password: string };
};

export class VirtualSip implements SipSide {
  readonly trunk = "sip:trunk.fake:5060";
  readonly registrar = "registrar.fake:5060";
  readonly nodes = new Map<string, VirtualNode>();
  private calls = new Map<string, VCall>();
  private seq = 0;
  private inSeq = 0;
  private mode: TrunkMode = "answer";
  private trunkOptions: TrunkOptions = {};
  private seenInvites: InviteSeen[] = [];
  private challenges = 0;
  private referTargets: string[] = [];
  private regAuth?: { username: string; password: string };
  private seenRegisters: RegisterSeen[] = [];
  private timers = new Set<ReturnType<typeof setTimeout>>();

  private get(id: string): VCall {
    const c = this.calls.get(id);
    if (!c) throw new Error(`no such call ${id}`);
    return c;
  }

  async call(target: string, options: SipCallOptions): Promise<string> {
    const node = this.nodes.get(target);
    const c = new VCall(`call-${++this.seq}`, "caller");
    this.calls.set(c.id, c);
    if (!node) {
      c.respond(503);
      return c.id;
    }
    node.invite(c, options);
    return c.id;
  }

  async status(id: string) {
    return this.get(id).status();
  }

  async trunkCalls() {
    return [...this.calls.values()]
      .filter((c) => c.role === "trunk")
      .map((c) => c.status());
  }

  async heard(id: string, ms: number) {
    return this.get(id).heard(ms);
  }

  async audibleMsSince(id: string, since: number) {
    return this.get(id).audibleMsSince(since);
  }

  async speak(id: string, hz: number, ms: number) {
    this.get(id).speak(hz, ms);
  }

  async dtmf(id: string, digits: string) {
    const c = this.get(id);
    for (const d of digits) c.onDtmf?.(d);
  }

  async hangup(id: string) {
    const c = this.get(id);
    if (c.state === "answered") {
      c.state = "ended";
      c.onBye?.();
    } else if (c.state === "calling") {
      c.sip.push(487);
      c.state = "ended";
      c.onCancel?.();
    }
  }

  async mute(id: string, muted: boolean) {
    this.get(id).muted = muted;
  }

  async trunkMode(mode: TrunkMode, options: TrunkOptions = {}) {
    this.mode = mode;
    this.trunkOptions = options;
  }

  async invites() {
    return [...this.seenInvites];
  }

  async challenged() {
    return this.challenges;
  }

  async refers() {
    return [...this.referTargets];
  }

  async registrarAuth(auth?: { username: string; password: string }) {
    this.regAuth = auth?.password ? auth : undefined;
  }

  async registers() {
    return [...this.seenRegisters];
  }

  async stop() {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
  }

  // ---- what the fake node does on the SIP side ------------------------------------------

  /**
   * A node dials through the trunk: the INVITE is recorded, challenged when the trunk requires
   * auth (the node answers the challenge with `auth`), then answered or refused as the trunk's
   * mode says. `no_answer` rings until the dial is aborted.
   */
  dial(req: DialRequest): Promise<DialOutcome> {
    const required = this.trunkOptions.auth;
    this.seenInvites.push({
      requestUri: req.uri,
      headers: Object.fromEntries(
        Object.entries(req.headers ?? {}).filter(([k]) => /^x-/i.test(k))
      ),
      ...(req.from ? { from: req.from } : {}),
      authorized: !!req.auth
    });
    if (required?.password) {
      // The first INVITE carries no credentials and is challenged; the node re-sends it with them.
      const ok =
        req.auth?.username === required.username &&
        req.auth?.password === required.password;
      if (!ok) {
        this.challenges++;
        return Promise.resolve({
          status: this.trunkOptions.challenge === 407 ? 407 : 401
        });
      }
    }
    return new Promise((resolve) => {
      if (req.signal?.aborted) return resolve({ status: 487 });
      const t = setTimeout(() => {
        this.timers.delete(t);
        switch (this.mode) {
          case "busy":
            return resolve({ status: 486 });
          case "unavailable":
            return resolve({ status: 480 });
          case "decline":
            return resolve({ status: 603 });
          case "no_answer":
            return; // rings until aborted
          default: {
            const c = new VCall(`in-${++this.inSeq}`, "trunk");
            c.requestUri = req.uri;
            c.headers = Object.fromEntries(
              Object.entries(req.headers ?? {}).filter(([k]) => /^x-/i.test(k))
            );
            c.respond(200);
            this.calls.set(c.id, c);
            resolve({ call: c, status: 200 });
          }
        }
      }, this.trunkOptions.afterMs ?? 20);
      this.timers.add(t);
      req.signal?.addEventListener("abort", () => {
        clearTimeout(t);
        this.timers.delete(t);
        resolve({ status: 487 });
      });
    });
  }

  /** A REFER on a call's leg: accepted (202). */
  refer(target: string): boolean {
    this.referTargets.push(target);
    return true;
  }

  /** A REGISTER: recorded; challenged when the registrar requires auth. True when accepted. */
  register(req: RegisterRequest): boolean {
    const entry = { expires: req.expires, headers: { ...req.headers } };
    const required = this.regAuth;
    if (required) {
      this.seenRegisters.push({ ...entry, challenged: true });
      if (
        req.auth?.username !== required.username ||
        req.auth?.password !== required.password
      )
        return false;
    }
    this.seenRegisters.push(entry);
    return true;
  }
}
