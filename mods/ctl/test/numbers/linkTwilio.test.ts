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
import { createSandbox, SinonStub } from "sinon";
import sinonChai from "sinon-chai";
import { stubClient } from "../helpers";

chai.use(sinonChai);
const sandbox = createSandbox();

const PHONE = "+18095550123";
const ACCOUNT_SID = "AC0123456789abcdef0123456789abcdef";
const API_KEY_SID = "SK0123456789abcdef0123456789abcdef";
const API_KEY_SECRET = "key-secret-value";
const AUTH_TOKEN = "auth-token-value";

describe("@ctl[sipnet:numbers:linkTwilio]", function () {
  let stdinIsTTY: boolean | undefined;
  let linkTwilio: SinonStub;
  let listNumbers: SinonStub;

  beforeEach(function () {
    // Every case runs as a script: no TTY, so the command never prompts.
    stdinIsTTY = process.stdin.isTTY;
    process.stdin.isTTY = false;
    delete process.env.TWILIO_API_KEY_SECRET;
    delete process.env.TWILIO_AUTH_TOKEN;
    stubClient(sandbox);
    listNumbers = sandbox
      .stub(SDK.Numbers.prototype, "listNumbers")
      .resolves({ items: [], nextPageToken: "" } as never);
    linkTwilio = sandbox
      .stub(SDK.Numbers.prototype, "linkTwilio")
      .resolves({ ref: "num-1", trunkRef: "trunk-1" });
  });

  afterEach(function () {
    process.stdin.isTTY = stdinIsTTY as boolean;
    delete process.env.TWILIO_API_KEY_SECRET;
    delete process.env.TWILIO_AUTH_TOKEN;
    sandbox.restore();
  });

  it("links with an API key from flags and the environment", async function () {
    process.env.TWILIO_API_KEY_SECRET = API_KEY_SECRET;

    const { stdout, error } = await runCommand([
      "sipnet:numbers:linkTwilio",
      PHONE,
      "--account-sid",
      ACCOUNT_SID,
      "--api-key-sid",
      API_KEY_SID
    ]);

    expect(error).to.be.undefined;
    expect(linkTwilio).to.have.been.calledOnce;
    expect(linkTwilio.firstCall.args[0].credentials).to.deep.equal({
      accountSid: ACCOUNT_SID,
      apiKeySid: API_KEY_SID,
      apiKeySecret: API_KEY_SECRET
    });
    expect(stdout).to.contain(
      `Linked ${PHONE} (number num-1) on Twilio Trunk (trunk-1).`
    );
  });

  it("links with the Auth Token", async function () {
    process.env.TWILIO_AUTH_TOKEN = AUTH_TOKEN;

    const { error } = await runCommand([
      "sipnet:numbers:linkTwilio",
      PHONE,
      "--account-sid",
      ACCOUNT_SID,
      "--auth-token"
    ]);

    expect(error).to.be.undefined;
    expect(linkTwilio.firstCall.args[0].credentials).to.deep.equal({
      accountSid: ACCOUNT_SID,
      authToken: AUTH_TOKEN
    });
  });

  it("refuses an API key SID together with --auth-token", async function () {
    const { error } = await runCommand([
      "sipnet:numbers:linkTwilio",
      PHONE,
      "--account-sid",
      ACCOUNT_SID,
      "--api-key-sid",
      API_KEY_SID,
      "--auth-token"
    ]);

    expect(error?.oclif?.exit).to.equal(2);
    expect(linkTwilio).to.not.have.been.called;
  });

  it("names the missing credential kind without a TTY", async function () {
    const { error } = await runCommand([
      "sipnet:numbers:linkTwilio",
      PHONE,
      "--account-sid",
      ACCOUNT_SID
    ]);

    expect(error?.message).to.equal("Missing --api-key-sid or --auth-token.");
    expect(error?.oclif?.exit).to.equal(1);
    expect(linkTwilio).to.not.have.been.called;
  });

  it("names the missing account SID without a TTY", async function () {
    process.env.TWILIO_API_KEY_SECRET = API_KEY_SECRET;

    const { error } = await runCommand([
      "sipnet:numbers:linkTwilio",
      PHONE,
      "--api-key-sid",
      API_KEY_SID
    ]);

    expect(error?.message).to.equal("Missing --account-sid.");
    expect(error?.oclif?.exit).to.equal(1);
    expect(linkTwilio).to.not.have.been.called;
  });

  it("asks for --yes before replacing a number already in the workspace", async function () {
    process.env.TWILIO_API_KEY_SECRET = API_KEY_SECRET;
    listNumbers.resolves({
      items: [{ ref: "num-1", telUrl: `tel:${PHONE}` }],
      nextPageToken: ""
    } as never);

    const { error } = await runCommand([
      "sipnet:numbers:linkTwilio",
      PHONE,
      "--account-sid",
      ACCOUNT_SID,
      "--api-key-sid",
      API_KEY_SID
    ]);

    expect(error?.message).to.equal(
      `${PHONE} is already in this workspace; pass --yes to replace its trunk and route.`
    );
    expect(error?.oclif?.exit).to.equal(1);
    expect(linkTwilio).to.not.have.been.called;
  });

  it("prints the RPC error without the secret", async function () {
    process.env.TWILIO_API_KEY_SECRET = API_KEY_SECRET;
    linkTwilio.rejects(
      Object.assign(
        new Error(
          "9 FAILED_PRECONDITION: Twilio didn't accept these credentials"
        ),
        { code: 9, details: "Twilio didn't accept these credentials" }
      )
    );

    const { stdout, stderr, error } = await runCommand([
      "sipnet:numbers:linkTwilio",
      PHONE,
      "--account-sid",
      ACCOUNT_SID,
      "--api-key-sid",
      API_KEY_SID
    ]);

    expect(error?.message).to.equal(
      "Failed to link number: Twilio didn't accept these credentials"
    );
    expect(error?.oclif?.exit).to.equal(1);
    expect(`${stdout}${stderr}${error?.message}`).to.not.contain(
      API_KEY_SECRET
    );
  });

  it("runs under the old command name", async function () {
    process.env.TWILIO_API_KEY_SECRET = API_KEY_SECRET;

    const { error } = await runCommand([
      "sipnet:numbers:linkTwilioNumber",
      PHONE,
      "--account-sid",
      ACCOUNT_SID,
      "--api-key-sid",
      API_KEY_SID
    ]);

    expect(error).to.be.undefined;
    expect(linkTwilio).to.have.been.calledOnce;
  });

  it("names the number after itself and sends no route by default", async function () {
    process.env.TWILIO_API_KEY_SECRET = API_KEY_SECRET;

    await runCommand([
      "sipnet:numbers:linkTwilio",
      PHONE,
      "--account-sid",
      ACCOUNT_SID,
      "--api-key-sid",
      API_KEY_SID
    ]);

    const request = linkTwilio.firstCall.args[0];
    expect(request.phoneNumber).to.equal(PHONE);
    expect(request.name).to.equal(PHONE);
    expect(request).to.not.have.property("appRef");
    expect(request).to.not.have.property("agentAor");
  });
});
