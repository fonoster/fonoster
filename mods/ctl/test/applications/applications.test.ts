/**
 * Copyright (C) 2026 by Fonoster Inc (https://fonoster.com)
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
import * as SDK from "@fonoster/sdk";
import { runCommand } from "@oclif/test";
import * as chai from "chai";
import { expect } from "chai";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { stubClient } from "../helpers";

chai.use(sinonChai);
const sandbox = createSandbox();

const app = {
  ref: "app-1",
  name: "Bot",
  type: "STREAM",
  url: "wss://bot.example.com/session",
  protocol: "twilio",
  speech: {
    voice: "elevenlabs/rachel",
    language: "en-US",
    sttModel: "deepgram/nova-3",
    ttsModel: "",
    silenceTimeoutMs: 0,
    patience: "high"
  },
  audio: { codec: "pcm16", rate: 16000 },
  listeners: [{ url: "wss://rec.example.com/ws", tracks: "inbound" }],
  recording: "consent",
  amd: { enabled: true, windowMs: 3000 },
  fallbackAppRef: "app-0",
  fallbackMessage: "",
  signingSecretHint: "…wxyz",
  createdAt: new Date(),
  updatedAt: new Date()
};

describe("@ctl[applications]", function () {
  beforeEach(function () {
    stubClient(sandbox);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("creates an app from flags and shows the signing secret once", async function () {
    const create = sandbox
      .stub(SDK.Applications.prototype, "createApplication")
      .resolves({ ref: "app-1", signingSecret: "s3cret" });

    const { stdout } = await runCommand([
      "applications:create",
      "--name",
      "Bot",
      "--url",
      "wss://bot.example.com/session",
      "--audio-codec",
      "pcmu",
      "--fallback-app",
      "app-0"
    ]);

    expect(create.firstCall.args[0]).to.include({
      name: "Bot",
      url: "wss://bot.example.com/session",
      fallbackAppRef: "app-0"
    });
    expect(create.firstCall.args[0].audio).to.deep.equal({
      codec: "pcmu",
      rate: 8000
    });
    expect(stdout).to.contain("Application created: app-1");
    expect(stdout).to.contain("Signing secret: s3cret");
  });

  it("reports a missing url without calling the API", async function () {
    const create = sandbox.stub(
      SDK.Applications.prototype,
      "createApplication"
    );

    const { error } = await runCommand([
      "applications:create",
      "--name",
      "Bot"
    ]);

    expect(error?.message).to.contain("a url is required");
    expect(create).to.not.have.been.called;
  });

  it("rejects an unknown protocol", async function () {
    const { error } = await runCommand([
      "applications:create",
      "--name",
      "Bot",
      "--url",
      "wss://x.example.com",
      "--protocol",
      "plivo"
    ]);

    expect(error?.message).to.match(/Expected --protocol=plivo/);
  });

  it("updates an app from its current state", async function () {
    sandbox
      .stub(SDK.Applications.prototype, "getApplication")
      .resolves(app as never);
    const update = sandbox
      .stub(SDK.Applications.prototype, "updateApplication")
      .resolves({ ref: "app-1" });

    const { stdout } = await runCommand([
      "applications:update",
      "app-1",
      "--recording",
      "off"
    ]);

    expect(update.firstCall.args[0]).to.include({
      ref: "app-1",
      name: "Bot",
      protocol: "twilio",
      recording: "off"
    });
    expect(stdout).to.contain("Application updated: app-1");
  });

  it("turns AMD on and off (AO-B1)", async function () {
    const create = sandbox
      .stub(SDK.Applications.prototype, "createApplication")
      .resolves({ ref: "app-2", signingSecret: "s" });
    await runCommand([
      "applications:create",
      "--name",
      "Dialer",
      "--url",
      "wss://bot.example.com/session",
      "--amd"
    ]);
    expect(create.firstCall.args[0].amd).to.deep.equal({ enabled: true });

    sandbox
      .stub(SDK.Applications.prototype, "getApplication")
      .resolves(app as never);
    const update = sandbox
      .stub(SDK.Applications.prototype, "updateApplication")
      .resolves({ ref: "app-1" });
    await runCommand(["applications:update", "app-1", "--amd-window", "6000"]);
    expect(update.firstCall.args[0].amd).to.deep.equal({
      enabled: true,
      windowMs: 6000
    });
    await runCommand(["applications:update", "app-1", "--no-amd"]);
    expect(update.secondCall.args[0].amd).to.be.undefined;
    // Untouched: the current setting is kept.
    await runCommand(["applications:update", "app-1", "--name", "Bot3"]);
    expect(update.thirdCall.args[0].amd).to.deep.equal({
      enabled: true,
      windowMs: 3000
    });
  });

  it("shows an app in the session model", async function () {
    sandbox
      .stub(SDK.Applications.prototype, "getApplication")
      .resolves(app as never);

    const { stdout } = await runCommand(["applications:get", "app-1"]);

    expect(stdout).to.contain("wss://bot.example.com/session");
    expect(stdout).to.contain("twilio");
    expect(stdout).to.contain("elevenlabs/rachel");
    expect(stdout).to.contain("deepgram/nova-3");
    expect(stdout).to.contain("pcm16 16000 Hz");
    expect(stdout).to.contain("wss://rec.example.com/ws (inbound)");
    expect(stdout).to.contain("consent");
    expect(stdout).to.contain("on (3000 ms)");
    expect(stdout).to.contain("…wxyz");
  });

  it("lists apps with kind, protocol, voice and url", async function () {
    sandbox
      .stub(SDK.Applications.prototype, "listApplications")
      .resolves({ items: [app] as never, nextPageToken: "" });

    const { stdout } = await runCommand(["applications:list"]);

    expect(stdout).to.contain("app-1");
    expect(stdout).to.contain("Stream");
    expect(stdout).to.contain("elevenlabs/rachel");
  });

  it("rotates the signing secret and shows it once", async function () {
    const rotate = sandbox
      .stub(SDK.Applications.prototype, "rotateSigningSecret")
      .resolves({
        ref: "app-1",
        signingSecret: "n3w",
        signingSecretHint: "…n3w"
      });

    const { stdout } = await runCommand([
      "applications:rotate-secret",
      "app-1"
    ]);

    expect(rotate).to.have.been.calledOnceWith("app-1");
    expect(stdout).to.contain("Signing secret: n3w");
    expect(stdout).to.contain("shown only once");
  });

  it("deletes an app", async function () {
    const del = sandbox
      .stub(SDK.Applications.prototype, "deleteApplication")
      .resolves({ ref: "app-1" });

    const { stdout } = await runCommand(["applications:delete", "app-1"]);

    expect(del).to.have.been.calledOnceWith("app-1");
    expect(stdout).to.contain("Done!");
  });
});
