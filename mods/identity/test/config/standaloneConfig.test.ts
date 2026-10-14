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

  const base = {
    database: { url: "postgresql://u:p@db/identity" },
    encryptionKey: "k1.aesgcm256.MmPSvzCG9fk654bAbl30tsqq4h9d3N4F11hlue8bGAY=",
    issuer: "https://id.acme.com",
    keys: { privateKey: "test-private", publicKey: "test-public" }
  };

  const load = (body: Record<string, unknown>, name = "identity.json") => {
    const path = join(dir, name);
    writeFileSync(path, JSON.stringify(body));
    return loadConfig(["node", "identity", "--config", path]);
  };

  it("reads the fields at the root of identity.json, with current defaults", function () {
    const { identityConfig, httpBridgePort, appUrl, logs } = load(base);

    expect(appUrl).to.equal("https://id.acme.com");
    expect(httpBridgePort).to.equal(9000);
    expect(logs.level).to.equal("info");
    expect(identityConfig.issuer).to.equal("https://id.acme.com");
    expect(identityConfig.audience).to.equal("api");
    expect(identityConfig.encryptionKey).to.equal("k1.aesgcm256.MmPSvzCG9fk654bAbl30tsqq4h9d3N4F11hlue8bGAY=");
    expect(identityConfig.refreshTokenExpiresIn).to.equal("24h");
    expect(identityConfig.workspaceInviteExpiration).to.equal("1d");
    expect(identityConfig.workspaceInviteUrl).to.equal(
      "https://id.acme.com/invites"
    );
    expect(identityConfig.smtpConfig).to.be.undefined;
    expect(identityConfig.auth).to.deep.equal({
      methods: ["password"],
      signup: "invite"
    });
  });

  it("maps invite, smtp.auth, defaultUser and appUrl", function () {
    const { identityConfig, defaultUser, appUrl } = load({
      ...base,
      appUrl: "https://app.acme.com",
      invite: { url: "https://acme.com/i", failUrl: "https://acme.com/f", expiration: "2d" },
      smtp: { host: "smtp", port: 25, sender: "s", auth: { user: "u", pass: "p" } },
      defaultUser: { name: "Admin", email: "admin@acme.com", password: "changeme1" }
    });

    expect(appUrl).to.equal("https://app.acme.com");
    expect(identityConfig.workspaceInviteUrl).to.equal("https://acme.com/i");
    expect(identityConfig.workspaceInviteExpiration).to.equal("2d");
    expect(identityConfig.smtpConfig).to.deep.equal({
      host: "smtp",
      port: 25,
      secure: false,
      sender: "s",
      auth: { user: "u", pass: "p" }
    });
    expect(defaultUser?.email).to.equal("admin@acme.com");
  });

  it("loads YAML with the same fields", function () {
    const path = join(dir, "identity.yaml");
    writeFileSync(
      path,
      [
        "database: { url: postgresql://db/identity }",
        "encryptionKey: k1.aesgcm256.MmPSvzCG9fk654bAbl30tsqq4h9d3N4F11hlue8bGAY=",
        "issuer: https://id.acme.com",
        "keys: { privateKey: a, publicKey: b }"
      ].join("\n")
    );
    const { identityConfig } = loadConfig(["node", "identity", "--config", path]);
    expect(identityConfig.issuer).to.equal("https://id.acme.com");
  });

  it("requires an issuer", function () {
    const { issuer: _issuer, ...rest } = base;
    expect(() => load(rest)).to.throw(/issuer: Required/);
  });

  it("rejects an encryption key cloak can't use", function () {
    expect(() =>
      load({ ...base, encryptionKey: "change-me-to-a-long-random-string" })
    ).to.throw(/encryptionKey: must look like "k1.aesgcm256/);
  });

  it("rejects unknown keys", function () {
    expect(() => load({ ...base, isuer: "typo" })).to.throw(
      /unknown key "isuer"/
    );
    expect(() =>
      load({ ...base, tokens: { refreshTokenExpiresIn: "7d", extra: 1 } })
    ).to.throw(/tokens: unknown key "extra"/);
  });

  it("rejects the nested identity: section (that's fonoster.yaml's layout)", function () {
    expect(() => load({ ...base, identity: {} })).to.throw(
      /unknown key "identity"/
    );
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
