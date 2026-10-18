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
import { Writable } from "stream";
import { expect } from "chai";
import winston from "winston";
import { REDACTED, redactFormat, redactSecrets } from "../src/redact";

// M11: secrets in logged metadata (SIP passwords, JWTs, API key secrets) are
// replaced before any transport sees them.

describe("@logger[redact]", function () {
  it("redacts secret fields at any depth and keeps the rest", function () {
    const request = {
      ref: "cr1",
      accessKeyId: "WO123",
      tokenUse: "access",
      password: "sip-password",
      credentials: [{ username: "1001", password: "p1" }],
      headers: { Authorization: "Bearer eyJ...", "x-accesskey-id": "WO123" },
      session_token: "eyJ.session",
      accessKeySecret: "s3cr3t",
      nested: { refreshToken: "eyJ.refresh", count: 2 }
    };

    expect(redactSecrets(request)).to.deep.equal({
      ref: "cr1",
      accessKeyId: "WO123",
      tokenUse: "access",
      password: REDACTED,
      credentials: [{ username: "1001", password: REDACTED }],
      headers: { Authorization: REDACTED, "x-accesskey-id": "WO123" },
      session_token: REDACTED,
      accessKeySecret: REDACTED,
      nested: { refreshToken: REDACTED, count: 2 }
    });
    // The logged object itself is left alone.
    expect(request.password).to.equal("sip-password");
    expect(request.credentials[0].password).to.equal("p1");
  });

  it("copes with cycles", function () {
    const a: Record<string, unknown> = { password: "x" };
    a.self = a;
    const out = redactSecrets(a) as Record<string, unknown>;
    expect(out.password).to.equal(REDACTED);
  });

  it("keeps secrets out of what a logger writes", function () {
    const lines: string[] = [];
    const logger = winston.createLogger({
      format: winston.format.combine(redactFormat(), winston.format.json()),
      transports: [
        new winston.transports.Stream({
          stream: new Writable({
            write(chunk, _enc, done) {
              lines.push(chunk.toString());
              done();
            }
          })
        })
      ]
    });

    logger.info("call to createCredentials", {
      name: "office",
      password: "sip-password",
      token: "eyJhbGciOiJSUzI1NiJ9.payload.sig"
    });

    expect(lines).to.have.length(1);
    expect(lines[0]).to.include("office");
    expect(lines[0]).not.to.include("sip-password");
    expect(lines[0]).not.to.include("eyJhbGciOiJSUzI1NiJ9");
  });
});
