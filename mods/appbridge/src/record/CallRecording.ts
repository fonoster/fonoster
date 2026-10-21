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
import { Recorder } from "@fonoster/callrecord";
import { getLogger } from "@fonoster/logger";
import { RecordingPolicy } from "../config";

const logger = getLogger({ service: "appbridge", filePath: __filename });

/** How long to wait for the track ids of both sides before giving up on the recording. */
const TRACKS_TIMEOUT_MS = 3000;

/** The two sides of a call whose tracks the listeners fork. */
export type TrackRole = "caller" | "app";

type Host = {
  callRef: string;
  record(source: "event", message: Record<string, unknown>): void;
  /** AddListener on the call's control stream; resolves with the listener's ref. */
  addListener(
    listen: {
      trackId: number;
      rtp: { ip: string; port: number; codec?: string };
    }[]
  ): Promise<string>;
  removeListener?(listenerRef: string): Promise<void>;
  /** Where `recording.seconds` is counted (add-usage-metering). */
  usage?: { addMillis(key: { meter: "recording.seconds" }, ms: number): void };
};

/**
 * The platform's recording listener for one call (call-record "Recording is applied by policy",
 * design V8). It attaches through `AddListener` on the control stream with one unmixed RTP
 * stream per side (the caller's track and the app leg's track) straight to a Recorder, which
 * writes next to the working record. Apps cannot start or stop it: it follows the policy only.
 */
export class CallRecording {
  /** Each side's audio track id, from the node's ParticipantJoined events. */
  private readonly tracks = new Map<TrackRole, number>();
  private waiters: (() => void)[] = [];
  private recorder?: Recorder;
  private stopped = false;
  private recordingSince?: number;
  private listenerRef?: string;

  constructor(
    private readonly host: Host,
    private readonly dir: string | undefined,
    private readonly rtp: { host?: string; advertiseHost?: string } = {}
  ) {}

  /** Learns one side's track id (ParticipantJoined). */
  noteTrack(role: TrackRole, trackId: unknown) {
    if (typeof trackId !== "number" || !Number.isFinite(trackId)) return;
    this.tracks.set(role, trackId);
    for (const w of this.waiters.splice(0)) w();
  }

  /** One side's audio track id, once known (waits up to 3 s). */
  async trackOf(role: TrackRole): Promise<number | undefined> {
    const deadline = Date.now() + TRACKS_TIMEOUT_MS;
    while (!this.tracks.has(role) && !this.stopped) {
      const left = deadline - Date.now();
      if (left <= 0) break;
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, left);
        this.waiters.push(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
    return this.tracks.get(role);
  }

  /** Starts recording both sides; records why when it cannot. */
  async start(policy: RecordingPolicy) {
    if (policy === "off" || this.recorder || this.stopped) return;
    if (!this.dir) {
      this.host.record("event", {
        type: "recording.failed",
        reason: "no_storage"
      });
      return;
    }
    const caller = await this.trackOf("caller");
    const agent = await this.trackOf("app");
    if (this.stopped) return;
    if (caller === undefined || agent === undefined) {
      this.host.record("event", {
        type: "recording.failed",
        reason: "unknown_tracks"
      });
      return;
    }
    const recorder = new Recorder(this.dir);
    this.recorder = recorder;
    try {
      const rtp = await recorder.bind(
        this.rtp.host ?? "127.0.0.1",
        this.rtp.advertiseHost
      );
      const endpoint = (r: { host: string; port: number; codec?: string }) => ({
        ip: r.host,
        port: r.port,
        codec: r.codec
      });
      this.listenerRef = await this.host.addListener([
        { trackId: caller, rtp: endpoint(rtp.caller) },
        { trackId: agent, rtp: endpoint(rtp.agent) }
      ]);
      this.recordingSince = Date.now();
      this.host.record("event", {
        type: "recording.started",
        policy,
        listenerRef: this.listenerRef ?? null,
        tracks: { caller, agent }
      });
    } catch (e) {
      recorder.stop();
      logger.warn(
        `call ${this.host.callRef}: recording failed: ${(e as Error).message}`
      );
      this.host.record("event", {
        type: "recording.failed",
        reason: (e as { code?: string }).code ?? "error"
      });
    }
  }

  /** Stops and flushes the recording; must run before the record is closed. */
  stop() {
    this.stopped = true;
    if (this.recordingSince !== undefined)
      this.host.usage?.addMillis(
        { meter: "recording.seconds" },
        Date.now() - this.recordingSince
      );
    this.recordingSince = undefined;
    for (const w of this.waiters.splice(0)) w();
    this.recorder?.stop();
  }
}
