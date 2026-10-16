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
import { expect } from "chai";

describe("@voice/parseVoiceEndpoint", function () {
  it("should treat a bare host:port as plaintext", async function () {
    const { parseVoiceEndpoint } = await import(
      "../../src/voice/utils/parseVoiceEndpoint"
    );

    expect(parseVoiceEndpoint("api.example.com:50051")).to.deep.equal({
      address: "api.example.com:50051",
      secure: false
    });
  });

  it("should dial grpcs:// and https:// over TLS", async function () {
    const { parseVoiceEndpoint } = await import(
      "../../src/voice/utils/parseVoiceEndpoint"
    );

    for (const endpoint of [
      "grpcs://api.example.com:443",
      "https://api.example.com:443",
      "GRPCS://api.example.com:443"
    ]) {
      expect(parseVoiceEndpoint(endpoint)).to.deep.equal({
        address: "api.example.com:443",
        secure: true
      });
    }
  });

  it("should dial grpc:// and http:// in plaintext", async function () {
    const { parseVoiceEndpoint } = await import(
      "../../src/voice/utils/parseVoiceEndpoint"
    );

    for (const endpoint of [
      "grpc://api.example.com:50051",
      "http://api.example.com:50051"
    ]) {
      expect(parseVoiceEndpoint(endpoint)).to.deep.equal({
        address: "api.example.com:50051",
        secure: false
      });
    }
  });

  it("should reject an unsupported scheme instead of dialing it insecurely", async function () {
    const { parseVoiceEndpoint } = await import(
      "../../src/voice/utils/parseVoiceEndpoint"
    );

    expect(() => parseVoiceEndpoint("ws://api.example.com:443")).to.throw(
      /unsupported scheme "ws"/
    );
  });

  it("should leave the special local addresses alone", async function () {
    const { parseVoiceEndpoint } = await import(
      "../../src/voice/utils/parseVoiceEndpoint"
    );

    // These are substituted before reaching the dialer, but they must not be
    // mangled if they ever do.
    expect(parseVoiceEndpoint("localhost:50061").secure).to.equal(false);
    expect(parseVoiceEndpoint("").address).to.equal("");
  });
});
