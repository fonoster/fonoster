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
import { expect } from "chai";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parse } from "yaml";
import { loadServiceConfig } from "@fonoster/common";
import {
  fonosterConfigSchema,
  SHARED_VALUE_PATHS
} from "../../../mods/apiserver/src/config/schema";
import {
  expandEnv,
  readEnvFile
} from "../../../mods/common/src/config/envFile";

// The documented upgrade (docs-site/self-hosting/upgrade.mdx) from a 0.39 install, made by
// fonoster-config with an override merged into config/fonoster.yaml and SIP_PORT=15060:
//
//   unpack the new release next to it; cp .env, config/keys, config/tls; copy the edited files;
//   ./init.sh
//
// .env, the keys and the certificates stay as they were, the edited file is the one that runs,
// and the SIP port survives in the new release's routr-edgeport.yaml.

const BUNDLE = path.join(__dirname, "..");
const FIXTURE = path.join(__dirname, "fixtures", "install-0.39");

const sh = (cmd: string, cwd: string) =>
  execFileSync("sh", ["-ec", cmd], { cwd, encoding: "utf8" });

/** Every file under a folder with its content. */
function tree(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of fs.readdirSync(dir, { withFileTypes: true, recursive: true }))
    if (e.isFile()) {
      const p = path.join(e.parentPath, e.name);
      out[path.relative(dir, p)] = fs.readFileSync(p, "utf8");
    }
  return out;
}

describe("@bundle upgrade from a 0.39 install", function () {
  this.timeout(60000);

  it("keeps .env, keys, tls, the edited config and SIP_PORT", function () {
    // Arrange: the 0.39 install in /opt/fonoster, with the keys and certificate its init made.
    const opt = fs.mkdtempSync(path.join(os.tmpdir(), "upgrade-"));
    const old = path.join(opt, "fonoster");
    fs.cpSync(FIXTURE, old, { recursive: true });
    fs.renameSync(path.join(old, "env"), path.join(old, ".env"));
    sh(
      `mkdir -p config/keys config/tls
       openssl genrsa 2048 2>/dev/null | openssl pkcs8 -topk8 -nocrypt > config/keys/private.pem
       openssl pkey -in config/keys/private.pem -pubout > config/keys/public.pem
       openssl ecparam -name prime256v1 -genkey -noout | openssl pkcs8 -topk8 -nocrypt > config/keys/records.pem`,
      old
    );
    // 0.39's init made the certificate for these names; the new init.sh keeps it.
    sh(
      `printf '[req]\\ndistinguished_name=d\\nprompt=no\\n[d]\\nCN=ca\\n[x]\\nbasicConstraints=critical,CA:TRUE\\nkeyUsage=keyCertSign\\n[s]\\nsubjectAltName=DNS:localhost,IP:127.0.0.1,IP:203.0.113.10\\n' > /tmp/upgrade-$$.cnf
       openssl ecparam -name prime256v1 -genkey -noout | openssl pkcs8 -topk8 -nocrypt > config/tls/ca-key.pem
       openssl req -new -x509 -key config/tls/ca-key.pem -days 3650 -config /tmp/upgrade-$$.cnf -extensions x -out config/tls/ca.pem
       openssl ecparam -name prime256v1 -genkey -noout | openssl pkcs8 -topk8 -nocrypt > config/tls/server-key.pem
       printf '[req]\\ndistinguished_name=d\\nprompt=no\\n[d]\\nCN=localhost\\n' > /tmp/upgrade-$$.srv.cnf
       openssl req -new -key config/tls/server-key.pem -config /tmp/upgrade-$$.srv.cnf -out /tmp/upgrade-$$.csr
       openssl x509 -req -in /tmp/upgrade-$$.csr -CA config/tls/ca.pem -CAkey config/tls/ca-key.pem -days 397 -set_serial 7 -extfile /tmp/upgrade-$$.cnf -extensions s -out config/tls/server.pem 2>/dev/null
       rm -f /tmp/upgrade-$$.*`,
      old
    );
    const oldEnv = fs.readFileSync(path.join(old, ".env"), "utf8");
    const oldKeys = tree(path.join(old, "config", "keys"));
    const oldTls = tree(path.join(old, "config", "tls"));
    // The new release, unpacked next to it (the archive's fonoster/ folder).
    const next = path.join(opt, "fonoster-next");
    fs.mkdirSync(next);
    fs.cpSync(path.join(BUNDLE, "config"), path.join(next, "config"), {
      recursive: true
    });
    // The archive's init.sh carries its version (ops/release/bundle sets it).
    fs.writeFileSync(
      path.join(next, "init.sh"),
      fs
        .readFileSync(path.join(BUNDLE, "init.sh"), "utf8")
        .replace(/^FONOSTER_VERSION=.*$/m, "FONOSTER_VERSION=0.41.0")
    );

    // Act: the documented commands.
    sh(
      `cp -a ${old}/.env ${next}/ && cp -a ${old}/config/keys ${old}/config/tls ${next}/config/
       cp ${old}/config/fonoster.yaml ${next}/config/fonoster.yaml
       sh ${next}/init.sh --dir ${next}`,
      opt
    );

    // Assert
    const newEnv = fs.readFileSync(path.join(next, ".env"), "utf8");
    // Every 0.39 line as it was but the release's version; only the names this release adds
    // follow.
    const expected = oldEnv.replace(
      /^FONOSTER_VERSION=0\.39\.0$/m,
      "FONOSTER_VERSION=0.41.0"
    );
    expect(expected).to.not.equal(oldEnv);
    expect(newEnv.startsWith(expected)).to.equal(true);
    expect(
      newEnv
        .slice(expected.length)
        .split("\n")
        .filter((l) => /^[A-Z_]+=/.test(l))
        .map((l) => l.split("=")[0])
    ).to.deep.equal([
      "NATS_REGION_AGENT_PASSWORD",
      "FONOSTER_REGION_SECRETS_KEY"
    ]);
    expect(tree(path.join(next, "config", "keys"))).to.deep.equal(oldKeys);
    expect(tree(path.join(next, "config", "tls"))).to.deep.equal(oldTls);

    const env = expandEnv(readEnvFile(path.join(next, ".env")));
    const api = path.join(next, "config", "fonoster.check.json");
    fs.writeFileSync(
      api,
      JSON.stringify(
        parse(
          fs.readFileSync(path.join(next, "config", "fonoster.yaml"), "utf8")
        )
      ).replace(/\/opt\/fonoster\//g, `${next}/`)
    );
    const loaded = loadServiceConfig({
      service: "apiserver",
      schema: fonosterConfigSchema,
      argv: ["node", "x", "--config", api],
      env,
      interpolatePaths: SHARED_VALUE_PATHS
    }) as { database: { url: string } };
    expect(loaded.database.url).to.equal(
      "postgresql://fonoster:s0verride0password@db.example.com:25060/fonoster?sslmode=require"
    );

    const ports = parse(
      fs.readFileSync(path.join(next, "config", "routr-edgeport.yaml"), "utf8")
    )
      .spec.transport.filter((t: { protocol: string }) =>
        ["tcp", "udp"].includes(t.protocol)
      )
      .map((t: { port: unknown }) => t.port);
    expect(ports).to.deep.equal([15060, 15060]);
  });
});
