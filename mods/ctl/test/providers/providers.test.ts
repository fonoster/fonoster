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

describe("@ctl[providers]", function () {
  beforeEach(function () {
    stubClient(sandbox);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("lists the catalog filtered by kind and type", async function () {
    const list = sandbox.stub(SDK.Providers.prototype, "listCatalog").resolves({
      items: [
        {
          id: "deepgram/nova-3",
          kind: "model",
          state: "active",
          providerId: "deepgram",
          type: "stt",
          languages: ["en", "es", "fr", "de", "it", "pt", "nl"]
        },
        {
          id: "deepgram/nova-2",
          kind: "model",
          state: "deprecated",
          providerId: "deepgram",
          type: "stt",
          replacement: "deepgram/nova-3"
        }
      ]
    });

    const { stdout } = await runCommand([
      "providers:catalog",
      "--kind",
      "model",
      "--type",
      "stt"
    ]);

    expect(list).to.have.been.calledOnceWith({ kind: "model", type: "stt" });
    expect(stdout).to.contain("deepgram/nova-3");
    expect(stdout).to.contain("+1");
    expect(stdout).to.contain("deprecated → deepgram/nova-3");
  });

  it("sets a vendor key from the flag", async function () {
    const set = sandbox
      .stub(SDK.Providers.prototype, "setProviderKey")
      .resolves({
        ref: "pk-1",
        providerId: "deepgram",
        secretRef: "sec-1",
        createdAt: new Date(),
        updatedAt: new Date()
      });

    const { stdout } = await runCommand([
      "providers:keys:set",
      "deepgram",
      "--key",
      "dg-key"
    ]);

    expect(set).to.have.been.calledOnceWith({
      providerId: "deepgram",
      key: "dg-key"
    });
    expect(stdout).to.contain("Key set for deepgram.");
    expect(stdout).to.not.contain("dg-key");
  });

  it("lists vendor keys without the keys", async function () {
    sandbox.stub(SDK.Providers.prototype, "listProviderKeys").resolves({
      items: [
        {
          ref: "pk-1",
          providerId: "elevenlabs",
          secretRef: "sec-1",
          createdAt: new Date("2026-10-15T10:00:00Z"),
          updatedAt: new Date("2026-10-15T11:00:00Z")
        }
      ]
    });

    const { stdout } = await runCommand(["providers:keys:list"]);

    expect(stdout).to.contain("elevenlabs");
    expect(stdout).to.contain("2026-10-15T11:00:00Z");
  });

  it("deletes a vendor key", async function () {
    const del = sandbox
      .stub(SDK.Providers.prototype, "deleteProviderKey")
      .resolves({ providerId: "deepgram" });

    const { stdout } = await runCommand(["providers:keys:delete", "deepgram"]);

    expect(del).to.have.been.calledOnceWith("deepgram");
    expect(stdout).to.contain("Done!");
  });
});
