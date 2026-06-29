/*
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
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import * as SDK from "@fonoster/sdk";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { createOrUpdateApplication } from "../src/utils/createOrUpdateApplication";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@ctl[utils/createOrUpdateApplication]", function () {
  let tmpDir: string;
  let createStub: sinon.SinonStub;
  let updateStub: sinon.SinonStub;
  const client = {} as unknown as SDK.Client;

  // A minimal but valid-shaped application config.
  const baseConfig = {
    name: "My App",
    type: "EXTERNAL",
    endpoint: "example.com"
  };

  function writeConfig(ext: string, content: unknown): string {
    const filePath = join(tmpDir, `app.${ext}`);
    const data =
      typeof content === "string" ? content : JSON.stringify(content);
    writeFileSync(filePath, data, "utf8");
    return filePath;
  }

  beforeEach(function () {
    tmpDir = mkdtempSync(join(tmpdir(), "ctl-app-"));
    createStub = sandbox
      .stub(SDK.Applications.prototype, "createApplication")
      .resolves({ ref: "created-ref" });
    updateStub = sandbox
      .stub(SDK.Applications.prototype, "updateApplication")
      .resolves({ ref: "updated-ref" });
  });

  afterEach(function () {
    sandbox.restore();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates an application when isUpdate is false", async function () {
    const filePath = writeConfig("json", baseConfig);

    await createOrUpdateApplication(client, filePath);

    expect(createStub).to.have.been.calledOnce;
    expect(updateStub).to.not.have.been.called;
    expect(createStub.firstCall.args[0]).to.include(baseConfig);
  });

  it("updates using the positional ref when provided", async function () {
    const filePath = writeConfig("json", baseConfig);

    await createOrUpdateApplication(client, filePath, "positional-ref", true);

    expect(updateStub).to.have.been.calledOnce;
    expect(createStub).to.not.have.been.called;
    expect(updateStub.firstCall.args[0]).to.have.property(
      "ref",
      "positional-ref"
    );
  });

  it("lets the positional ref override a ref in the file", async function () {
    const filePath = writeConfig("json", { ...baseConfig, ref: "file-ref" });

    await createOrUpdateApplication(client, filePath, "positional-ref", true);

    expect(updateStub.firstCall.args[0]).to.have.property(
      "ref",
      "positional-ref"
    );
  });

  it("falls back to the file ref when the positional is omitted", async function () {
    const filePath = writeConfig("yaml", `name: My App\nref: file-ref\n`);

    await createOrUpdateApplication(client, filePath, undefined, true);

    expect(updateStub).to.have.been.calledOnce;
    expect(updateStub.firstCall.args[0]).to.have.property("ref", "file-ref");
  });

  it("throws a clear error when no ref is available for an update", async function () {
    const filePath = writeConfig("json", baseConfig);

    await expect(
      createOrUpdateApplication(client, filePath, undefined, true)
    ).to.be.rejectedWith(/Application ref is required/);

    expect(updateStub).to.not.have.been.called;
    expect(createStub).to.not.have.been.called;
  });

  it("rejects unsupported file formats", async function () {
    const filePath = writeConfig("txt", "name: My App");

    await expect(
      createOrUpdateApplication(client, filePath, "ref", true)
    ).to.be.rejectedWith(/Unsupported file format/);
  });
});
