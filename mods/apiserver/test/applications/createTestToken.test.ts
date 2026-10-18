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
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import { FonosterConfig, getSignalingServer } from "../../src/config";
import { IDENTITY_PUBLIC_KEY } from "../../src/envs";

const CONFIG = {
  username: "internal",
  domain: "internal",
  displayName: "Test Call Agent",
  targetAor: "sip:roomr@default",
  signalingServer: "ws://localhost:8449/sip"
};

describe("@applications/createTestToken (add-talk-in-browser)", function () {
  it("signs an RS256 token for the roomr Peer and the caller's workspace", async function () {
    const { createCreateTestToken } =
      await import("../../src/applications/createCreateTestToken");
    const metadata = new grpc.Metadata();
    metadata.set("accessKeyId", "WO00000000000000000000000000000001");

    const response = await new Promise<Record<string, string>>(
      (resolve, reject) =>
        createCreateTestToken(CONFIG)({ metadata, request: {} }, (err, res) =>
          err ? reject(err) : resolve(res as never)
        )
    );

    expect(response.targetAor).to.equal("sip:roomr@default");
    expect(response.signalingServer).to.equal("ws://localhost:8449/sip");
    const payload = jwt.verify(response.token, IDENTITY_PUBLIC_KEY, {
      algorithms: ["RS256"]
    }) as Record<string, unknown>;
    expect(payload).to.include({
      aorLink: "sip:roomr@default",
      targetAor: "sip:roomr@default",
      accessKeyId: "WO00000000000000000000000000000001"
    });
    expect(payload.allowedMethods).to.deep.equal(["INVITE"]);
    expect((payload.exp as number) - (payload.iat as number)).to.equal(3600);
  });

  it("derives the signaling URL from appUrl when signalingServer is unset", function () {
    const url = (c: Partial<FonosterConfig>) =>
      getSignalingServer({ domain: "fonoster.local", ...c } as FonosterConfig);
    expect(url({ appUrl: "http://localhost:8449" })).to.equal(
      "ws://localhost:8449/sip"
    );
    expect(url({ appUrl: "https://app.example.com/" })).to.equal(
      "wss://app.example.com/sip"
    );
    expect(url({})).to.equal("wss://fonoster.local/sip");
    expect(
      url({ appUrl: "http://x", signalingServer: "wss://sip.example.com" })
    ).to.equal("wss://sip.example.com");
  });
});
