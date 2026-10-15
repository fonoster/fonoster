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

describe("@ctl[webhooks]", function () {
  beforeEach(function () {
    stubClient(sandbox);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("creates a webhook and shows the secret once", async function () {
    const create = sandbox
      .stub(SDK.Webhooks.prototype, "createWebhook")
      .resolves({ ref: "wh-1", secret: "whsec_abc" });

    const { stdout } = await runCommand([
      "webhooks:create",
      "--url",
      "https://example.com/hooks",
      "-e",
      "call.ended",
      "-e",
      "call_record.sealed"
    ]);

    expect(create).to.have.been.calledOnceWith({
      url: "https://example.com/hooks",
      events: ["call.ended", "call_record.sealed"]
    });
    expect(stdout).to.contain("Webhook created: wh-1");
    expect(stdout).to.contain("Signing secret: whsec_abc");
  });

  it("rejects an unknown event", async function () {
    const create = sandbox.stub(SDK.Webhooks.prototype, "createWebhook");

    const { error } = await runCommand([
      "webhooks:create",
      "--url",
      "https://example.com/hooks",
      "-e",
      "call.exploded"
    ]);

    expect(error?.message).to.match(/Expected --event=call.exploded/);
    expect(create).to.not.have.been.called;
  });

  it("lists webhooks", async function () {
    sandbox.stub(SDK.Webhooks.prototype, "listWebhooks").resolves({
      items: [
        {
          ref: "wh-1",
          url: "https://example.com/hooks",
          events: ["call.ended"],
          secretHint: "…abcd",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });

    const { stdout } = await runCommand(["webhooks:list"]);

    expect(stdout).to.contain("wh-1");
    expect(stdout).to.contain("https://example.com/hooks");
    expect(stdout).to.contain("call.ended");
  });

  it("gets a webhook without its secret", async function () {
    sandbox.stub(SDK.Webhooks.prototype, "getWebhook").resolves({
      ref: "wh-1",
      url: "https://example.com/hooks",
      events: ["call.ended", "call.failed"],
      secretHint: "…abcd",
      createdAt: new Date("2026-10-15T10:00:00Z"),
      updatedAt: new Date("2026-10-15T10:00:00Z")
    });

    const { stdout } = await runCommand(["webhooks:get", "wh-1"]);

    expect(stdout).to.contain("call.ended, call.failed");
    expect(stdout).to.contain("…abcd");
    expect(stdout).to.contain("2026-10-15T10:00:00Z");
  });

  it("updates only the fields given", async function () {
    const update = sandbox
      .stub(SDK.Webhooks.prototype, "updateWebhook")
      .resolves({ ref: "wh-1" });

    await runCommand(["webhooks:update", "wh-1", "-e", "call.started"]);

    expect(update).to.have.been.calledOnceWith({
      ref: "wh-1",
      events: ["call.started"]
    });
  });

  it("refuses an update with nothing to change", async function () {
    const update = sandbox.stub(SDK.Webhooks.prototype, "updateWebhook");

    const { error } = await runCommand(["webhooks:update", "wh-1"]);

    expect(error?.message).to.contain("Nothing to update");
    expect(update).to.not.have.been.called;
  });

  it("deletes a webhook", async function () {
    const del = sandbox
      .stub(SDK.Webhooks.prototype, "deleteWebhook")
      .resolves({ ref: "wh-1" });

    const { stdout } = await runCommand(["webhooks:delete", "wh-1"]);

    expect(del).to.have.been.calledOnceWith("wh-1");
    expect(stdout).to.contain("Done!");
  });

  it("rotates the secret and says how long the old one lasts", async function () {
    sandbox.stub(SDK.Webhooks.prototype, "rotateWebhookSecret").resolves({
      ref: "wh-1",
      secret: "whsec_new",
      previousSecretUntil: new Date("2026-10-16T10:00:00Z")
    });

    const { stdout } = await runCommand(["webhooks:rotate", "wh-1"]);

    expect(stdout).to.contain("Signing secret: whsec_new");
    expect(stdout).to.contain("valid until 2026-10-16T10:00:00Z");
  });

  it("lists deliveries for one webhook", async function () {
    const list = sandbox
      .stub(SDK.Webhooks.prototype, "listWebhookDeliveries")
      .resolves({
        items: [
          {
            ref: "dl-1",
            webhookRef: "wh-1",
            eventId: "evt-1",
            eventType: "call.ended",
            status: "failed",
            attempts: 3,
            lastStatus: 500,
            createdAt: new Date()
          }
        ]
      });

    const { stdout } = await runCommand([
      "webhooks:deliveries",
      "wh-1",
      "-s",
      "10"
    ]);

    expect(list).to.have.been.calledOnceWith({
      webhookRef: "wh-1",
      pageSize: 10
    });
    expect(stdout).to.contain("dl-1");
    expect(stdout).to.contain("failed");
    expect(stdout).to.contain("500");
  });

  it("resends a delivery", async function () {
    const resend = sandbox
      .stub(SDK.Webhooks.prototype, "resendWebhookDelivery")
      .resolves({
        ref: "dl-2",
        webhookRef: "wh-1",
        eventId: "evt-1",
        eventType: "call.ended",
        status: "pending",
        attempts: 0,
        createdAt: new Date()
      });

    const { stdout } = await runCommand(["webhooks:resend", "dl-1"]);

    expect(resend).to.have.been.calledOnceWith("dl-1");
    expect(stdout).to.contain("Resent call.ended (evt-1) as dl-2: pending");
  });
});
