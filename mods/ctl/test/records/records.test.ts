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
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import * as SDK from "@fonoster/sdk";
import { runCommand } from "@oclif/test";
import * as chai from "chai";
import { expect } from "chai";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { httpUrlFor } from "../../src/AuthenticatedCommand";
import { stubClient } from "../helpers";

chai.use(sinonChai);
const sandbox = createSandbox();

const summary = {
  callRef: "call-1",
  appRef: "app-1",
  from: "+17853178070",
  to: "+18287854037",
  direction: "inbound",
  status: "sealed",
  endReason: "caller_hangup",
  failureReason: null,
  sipStatus: null,
  startedAt: "2026-10-15T10:00:00.000Z",
  endedAt: "2026-10-15T10:01:05.000Z",
  durationSeconds: 65,
  region: "local",
  version: 1,
  size: 2048,
  parts: ["recording", "transcript"]
};

describe("@ctl[records]", function () {
  let tmpDir: string;

  beforeEach(function () {
    stubClient(sandbox);
    tmpDir = mkdtempSync(join(tmpdir(), "ctl-records-"));
  });

  afterEach(function () {
    sandbox.restore();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("derives the records API URL from the workspace endpoint", function () {
    expect(httpUrlFor("localhost:16449")).to.equal("https://localhost:16449");
    expect(httpUrlFor("api.fonoster.com")).to.equal("https://api.fonoster.com");
    expect(httpUrlFor("https://api.example.com/")).to.equal(
      "https://api.example.com"
    );
  });

  it("lists records with the filters given", async function () {
    const list = sandbox
      .stub(SDK.CallRecords.prototype, "listRecords")
      .resolves({ items: [summary], nextPageToken: "next-1" });

    const { stdout } = await runCommand([
      "records:list",
      "--after",
      "2026-10-01",
      "--app",
      "app-1",
      "-s",
      "5"
    ]);

    expect(list.firstCall.args[0]).to.include({
      after: "2026-10-01",
      appRef: "app-1",
      pageSize: 5
    });
    expect(stdout).to.contain("call-1");
    expect(stdout).to.contain("+17853178070");
    expect(stdout).to.contain("caller_hangup");
    expect(stdout).to.contain("--page-token next-1");
  });

  it("shows a record summary", async function () {
    const get = sandbox.stub(SDK.CallRecords.prototype, "getRecord").resolves({
      ...summary,
      currentVersion: 2,
      redacted: true,
      // The detail lists manifest entries, not names.
      parts: [
        { name: "recording", size: 1000 },
        { name: "transcript", size: 20 }
      ] as never,
      vcon: { analysis: [{ type: "transcript", body: [{}, {}, {}] }] },
      jws: {}
    });

    const { stdout } = await runCommand([
      "records:get",
      "call-1",
      "--version",
      "1"
    ]);

    expect(get).to.have.been.calledOnceWith("call-1", {
      version: 1,
      original: false
    });
    expect(stdout).to.contain("1 of 2 (redacted)");
    expect(stdout).to.contain("recording (1000 bytes), transcript (20 bytes)");
    expect(stdout).to.contain("3 entries");
    expect(stdout).to.contain("65s");
  });

  it("downloads the recording to a file", async function () {
    const wav = Buffer.from("RIFF....WAVE");
    sandbox.stub(SDK.CallRecords.prototype, "getRecording").resolves({
      data: wav.buffer.slice(
        wav.byteOffset,
        wav.byteOffset + wav.byteLength
      ) as ArrayBuffer,
      contentType: "audio/x-wav",
      contentHash: "sha256-abc"
    });
    const output = join(tmpDir, "call.wav");

    const { stdout } = await runCommand([
      "records:download",
      "call-1",
      "-o",
      output
    ]);

    expect(readFileSync(output).toString()).to.equal("RIFF....WAVE");
    expect(stdout).to.contain("12 bytes");
    expect(stdout).to.contain("sha256-abc");
  });

  it("downloads the vCon and the signed vCon", async function () {
    sandbox.stub(SDK.CallRecords.prototype, "getRecord").resolves({
      ...summary,
      currentVersion: 1,
      redacted: true,
      vcon: { vcon: "0.0.1", uuid: "call-1" },
      jws: { payload: "eyJ", signatures: [] }
    });
    const vconFile = join(tmpDir, "call.vcon.json");
    const signedFile = join(tmpDir, "call.jws.json");

    await runCommand([
      "records:download",
      "call-1",
      "--part",
      "vcon",
      "-o",
      vconFile
    ]);
    await runCommand([
      "records:download",
      "call-1",
      "--part",
      "signed",
      "-o",
      signedFile
    ]);

    expect(JSON.parse(readFileSync(vconFile, "utf8"))).to.deep.equal({
      vcon: "0.0.1",
      uuid: "call-1"
    });
    expect(JSON.parse(readFileSync(signedFile, "utf8"))).to.have.property(
      "payload",
      "eyJ"
    );
  });

  it("reports an API error", async function () {
    sandbox
      .stub(SDK.CallRecords.prototype, "getRecord")
      .rejects(new Error("records API: 404 not_found"));

    const { error } = await runCommand(["records:get", "nope"]);

    expect(error?.message).to.contain("404 not_found");
  });
});
