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
import * as path from "path";
import { encode, generate } from "../audio/codecs";
import { Harness } from "../runner/Harness";
import { Peer } from "../runner/Peer";
import { SCENARIOS_DIR } from "../scenario/loadScenario";
import { AudioSource, CallerAction, Providers, Setup } from "../scenario/types";
import { FakeApp } from "./FakeApp";
import { FakeMediaNode } from "./FakeMediaNode";
import { FakeLlm } from "./providers/FakeLlm";
import { FakeStt } from "./providers/FakeStt";
import { FakeTts } from "./providers/FakeTts";
import { ProviderLedger } from "./providers/ProviderLedger";

export type FakesHarnessOptions = {
  app?: FakeApp;
  mediaNode?: FakeMediaNode;
  /**
   * Counts network calls that reached anything other than the fakes (for example from an egress
   * proxy around the implementation under test). Without it, providers.vendor_calls is not
   * measurable and scenarios asserting it fail.
   */
  vendorCalls?: () => number;
};

/**
 * The fakes around a gateway under test, exposed to the runner as a Harness: setup, provider
 * injection, provider-time accounting and the named assertions from SCENARIOS.md.
 */
export class FakesHarness implements Harness {
  readonly ledger = new ProviderLedger();
  readonly tts = new FakeTts(this.ledger);
  readonly stt = new FakeStt(this.ledger);
  readonly llm = new FakeLlm(this.ledger);
  readonly app: FakeApp;
  readonly mediaNode: FakeMediaNode;
  private call: Setup["call"] = {};
  private mediaServer?: http.Server;

  constructor(private readonly options: FakesHarnessOptions = {}) {
    this.app = options.app ?? new FakeApp();
    this.mediaNode = options.mediaNode ?? new FakeMediaNode();
  }

  async start(): Promise<this> {
    await Promise.all([
      this.app.start(),
      this.tts.start(),
      this.stt.start(),
      this.llm.start(),
      this.startMediaServer()
    ]);
    return this;
  }

  async stop() {
    await Promise.all([
      this.app.stop(),
      this.tts.stop(),
      this.stt.stop(),
      this.llm.stop(),
      this.mediaNode.stop(),
      new Promise<void>((r) =>
        this.mediaServer ? this.mediaServer.close(() => r()) : r()
      )
    ]);
  }

  /** Base URLs to configure in the implementation's fake adapters. */
  get providerUrls() {
    return {
      tts: this.tts.url,
      stt: this.stt.url.replace(/^http/, "ws"),
      llm: this.llm.url
    };
  }

  async setup(setup: Setup) {
    if (setup.providers) await this.inject(setup.providers);
    if (setup.callerAudio) {
      this.mediaNode.configure({
        callerAudio: this.resolveAudio(setup.callerAudio)
      });
    }
    if (setup.app) {
      this.app.configure({
        signingSecret: setup.app.signingSecret,
        verifySignature: setup.app.verifySignature
      });
      if (setup.app.reachable === false) await this.app.stop();
    }
    if (setup.media) this.mediaNode.configure(setup.media);
    this.call = setup.call ?? {};
  }

  /** Base URL of the test media server (`tone-<ms>.wav`, 404 otherwise). */
  get mediaUrl(): string {
    const address = this.mediaServer?.address() as AddressInfo | undefined;
    if (!address) throw new Error("media server is not running");
    return `http://127.0.0.1:${address.port}`;
  }

  vars() {
    return { media: this.mediaUrl };
  }

  caller(action: CallerAction) {
    if (action.dtmf)
      for (const digit of action.dtmf) this.mediaNode.pressKey(digit);
    if (action.audio)
      this.mediaNode.callerSpeaks(this.resolveAudio(action.audio));
    if (action.hangup) this.mediaNode.callerHangup();
  }

  private resolveAudio(source: AudioSource): AudioSource {
    return source.kind === "file"
      ? {
          ...source,
          file: path.join(SCENARIOS_DIR, "audio", source.file ?? "")
        }
      : source;
  }

  private startMediaServer(): Promise<void> {
    this.mediaServer = http.createServer((req, res) => {
      const m = /^\/tone-(\d+)\.wav$/.exec(req.url ?? "");
      if (!m) {
        res.writeHead(404).end();
        return;
      }
      const pcm = encode(generate("tone", Number(m[1]), 16000), {
        codec: "pcm16",
        rate: 16000
      });
      const header = Buffer.alloc(44);
      header.write("RIFF", 0);
      header.writeUInt32LE(36 + pcm.length, 4);
      header.write("WAVEfmt ", 8);
      header.writeUInt32LE(16, 16);
      header.writeUInt16LE(1, 20);
      header.writeUInt16LE(1, 22);
      header.writeUInt32LE(16000, 24);
      header.writeUInt32LE(32000, 28);
      header.writeUInt16LE(2, 32);
      header.writeUInt16LE(16, 34);
      header.write("data", 36);
      header.writeUInt32LE(pcm.length, 40);
      res.writeHead(200, { "content-type": "audio/wav" });
      res.end(Buffer.concat([header, pcm]));
    });
    return new Promise((r) =>
      this.mediaServer!.listen(0, "127.0.0.1", () => r())
    );
  }

  /**
   * Starts the scenario's call: the fake media node offers it and the runner gets the socket the
   * gateway opens to the fake app.
   */
  async offerCallAndAccept(timeoutMs = 5000): Promise<Peer> {
    this.mediaNode.offerCall(this.call);
    return (await this.app.nextConnection(timeoutMs)).peer;
  }

  async inject(providers: Providers) {
    if (providers.tts) this.tts.configure(providers.tts);
    if (providers.stt) this.stt.configure(providers.stt);
    if (providers.llm) this.llm.configure(providers.llm);
  }

  providerDelayBetween(from: number, to: number): number {
    return this.ledger.delayBetween(from, to);
  }

  measure(name: string, since: number): unknown {
    switch (name) {
      case "media.output_silent_within_ms":
        return this.mediaNode.outputSilentWithinMs(since);
      case "media.output_audio_ms":
        return this.mediaNode.outputAudioMs(since);
      case "media.commands":
        return this.mediaNode.commands.map((c) => c.command);
      case "providers.tts.requests":
        return this.tts.requests;
      case "providers.stt.requests":
        return this.stt.requests;
      case "providers.llm.requests":
        return this.llm.requests;
      case "providers.vendor_calls":
        return this.options.vendorCalls?.();
      default:
        return undefined;
    }
  }
}
