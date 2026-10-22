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
import { startProcess, stopProcess } from "../fakes/RoomrProcess";
import { FRAME_MS, FRAME_SAMPLES } from "./rtp";

// The SIP side of the Roomr suite, one interface for both nodes: the caller (places calls to a
// node, speaks tones, presses keys, goes silent, hangs up), the fake trunk/proxy the node dials
// through (records each Request-URI and its headers; answers 200, 486, 480, 603, a 401 or 407
// challenge, or nothing, on cue; accepts REFER) and the fake registrar (records each REGISTER;
// can require digest auth). Against the Go node it is the caller bot (go/roomr/cmd/sipcaller)
// over real SIP and RTP; against the fake node, VirtualSip plays the same parts in memory.

export type SipCallOptions = {
  to?: string;
  from?: string;
  headers?: Record<string, string>;
  /** Codecs offered, in order ("PCMU/8000", "opus/48000", "GSM/8000", ...); default PCMU. */
  codecs?: string[];
};

export type SipCallStatus = {
  id: string;
  /** SIP statuses received (100 Trying left out). */
  sip: number[];
  state: "calling" | "answered" | "ended";
  digits?: string;
  codec?: string;
  /** The call's media is SRTP. */
  secure?: boolean;
  /** Calls the trunk answered: the INVITE's Request-URI and X- headers. */
  requestUri?: string;
  headers?: Record<string, string>;
};

export type InviteSeen = {
  requestUri: string;
  headers: Record<string, string>;
  from?: string;
  authorized?: boolean;
};

export type RegisterSeen = {
  expires: string;
  headers: Record<string, string>;
  challenged?: boolean;
};

/** How the trunk answers what a node dials. */
export type TrunkMode =
  "answer" | "busy" | "no_answer" | "unavailable" | "decline";

export type TrunkOptions = {
  afterMs?: number;
  /** Challenge every INVITE until it carries these credentials. */
  auth?: { username: string; password: string };
  /** 401 (default) or 407. */
  challenge?: number;
};

export interface SipSide {
  /** The trunk's address as a SIP URI, for `to.proxy` and the node's outbound proxy. */
  readonly trunk: string;
  /** The registrar's address (registrations[].registrar). */
  readonly registrar: string;
  /** Places a call to the node at `target` (its SIP address); resolves with the call's id. */
  call(target: string, options: SipCallOptions): Promise<string>;
  status(id: string): Promise<SipCallStatus>;
  /** Every call the trunk answered, oldest first. */
  trunkCalls(): Promise<SipCallStatus[]>;
  /** What call `id` heard in the last `ms` milliseconds, 16 kHz linear. */
  heard(id: string, ms: number): Promise<Int16Array>;
  /** ms of audible audio call `id` heard since `since` (unix ms). */
  audibleMsSince(id: string, since: number): Promise<number>;
  /** Speaks a tone at `hz` (0: silence) for `ms`. */
  speak(id: string, hz: number, ms: number): Promise<void>;
  dtmf(id: string, digits: string): Promise<void>;
  /** BYE when answered, CANCEL while calling. */
  hangup(id: string): Promise<void>;
  /** Sends no RTP at all while muted. */
  mute(id: string, muted: boolean): Promise<void>;
  trunkMode(mode: TrunkMode, options?: TrunkOptions): Promise<void>;
  invites(): Promise<InviteSeen[]>;
  challenged(): Promise<number>;
  refers(): Promise<string[]>;
  registrarAuth(auth?: { username: string; password: string }): Promise<void>;
  registers(): Promise<RegisterSeen[]>;
  stop(): Promise<void>;
}

/** The caller bot process as the SIP side (Go node). */
export class SipBot implements SipSide {
  trunk = "";
  registrar = "";
  private child?: ChildProcess;
  private url = "";

  constructor(private readonly bin: string) {}

