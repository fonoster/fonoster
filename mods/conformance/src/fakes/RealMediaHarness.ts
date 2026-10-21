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
import { NatsConnection } from "nats";
import { Peer } from "../runner/Peer";
import { SCENARIOS_DIR } from "../scenario/loadScenario";
import { AudioSource, CallerAction, Setup } from "../scenario/types";
import { FakesHarness, FakesHarnessOptions } from "./FakesHarness";
import { RoomrBinaries, RoomrProcess } from "./RoomrProcess";

/**
 * AppBridge's fakes (app, providers) with a real Roomr node and a SIP caller bot instead of the
 * fake Roomr node: voice-session scenarios then cross real SIP, RTP and media-control.
 */
export class RealMediaHarness extends FakesHarness {
  private dialOutcome?: "answered" | "busy" | "no_answer" | "failed";
  private appRef?: string;
  readonly media: RoomrProcess;
  private callerAudio?: AudioSource;
  private commands: Record<string, unknown>[] = [];

  constructor(
    private readonly nc: NatsConnection,
    bins: RoomrBinaries,
    options: FakesHarnessOptions = {}
  ) {
    super(options);
    this.media = new RoomrProcess(bins);
  }

  /**
   * The AppBridge under test's session endpoint: the node opens each call's control stream there.
   * Set before the first call (the node starts with it).
   */
  set sessionEndpoint(endpoint: string) {
    this.media.sessionEndpoint = endpoint;
  }

  /**
   * AppBridge's control-stream tap (AppBridgeOptions.tap): every message it sends becomes one of
   * media.commands as `{ type, ...body }`, and hold state follows them.
   */
  readonly tap = (
    _callRef: string,
    direction: "in" | "out",
    type: string,
    message: Record<string, unknown>
  ) => {
    const body = (message[type] ?? message) as Record<string, unknown>;
    if (direction === "out") this.commands.push({ type, ...body });
    this.media.noteStreamMessage(type, body);
  };

  async stop() {
    await Promise.all([super.stop(), this.media.stop()]);
  }

  async setup(setup: Setup) {
    this.dialOutcome = setup.media?.dialOutcome;
    this.appRef = setup.media?.appRef;
    this.callerAudio = setup.callerAudio;
    if (setup.media?.heartbeatMs !== undefined)
      this.media.heartbeatMs = setup.media.heartbeatMs;
    this.media.maxRooms = setup.media?.maxRooms;
    await super.setup({ ...setup, callerAudio: undefined, media: undefined });
  }

  /**
   * Starts the node (after setup, so its options apply), places the call and returns once the
   * caller is answered: a real caller cannot send audio, keys or BYE before that.
   */
  async offerCallAndAccept(
    timeoutMs = 5000,
    options: { codecs?: string[]; callRef?: string } = {}
  ): Promise<Peer> {
    await this.media.start();
    if (this.dialOutcome) await this.media.callee(this.dialOutcome);
    const mark = this.connectionMark();
    await this.media.call({
      appRef: this.appRef ?? "app-1",
      to: this.call?.to,
      from: this.call?.from,
      ...(options.codecs ? { codecs: options.codecs } : {}),
      ...(options.callRef ? { callRef: options.callRef } : {})
    });
    const peer = await this.acceptSession(mark, timeoutMs);
    if (this.reachesNoApp) return peer;
    const deadline = Date.now() + timeoutMs;
    while ((await this.media.status()).state !== "answered") {
      if (Date.now() > deadline)
        throw new Error("the caller was never answered");
      await new Promise((r) => setTimeout(r, 10));
    }
    if (this.callerAudio) await this.say(this.callerAudio);
    return peer;
  }

  /** The bot speaks a tone (or silence) as long as the source; recordings become tones. */
  private say(source: AudioSource) {
    let ms = source.ms ?? 0;
    if (source.kind === "file" && source.file && !ms) {
      const file = path.isAbsolute(source.file)
        ? source.file
        : path.join(SCENARIOS_DIR, source.file);
      ms = Math.round(fs.statSync(file).size / 32);
    }
    return this.media.speak(
      source.kind === "silence" ? "silence" : "tone",
      ms || 500
    );
  }

  async caller(action: CallerAction) {
    if (action.dtmf) await this.media.dtmf(action.dtmf);
    if (action.audio) await this.say(action.audio);
    if (action.hangup) await this.media.hangup();
    if (action.nodeCrash) this.media.crash();
    if (action.drop) throw new Error("drop is a fake-node action");
  }

  async measure(name: string, since: number): Promise<unknown> {
    switch (name) {
      case "media.output_audio_ms":
        return (await this.media.status(since)).audibleMsSince;
      case "media.output_silent_within_ms":
        return (await this.media.status(since)).lastAudibleAfterMs;
      case "media.commands":
        return this.commands;
      case "media.sip":
        return this.media.sip();
      case "media.held":
        return this.media.held();
      default:
        return super.measure(name, since);
    }
  }
}
