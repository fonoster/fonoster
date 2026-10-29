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
import * as SDK from "@fonoster/sdk";
import { runCommand } from "@oclif/test";
import * as chai from "chai";
import { expect } from "chai";
import { createSandbox, SinonStub } from "sinon";
import sinonChai from "sinon-chai";
import { stubClient } from "../helpers";

chai.use(sinonChai);
const sandbox = createSandbox();

const PHONE = "+525512345678";
const PHONE_NUMBER_ID = "106612345678901";
const ACCESS_TOKEN = "EAAGm0PX4ZCpsBO7ZCZCtoken-value";
const SIP_PASSWORD = "m3ta-1ssued-passw0rd";
const APP_REF = "4a2f8c1e-0b7d-4a51-9e3c-2f6d7a1b9c00";
const HOSTNAME =
  "wa-wo7d2kq9x4m1c8b3n6p0r5t2v9y4z7a1e3-525512345678.pstn.fonoster.ai";

function response(overrides: Record<string, unknown> = {}) {
  return {
    ref: "num-1",
    trunkRef: "trunk-1",
    sipServerHostname: HOSTNAME,
    sipServerPort: 5061,
    sipPasswordSet: true,
    phoneNumber: PHONE,
    verifiedName: "",
    metaConfigured: false,
    ...overrides
  };
}

