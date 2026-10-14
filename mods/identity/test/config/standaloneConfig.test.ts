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
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { expect } from "chai";
import { loadConfig } from "../../src/server/config";
import { createSendEmail } from "../../src/utils/createSendEmail";

const KEYS = "  keys:\n    privateKey: test-private\n    publicKey: test-public\n";

describe("@identity[server/config]", function () {
  let dir: string;

  beforeEach(function () {
    dir = mkdtempSync(join(tmpdir(), "fonoster-identity-"));
  });

  afterEach(function () {
    rmSync(dir, { recursive: true, force: true });
  });

  const load = (name: string, body: string) => {
    const path = join(dir, name);
    writeFileSync(path, body);
    return loadConfig(["node", "identity", "--config", path]);
  };

  it("loads the identity: section with the reconciled defaults", function () {
    const { identityConfig, httpBridgePort, appUrl } = load(
      "identity.yaml",
      [
        "domain: voice.acme.com",
        "database:",
        "  url: postgresql://u:p@db/identity",
        "encryption:",
        "  key: k",
        "identity:",
        KEYS
      ].join("\n")
    );

    expect(appUrl).to.equal("https://voice.acme.com");
    expect(httpBridgePort).to.equal(9000);
    expect(identityConfig.issuer).to.equal("https://voice.acme.com");
    expect(identityConfig.refreshTokenExpiresIn).to.equal("24h");
    expect(identityConfig.workspaceInviteExpiration).to.equal("1d");
    expect(identityConfig.workspaceInviteUrl).to.equal(
      "https://voice.acme.com/invites"
    );
    expect(identityConfig.smtpConfig).to.be.undefined;
    expect(identityConfig.auth).to.deep.equal({
      methods: ["password"],
      signup: "invite"
    });
  });

  it("maps smtp.user/password to the runtime shape", function () {
    const { identityConfig } = load(
      "identity.yaml",
      [
        "domain: voice.acme.com",
        "database: { url: postgresql://db/identity }",
        "encryption: { key: k }",
        "smtp: { host: smtp.acme.com, sender: no-reply@acme.com, user: ops, password: pw }",
        "identity:",
        KEYS
      ].join("\n")
    );

    expect(identityConfig.smtpConfig).to.deep.equal({
      host: "smtp.acme.com",
      port: 587,
      secure: false,
      sender: "no-reply@acme.com",
      auth: { user: "ops", pass: "pw" }
    });
  });

  it("still accepts the original identity.json layout", function () {
    const { identityConfig, defaultUser } = load(
      "identity.json",
      JSON.stringify({
        database: { url: "postgresql://db/identity" },
        encryptionKey: "k",
        issuer: "https://id.acme.com",
        audience: "api",
        keys: { privateKey: "test-private", publicKey: "test-public" },
        invite: { url: "https://acme.com/i", failUrl: "https://acme.com/f", expiration: "2d" },
        smtp: { host: "smtp", port: 25, sender: "s", auth: { user: "u", pass: "p" } },
        defaultUser: { name: "Admin", email: "admin@acme.com", password: "changeme1" }
      })
    );

    expect(identityConfig.issuer).to.equal("https://id.acme.com");
    expect(identityConfig.encryptionKey).to.equal("k");
    expect(identityConfig.workspaceInviteExpiration).to.equal("2d");
    expect(identityConfig.smtpConfig?.auth).to.deep.equal({ user: "u", pass: "p" });
    expect(defaultUser?.email).to.equal("admin@acme.com");
  });

  it("requires a domain, appUrl or issuer", function () {
    expect(() =>
      load(
        "identity.yaml",
        ["database: { url: x }", "encryption: { key: k }", "identity:", KEYS].join("\n")
      )
    ).to.throw(/domain: set domain/);
  });

  it("rejects unknown keys inside the identity section", function () {
    expect(() =>
      load(
        "identity.yaml",
        [
          "domain: voice.acme.com",
          "database: { url: x }",
          "encryption: { key: k }",
          "identity:",
          KEYS,
          "  isuer: typo"
        ].join("\n")
      )
    ).to.throw(/identity: unknown key "isuer"/);
  });
});

describe("@identity[utils/createSendEmail]", function () {
  it("fails clearly when smtp isn't configured", async function () {
    const send = createSendEmail({} as never);
    let message = "";
    try {
      await (send as unknown as () => Promise<void>)();
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).to.match(/smtp is not configured/);
  });
});
