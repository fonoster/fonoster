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
import { AddressInfo } from "net";
import { publicWebSocketGuard } from "@fonoster/common";
import { expect } from "chai";
import { WebSocketServer } from "ws";
import { AppConfig } from "../src/config";
import { connectApp } from "../src/session/connectApp";
import { Listener } from "../src/session/Listener";

// M14: the gateway dials tenant app and listener URLs (database apps) only at
// public addresses, re-checking what the name resolves to; operator apps and
// FONOSTER_ALLOWED_DESTINATIONS are exempt.

describe("@gateway[app destinations]", function () {
  let wss: WebSocketServer;
  let port: number;
  let saved: string | undefined;

  before(async function () {
    wss = new WebSocketServer({ port: 0, host: "127.0.0.1" });
    await new Promise((r) => wss.once("listening", r));
    port = (wss.address() as AddressInfo).port;
  });

  beforeEach(function () {
    saved = process.env.FONOSTER_ALLOWED_DESTINATIONS;
    delete process.env.FONOSTER_ALLOWED_DESTINATIONS;
  });

  afterEach(function () {
    if (saved === undefined) delete process.env.FONOSTER_ALLOWED_DESTINATIONS;
    else process.env.FONOSTER_ALLOWED_DESTINATIONS = saved;
  });

  after(() => new Promise<void>((r) => wss.close(() => r())));

  const app = (url: string, publicOnly: boolean): AppConfig => ({
    ref: "app-1",
    url,
    protocol: "fonoster",
    signingSecret: "secret-0123456789",
    speech: { voice: "v/x", language: "en-US" },
    workspaceRef: "WO1",
    ...(publicOnly
      ? { publicDestinationsOnly: { url: true, listeners: true } }
      : {})
  });

  const options = (failures: string[]) => ({
    windowMs: 300,
    intervalMs: 100,
    onFailure: (f: { reason: string }) => failures.push(f.reason)
  });

  it("refuses a tenant app at a private address, without retrying", async function () {
    const failures: string[] = [];
    let error = "";
    try {
      await connectApp(app(`ws://127.0.0.1:${port}/`, true), options(failures));
    } catch (e) {
      error = (e as Error).message;
    }
    expect(error).to.match(/non-public/);
    expect(failures).to.have.length(1);
  });

  it("refuses names that resolve to a private address when connecting", async function () {
    // The guard's lookup is what the socket uses: a public-looking name whose
    // DNS answer is private (or changes to one) is refused at connect time.
    const { lookup } = publicWebSocketGuard("wss://bot.example.com/session");
    const error = await new Promise<Error | null>((resolve) =>
      lookup("localhost", { all: true }, (err) => resolve(err))
    );
    expect(error?.message).to.match(/non-public/);
  });

  it("dials operator apps and allow-listed destinations", async function () {
    const failures: string[] = [];
    const direct = await connectApp(
      app(`ws://127.0.0.1:${port}/`, false),
      options(failures)
    );
    direct.close();
    process.env.FONOSTER_ALLOWED_DESTINATIONS = "127.0.0.1";
    const allowed = await connectApp(
      app(`ws://127.0.0.1:${port}/`, true),
      options(failures)
    );
    allowed.close();
    expect(failures).to.deep.equal([]);
  });

  it("refuses tenant listeners at private addresses", async function () {
    let error = "";
    try {
      await Listener.connect(
        `ws://169.254.169.254/`,
        "secret-0123456789",
        { appRef: "app-1", workspaceRef: "WO1" },
        500,
        true
      );
    } catch (e) {
      error = (e as Error).message;
    }
    expect(error).to.match(/non-public/);
  });
});
