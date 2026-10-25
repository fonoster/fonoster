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
import { runCommand } from "@oclif/test";
import { expect } from "chai";
import { caHint, REMOVED_INSECURE } from "../../src/BaseCommand";
import { workspaceConfigSchema } from "../../src/config/validations";

// api-client-trust: the CLI always uses TLS. --insecure is gone (with a hint to --ca-file), and
// certificate errors point at --ca-file, never at turning TLS off.

describe("@ctl[ca-file]", function () {
  it("rejects --insecure and points to --ca-file", async function () {
    const { error } = await runCommand([
      "workspaces:login",
      "--insecure",
      "--endpoint",
      "localhost:1",
      "--access-key-id",
      "WO1",
      "--access-key-secret",
      "s"
    ]);
    expect(error?.message).to.equal(REMOVED_INSECURE);
    expect(REMOVED_INSECURE).to.include("--ca-file");
  });

  it("adds the --ca-file hint to certificate errors only", function () {
    expect(
      caHint("14 UNAVAILABLE: self-signed certificate in certificate chain")
    ).to.include("--ca-file");
    expect(caHint("unable to verify the first certificate")).to.include(
      "--ca-file"
    );
    expect(caHint("Invalid credentials!")).to.equal("Invalid credentials!");
    expect(caHint("self-signed certificate")).not.to.include("insecure");
  });

  it("saves the CA file with the workspace", function () {
    const workspace = {
      endpoint: "voice.example.com",
      workspaceAccessKeyId: "WO1",
      accessKeyId: "AP1",
      accessKeySecret: "s",
      workspaceRef: "ref",
      workspaceName: "Acme",
      caFile: "/opt/fonoster/config/tls/ca.pem"
    };
    expect(workspaceConfigSchema.parse(workspace).caFile).to.equal(
      "/opt/fonoster/config/tls/ca.pem"
    );
    const { caFile: _omit, ...without } = workspace;
    expect(workspaceConfigSchema.parse(without).caFile).to.equal(undefined);
  });
});