  async start(): Promise<this> {
    const { child, line } = await startProcess(this.bin, [], /^listening /);
    this.child = child;
    this.url = `http://${line.split(" ")[1]}`;
    const { address } = await this.api<{ address: string }>("GET", "/sip");
    this.trunk = `sip:${address}`;
    this.registrar = address;
    return this;
  }

  private async api<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.url}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`caller bot ${path}: ${res.status}`);
    if (res.status === 204) return undefined as T;
    const type = res.headers.get("content-type") ?? "";
    return (
      type.includes("json") ? await res.json() : await res.arrayBuffer()
    ) as T;
  }

  async call(target: string, options: SipCallOptions): Promise<string> {
    const status = await this.api<SipCallStatus>("POST", "/calls", {
      target,
      to: options.to ?? "+15550002222",
      from: options.from,
      headers: options.headers ?? {},
      codecs: options.codecs
    });
    return status.id;
  }

  async status(id: string): Promise<SipCallStatus> {
    const s = await this.api<SipCallStatus>("GET", `/calls/${id}`);
    return { ...s, sip: (s.sip ?? []).filter((c) => c !== 100) };
  }

  async trunkCalls(): Promise<SipCallStatus[]> {
    const { calls } = await this.api<{ calls: SipCallStatus[] }>(
      "GET",
      "/calls"
    );
    return calls
      .filter((c) => c.id.startsWith("in-"))
      .sort((a, b) => Number(a.id.slice(3)) - Number(b.id.slice(3)));
  }

  async heard(id: string, ms: number): Promise<Int16Array> {
    const raw = Buffer.from(
      await this.api<ArrayBuffer>("GET", `/calls/${id}/heard`)
    );
    const all = new Int16Array(Math.floor(raw.length / 2));
    for (let i = 0; i < all.length; i++) all[i] = raw.readInt16LE(i * 2);
    const want = Math.ceil(ms / FRAME_MS) * FRAME_SAMPLES;
    return all.subarray(Math.max(0, all.length - want));
  }

  async audibleMsSince(id: string, since: number): Promise<number> {
    const s = await this.api<{ audibleMsSince: number }>(
      "GET",
      `/calls/${id}?since=${since}`
    );
    return s.audibleMsSince;
  }

  async speak(id: string, hz: number, ms: number) {
    await this.api("POST", `/calls/${id}/audio`, {
      kind: hz ? `tone:${hz}` : "silence",
      ms
    });
  }

  async dtmf(id: string, digits: string) {
    await this.api("POST", `/calls/${id}/dtmf`, { digits, mode: "rfc4733" });
  }

  async hangup(id: string) {
    await this.api("POST", `/calls/${id}/hangup`, {});
  }

  async mute(id: string, muted: boolean) {
    await this.api("POST", `/calls/${id}/mute`, { muted });
  }

  async trunkMode(mode: TrunkMode, options: TrunkOptions = {}) {
    await this.api("POST", "/callee", {
      mode,
      afterMs: options.afterMs ?? 20,
      ...(options.auth ?? {}),
      challenge: options.challenge ?? 0
    });
  }

  async invites(): Promise<InviteSeen[]> {
    return (
      (await this.api<{ invites: InviteSeen[] }>("GET", "/invites")).invites ??
      []
    );
  }

  async challenged(): Promise<number> {
    return (await this.api<{ challenged: number }>("GET", "/invites"))
      .challenged;
  }

  async refers(): Promise<string[]> {
    return (await this.api<{ refers: string[] }>("GET", "/calls")).refers ?? [];
  }

  async registrarAuth(auth?: { username: string; password: string }) {
    await this.api("POST", "/registrar", auth ?? {});
  }

  async registers(): Promise<RegisterSeen[]> {
    return (
      (await this.api<{ registers: RegisterSeen[] }>("GET", "/registers"))
        .registers ?? []
    );
  }

  async stop() {
    if (this.child) await stopProcess(this.child);
  }
}
