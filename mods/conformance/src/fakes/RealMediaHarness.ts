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
import { NatsConnection, StringCodec, Subscription } from "nats";
import { Peer } from "../runner/Peer";
import { SCENARIOS_DIR } from "../scenario/loadScenario";
import { AudioSource, CallerAction, Setup } from "../scenario/types";
import { FakesHarness, FakesHarnessOptions } from "./FakesHarness";
import { MediaNodeBinaries, MediaNodeProcess } from "./MediaNodeProcess";

/**
 * The gateway's fakes (app, providers) with a real media node and a SIP caller bot instead of the
 * fake media node: voice-session scenarios then cross real SIP, RTP and media-control.
 */
export class RealMediaHarness extends FakesHarness {
  private dialOutcome?: "answered" | "busy" | "no_answer" | "failed";
  readonly media: MediaNodeProcess;
  private callerAudio?: AudioSource;
  private commands: Record<string, unknown>[] = [];
  private sub?: Subscription;

  constructor(
    private readonly nc: NatsConnection,
    bins: MediaNodeBinaries,
    options: FakesHarnessOptions = {}
  ) {
    super(options);
    this.media = new MediaNodeProcess(bins);
  }

  async start(): Promise<this> {
    await super.start();
    // Every media-control command the gateway sends, as the fake node's media.commands.
    this.sub = this.nc.subscribe(`media.${this.media.nodeId}.commands`, {
      callback: (err, msg) => {
        if (!err)
          this.commands.push(JSON.parse(StringCodec().decode(msg.data)));
      }
    });
    return this;
  }

  async stop() {
    this.sub?.unsubscribe();
    await Promise.all([super.stop(), this.media.stop()]);
  }

  async setup(setup: Setup) {
    this.dialOutcome = setup.media?.dialOutcome;
    this.callerAudio = setup.callerAudio;
    if (setup.media?.heartbeatMs !== undefined)
      this.media.heartbeatMs = setup.media.heartbeatMs;
    await super.setup({ ...setup, callerAudio: undefined, media: undefined });
  }

  /**
   * Starts the node (after setup, so its options apply), places the call and returns once the
   * caller is answered: a real caller cannot send audio, keys or BYE before that.
   */
  async offerCallAndAccept(
    timeoutMs = 5000,
    options: { codecs?: string[] } = {}
  ): Promise<Peer> {
    await this.media.start();
    if (this.dialOutcome) await this.media.callee(this.dialOutcome);
    await this.media.call({
      appRef: "app-1",
      to: this.call?.to,
      from: this.call?.from,
      ...(options.codecs ? { codecs: options.codecs } : {})
    });
    const peer = (await this.app.nextConnection(timeoutMs)).peer;
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
