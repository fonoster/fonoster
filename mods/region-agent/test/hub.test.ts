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
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Writable } from "stream";
import { main } from "../src/cli";
import { HUB_FILES, initHub } from "../src/hub";

const TLS = { certFile: "/certs/tls.crt", keyFile: "/certs/tls.key" };

describe("@region-agent fonoster-region hub init", function () {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "region-hub-"));
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("writes the hub config, seeds, credentials and signing key, all 0600", function () {
    const r = initHub(dir, { leafTls: TLS });
    expect(r.kept).to.deep.equal([]);
    expect(r.created.sort()).to.deep.equal(Object.values(HUB_FILES).sort());
    Object.values(HUB_FILES).forEach((f) =>
      expect(fs.statSync(path.join(dir, f)).mode & 0o777, f).to.equal(0o600)
    );
    const conf = fs.readFileSync(path.join(dir, HUB_FILES.conf), "utf8");
    expect(conf).to.contain("operator: ");
    expect(conf).to.contain("port: 7422");
    expect(conf).to.contain(
      'tls { cert_file: "/certs/tls.crt", key_file: "/certs/tls.key" }'
    );
    expect(
      fs.readFileSync(path.join(dir, HUB_FILES.signingKey), "utf8")
    ).to.contain("BEGIN PRIVATE KEY");
    expect(
      fs.readFileSync(path.join(dir, HUB_FILES.controlPlaneCreds), "utf8")
    ).to.contain("BEGIN NATS USER JWT");
  });

  it("is idempotent: a second run keeps every file untouched", function () {
    initHub(dir, { leafTls: TLS });
    const before = Object.values(HUB_FILES).map((f) =>
      fs.readFileSync(path.join(dir, f), "utf8")
    );
    const again = initHub(dir, { leafTls: TLS });
    expect(again.created).to.deep.equal([]);
    expect(again.kept.sort()).to.deep.equal(
      [HUB_FILES.conf, HUB_FILES.signingKey].sort()
    );
    expect(
      Object.values(HUB_FILES).map((f) =>
        fs.readFileSync(path.join(dir, f), "utf8")
      )
    ).to.deep.equal(before);
  });

  it("requires TLS on the leaf port unless told it is a local stack", function () {
    expect(() => initHub(dir, {})).to.throw(/needs TLS/);
    expect(() =>
      initHub(dir, { leafTls: { certFile: "/c", keyFile: "" } })
    ).to.throw(/go together/);
    initHub(dir, { allowNoTls: true });
    expect(
      fs.readFileSync(path.join(dir, HUB_FILES.conf), "utf8")
    ).to.not.contain("tls {");
  });

  it("runs as `fonoster-region hub init <dir>` and prints the next steps", async function () {
    const lines: string[] = [];
    const out = new Writable({
      write(chunk, _enc, cb) {
        lines.push(String(chunk));
        cb();
      }
    }) as unknown as NodeJS.WriteStream;
    await main(
      [
        "hub",
        "init",
        dir,
        "--leaf-tls-cert",
        "/certs/tls.crt",
        "--leaf-tls-key",
        "/certs/tls.key"
      ],
      out
    );
    const text = lines.join("");
    expect(text).to.contain("created");
    expect(text).to.contain("Next steps:");
    expect(text).to.contain(HUB_FILES.controlPlaneCreds);
    expect(fs.existsSync(path.join(dir, HUB_FILES.conf))).to.equal(true);
  });
});
