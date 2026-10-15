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
import * as path from "path";
import { Harness } from "../runner/Harness";
import { Peer } from "../runner/Peer";
import { SCENARIOS_DIR } from "../scenario/loadScenario";
import { Providers, Setup } from "../scenario/types";
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

  constructor(private readonly options: FakesHarnessOptions = {}) {
    this.app = options.app ?? new FakeApp();
    this.mediaNode = options.mediaNode ?? new FakeMediaNode();
  }

  async start(): Promise<this> {
    await Promise.all([
      this.app.start(),
      this.tts.start(),
      this.stt.start(),
      this.llm.start()
    ]);
    return this;
  }

  async stop() {
    await Promise.all([
      this.app.stop(),
      this.tts.stop(),
      this.stt.stop(),
      this.llm.stop(),
      this.mediaNode.stop()
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
      const source = setup.callerAudio;
      this.mediaNode.configure({
        callerAudio:
          source.kind === "file"
            ? {
                ...source,
                file: path.join(SCENARIOS_DIR, "audio", source.file ?? "")
              }
            : source
      });
    }
    if (setup.app) {
      this.app.configure({
        signingSecret: setup.app.signingSecret,
        verifySignature: setup.app.verifySignature
      });
      if (setup.app.reachable === false) await this.app.stop();
    }
    this.call = setup.call ?? {};
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
