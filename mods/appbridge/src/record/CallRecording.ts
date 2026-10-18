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

const logger = getLogger({ service: "gateway", filePath: __filename });

/** How long to wait for the track ids of both sides before giving up on the recording. */
const TRACKS_TIMEOUT_MS = 3000;

type Host = {
  callRef: string;
  record(source: "event", message: Record<string, unknown>): void;
  mediaCommand(command: {
    type: string;
    [k: string]: unknown;
  }): Promise<Record<string, unknown>>;
};

/**
 * The platform's recording listener for one call (call-record "Recording is applied by policy",
 * design V8). It attaches through media-control `listener.attach` with one unmixed RTP stream per
 * side (the caller's track and the session participant's track) straight to a Recorder, which
 * writes next to the working record. Apps cannot start or stop it: it follows the policy only.
 */
export class CallRecording {
  /** participantRef → its audio track id, from call.incoming and participant.joined. */
  private readonly tracks = new Map<string, number>();
  private waiters: (() => void)[] = [];
  private recorder?: Recorder;
  private stopped = false;
  private listenerRef?: string;

  constructor(
    private readonly host: Host,
    private readonly dir: string | undefined,
    private readonly rtp: { host?: string; advertiseHost?: string } = {}
  ) {}

  /** Learns a participant's track ids (call.incoming's participant, participant.joined). */
  noteTracks(participantRef: unknown, tracks: unknown) {
    if (typeof participantRef !== "string" || !Array.isArray(tracks)) return;
    const audio = (tracks as { trackId?: number; kind?: string }[]).find(
      (t) => typeof t.trackId === "number" && (t.kind ?? "audio") === "audio"
    );
    if (!audio) return;
    this.tracks.set(participantRef, audio.trackId!);
    for (const w of this.waiters.splice(0)) w();
  }

  /** A participant's audio track id, once known (waits up to 3 s). */
  async trackOf(participantRef: string): Promise<number | undefined> {
    const deadline = Date.now() + TRACKS_TIMEOUT_MS;
    while (!this.tracks.has(participantRef) && !this.stopped) {
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
    return this.tracks.get(participantRef);
  }

  /** Starts recording both sides; records why when it cannot. */
  async start(
    policy: RecordingPolicy,
    callerRef: string,
    sessionParticipantRef: string
  ) {
    if (policy === "off" || this.recorder || this.stopped) return;
    if (!this.dir) {
      this.host.record("event", {
        type: "recording.failed",
        reason: "no_storage"
      });
      return;
    }
    const caller = await this.trackOf(callerRef);
    const agent = await this.trackOf(sessionParticipantRef);
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
      const ack = await this.host.mediaCommand({
        type: "listener.attach",
        tracks: [
          { trackId: caller, rtp: rtp.caller },
          { trackId: agent, rtp: rtp.agent }
        ]
      });
      this.listenerRef = ack.listenerRef as string | undefined;
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
    for (const w of this.waiters.splice(0)) w();
    this.recorder?.stop();
  }
}