describe("@ctl[sipnet:numbers:linkWhatsApp]", function () {
  let stdinIsTTY: boolean | undefined;
  let linkWhatsApp: SinonStub;

  beforeEach(function () {
    // Every case runs as a script: no TTY, so the command never prompts.
    stdinIsTTY = process.stdin.isTTY;
    process.stdin.isTTY = false;
    delete process.env.WHATSAPP_SIP_PASSWORD;
    delete process.env.META_ACCESS_TOKEN;
    stubClient(sandbox);
    linkWhatsApp = sandbox
      .stub(SDK.Numbers.prototype, "linkWhatsApp")
      .resolves(response());
  });

  afterEach(function () {
    process.stdin.isTTY = stdinIsTTY as boolean;
    delete process.env.WHATSAPP_SIP_PASSWORD;
    delete process.env.META_ACCESS_TOKEN;
    sandbox.restore();
  });

  it("links with a phone number id and the token from the environment, and prints Meta's state", async function () {
    process.env.META_ACCESS_TOKEN = ACCESS_TOKEN;
    linkWhatsApp.resolves(
      response({ verifiedName: "Acme Dental", metaConfigured: true })
    );

    const { stdout, error } = await runCommand([
      "sipnet:numbers:linkWhatsApp",
      "--phone-number-id",
      PHONE_NUMBER_ID,
      "--app",
      APP_REF,
      "--yes"
    ]);

    expect(error).to.be.undefined;
    expect(linkWhatsApp).to.have.been.calledOnceWithExactly({
      phoneNumberId: PHONE_NUMBER_ID,
      accessToken: ACCESS_TOKEN,
      appRef: APP_REF
    });
    expect(stdout).to.contain(
      `Linked ${PHONE} (Acme Dental) (number num-1) on WhatsApp Trunk ${PHONE} (trunk-1).`
    );
    expect(stdout).to.contain(
      `SIP calling is on in WhatsApp, pointed at ${HOSTNAME}:5061 with SDES.`
    );
    expect(stdout).to.not.contain("Register this SIP server");
    expect(stdout).to.not.contain(ACCESS_TOKEN);
  });

  it("links with the password from the environment and prints the SIP server", async function () {
    process.env.WHATSAPP_SIP_PASSWORD = SIP_PASSWORD;

    const { stdout, error } = await runCommand([
      "sipnet:numbers:linkWhatsApp",
      PHONE,
      "--app",
      APP_REF,
      "--yes"
    ]);

    expect(error).to.be.undefined;
    expect(linkWhatsApp).to.have.been.calledOnceWithExactly({
      phoneNumber: PHONE,
      sipPassword: SIP_PASSWORD,
      appRef: APP_REF
    });
    expect(stdout).to.contain(
      `Linked ${PHONE} (number num-1) on WhatsApp Trunk ${PHONE} (trunk-1).`
    );
    expect(stdout).to.contain(
      `Register this SIP server in WhatsApp Manager: ${HOSTNAME} (port 5061).`
    );
    expect(stdout).to.contain("SIP password: set.");
    expect(stdout).to.not.contain(SIP_PASSWORD);
  });

  it("links without a password and says it isn't set yet", async function () {
    linkWhatsApp.resolves(response({ sipPasswordSet: false }));

    const { stdout, error } = await runCommand([
      "sipnet:numbers:linkWhatsApp",
      PHONE,
      "--app",
      APP_REF,
      "--yes"
    ]);

    expect(error).to.be.undefined;
    expect(linkWhatsApp.firstCall.args[0]).to.not.have.property("sipPassword");
    expect(stdout.trim()).to.match(
      /SIP password: not set yet\. Run the command again with WHATSAPP_SIP_PASSWORD once you have it from Meta\.$/
    );
  });

  it("sends the name only with --name, and a SIP agent as agentAor", async function () {
    process.env.META_ACCESS_TOKEN = ACCESS_TOKEN;

    const { error } = await runCommand([
      "sipnet:numbers:linkWhatsApp",
      "--phone-number-id",
      PHONE_NUMBER_ID,
      "--name",
      // runCommand joins its arguments and splits them like a shell
      '"Front desk"',
      "--agent",
      "sip:maria@acme.sip.fonoster.local",
      "--yes"
    ]);

    expect(error).to.be.undefined;
    expect(linkWhatsApp.firstCall.args[0]).to.deep.equal({
      phoneNumberId: PHONE_NUMBER_ID,
      accessToken: ACCESS_TOKEN,
      name: "Front desk",
      agentAor: "sip:maria@acme.sip.fonoster.local"
    });
  });

  it("refuses --app together with --agent", async function () {
    process.env.META_ACCESS_TOKEN = ACCESS_TOKEN;

    const { error } = await runCommand([
      "sipnet:numbers:linkWhatsApp",
      "--phone-number-id",
      PHONE_NUMBER_ID,
      "--app",
      APP_REF,
      "--agent",
      "sip:maria@acme.sip.fonoster.local",
      "--yes"
    ]);

    expect(error?.oclif?.exit).to.equal(2);
    expect(linkWhatsApp).to.not.have.been.called;
  });

  it("refuses the phone number together with --phone-number-id", async function () {
    process.env.META_ACCESS_TOKEN = ACCESS_TOKEN;

    const { error } = await runCommand([
      "sipnet:numbers:linkWhatsApp",
      PHONE,
      "--phone-number-id",
      PHONE_NUMBER_ID,
      "--yes"
    ]);

    expect(error?.message).to.equal(
      "Pass either the phone number or --phone-number-id, not both."
    );
    expect(error?.oclif?.exit).to.equal(2);
    expect(linkWhatsApp).to.not.have.been.called;
  });

  it("names the missing token without a TTY", async function () {
    const { error } = await runCommand([
      "sipnet:numbers:linkWhatsApp",
      "--phone-number-id",
      PHONE_NUMBER_ID,
      "--app",
      APP_REF,
      "--yes"
    ]);

    expect(error?.message).to.equal(
      "Set META_ACCESS_TOKEN to link without a terminal."
    );
    expect(error?.oclif?.exit).to.equal(1);
    expect(linkWhatsApp).to.not.have.been.called;
  });

  it("asks for --yes without a TTY", async function () {
    process.env.META_ACCESS_TOKEN = ACCESS_TOKEN;

    const { error } = await runCommand([
      "sipnet:numbers:linkWhatsApp",
      "--phone-number-id",
      PHONE_NUMBER_ID,
      "--app",
      APP_REF
    ]);

    expect(error?.message).to.equal("Pass --yes to link without confirmation.");
    expect(error?.oclif?.exit).to.equal(1);
    expect(linkWhatsApp).to.not.have.been.called;
  });

  it("prints the RPC error without the token or the password", async function () {
    process.env.META_ACCESS_TOKEN = ACCESS_TOKEN;
    process.env.WHATSAPP_SIP_PASSWORD = SIP_PASSWORD;
    linkWhatsApp.rejects(
      Object.assign(
        new Error(
          "9 FAILED_PRECONDITION: Meta didn't accept this access token"
        ),
        { code: 9, details: "Meta didn't accept this access token" }
      )
    );

    const { stdout, stderr, error } = await runCommand([
      "sipnet:numbers:linkWhatsApp",
      "--phone-number-id",
      PHONE_NUMBER_ID,
      "--app",
      APP_REF,
      "--yes"
    ]);

    expect(error?.message).to.equal(
      "Failed to link number: Meta didn't accept this access token"
    );
    expect(error?.oclif?.exit).to.equal(1);
    const everything = `${stdout}${stderr}${error?.message}`;
    expect(everything).to.not.contain(ACCESS_TOKEN);
    expect(everything).to.not.contain(SIP_PASSWORD);
  });

  it("trims the number and the password", async function () {
    process.env.WHATSAPP_SIP_PASSWORD = ` ${SIP_PASSWORD}\n`;

    await runCommand([
      "sipnet:numbers:linkWhatsApp",
      ` ${PHONE} `,
      "--app",
      APP_REF,
      "--yes"
    ]);

    expect(linkWhatsApp.firstCall.args[0]).to.include({
      phoneNumber: PHONE,
      sipPassword: SIP_PASSWORD
    });
  });
});
