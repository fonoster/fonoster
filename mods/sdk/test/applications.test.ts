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
import { EventEmitter } from "events";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("@sdk[Applications]", function () {
  it("throws a stream error from evaluateIntelligence even when no events are queued", async function () {
    // Arrange
    const { Applications } = await import("../src/Applications");

    const stream = new EventEmitter();
    const fonosterClient = {
      getApplicationsClient: () => ({ evaluateIntelligence: () => stream }),
      getMetadata: () => ({})
    };

    const apps = new Applications(fonosterClient as never);
    const events = apps.evaluateIntelligence({
      intelligence: { productRef: "autopilot", config: {} }
    } as never);

    // Act
    setTimeout(() => stream.emit("error", new Error("quota exceeded")), 10);
    const drain = async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of events) {
        // no events expected
      }
    };

    // Assert
    await expect(drain()).to.be.rejectedWith("quota exceeded");
  });

  it("sends speech.speed with the speech defaults", async function () {
    // Arrange
    const { Applications } = await import("../src/Applications");
    const sent: {
      getSpeech(): { getSpeed(): number; getTtsModel(): string };
    }[] = [];
    const fonosterClient = {
      getApplicationsClient: () => ({
        createApplication: (
          request: (typeof sent)[number],
          _metadata: unknown,
          callback: (e: unknown, r: unknown) => void
        ) => {
          sent.push(request);
          callback(null, { toObject: () => ({ ref: "app-1" }) });
        }
      }),
      getMetadata: () => ({})
    };
    const apps = new Applications(fonosterClient as never);

    // Act
    await apps.createApplication({
      name: "Front desk",
      type: "STREAM",
      url: "wss://bot.example.com",
      speech: {
        voice: "elevenlabs/AbC123",
        ttsModel: "elevenlabs/eleven_v4_turbo",
        speed: 1.1
      }
    } as never);

    // Assert
    expect(sent[0].getSpeech().getSpeed()).to.equal(1.1);
    expect(sent[0].getSpeech().getTtsModel()).to.equal(
      "elevenlabs/eleven_v4_turbo"
    );
  });
});
