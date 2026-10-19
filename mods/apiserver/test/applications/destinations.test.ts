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
import { expect } from "chai";
import { toAppColumns } from "../../src/applications/session/appModel";

// M14: app and listener URLs must name public destinations (AppBridge dials
// them); the hosted Autopilot URL from configuration is exempt.

const CONFIG = { autopilotUrl: "ws://autopilot:50061" };
const db = {};

async function message(
  request: Record<string, unknown>,
  config: Record<string, unknown> = CONFIG
) {
  try {
    await toAppColumns(db, request, {
      accessKeyId: "WO1",
      config: config as typeof CONFIG
    });
  } catch (e) {
    return (e as Error & { message: string }).message;
  }
  return "accepted";
}

describe("@applications/destinations", function () {
  let saved: string | undefined;

  beforeEach(function () {
    saved = process.env.FONOSTER_ALLOWED_DESTINATIONS;
    delete process.env.FONOSTER_ALLOWED_DESTINATIONS;
  });

  afterEach(function () {
    if (saved !== undefined) process.env.FONOSTER_ALLOWED_DESTINATIONS = saved;
  });

  it("refuses internal and private app URLs", async function () {
    for (const url of [
      "ws://169.254.169.254/latest",
      "ws://127.0.0.1:8080/",
      "wss://10.1.2.3/session",
      "ws://[::1]:3000/",
      "ws://localhost:3000/session",
      "ws://apiserver:50051/",
      "ws://nats.fonoster.svc/"
    ])
      expect(await message({ name: "a", type: "STREAM", url }), url).to.match(
        /url must be a public address/
      );
  });

  it("refuses internal listener URLs", async function () {
    expect(
      await message({
        name: "a",
        type: "STREAM",
        url: "wss://bot.example.com/session",
        listeners: [{ url: "ws://169.254.169.254/" }]
      })
    ).to.match(/listeners.url must be a public address/);
  });

  it("accepts public URLs and the hosted Autopilot default", async function () {
    expect(
      await message({
        name: "a",
        type: "STREAM",
        url: "wss://bot.example.com/session",
        listeners: [{ url: "wss://qa.example.com/listen" }]
      })
    ).to.equal("accepted");
    expect(
      await message({
        name: "a",
        type: "STREAM",
        url: "ws://autopilot:50061"
      })
    ).to.equal("accepted");
  });

  it("accepts private destinations the operator allows", async function () {
    expect(
      await message(
        { name: "a", type: "STREAM", url: "ws://my-bot:3000/session" },
        { ...CONFIG, allowedDestinations: ["my-bot"] }
      )
    ).to.equal("accepted");
    process.env.FONOSTER_ALLOWED_DESTINATIONS = "10.0.0.0/8";
    expect(
      await message({ name: "a", type: "STREAM", url: "ws://10.1.2.3/" })
    ).to.equal("accepted");
  });
});
