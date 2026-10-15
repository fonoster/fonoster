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
import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { expect } from "chai";
import {
  loadServiceConfig,
  resolveSecretRef,
  resolveSecretRefs
} from "../../src";
import { z } from "zod";

describe("@common[config/resolveSecretRefs]", function () {
  const dir = mkdtempSync(join(tmpdir(), "secret-refs-"));
  mkdirSync(join(dir, "fonoster-db"));
  writeFileSync(join(dir, "fonoster-db", "url"), "postgres://u:p@db/x\n");
  writeFileSync(join(dir, "plain"), "s3cr3t");

  it("resolves secret://env/NAME", function () {
    expect(
      resolveSecretRef("secret://env/DG_KEY", { env: { DG_KEY: "dg" } })
    ).to.equal("dg");
  });

  it("resolves secret://file/<path> and drops one trailing newline", function () {
    expect(resolveSecretRef(`secret://file${join(dir, "plain")}`)).to.equal(
      "s3cr3t"
    );
    expect(
      resolveSecretRef(`secret://file${join(dir, "fonoster-db", "url")}`)
    ).to.equal("postgres://u:p@db/x");
  });

  it("resolves secret://k8s/<secret>#<key> from the mounted Secrets dir", function () {
    expect(
      resolveSecretRef("secret://k8s/fonoster-db#url", {
        env: { FONOSTER_SECRETS_DIR: dir }
      })
    ).to.equal("postgres://u:p@db/x");
  });

  it("accepts the pod's namespace and refuses another one", function () {
    const env = { FONOSTER_SECRETS_DIR: dir, POD_NAMESPACE: "fonoster" };
    expect(
      resolveSecretRef("secret://k8s/fonoster/fonoster-db#url", { env })
    ).to.equal("postgres://u:p@db/x");
    expect(() =>
      resolveSecretRef("secret://k8s/other/fonoster-db#url", { env })
    ).to.throw(/namespace other/);
  });

  it("walks objects and arrays and names the key path on errors, never the value", function () {
    const out = resolveSecretRefs(
      {
        a: { b: ["secret://env/ONE", "literal", { c: "x secret://env/ONE" }] }
      },
      { env: { ONE: "1" } }
    );
    expect(out).to.deep.equal({
      a: { b: ["1", "literal", { c: "x secret://env/ONE" }] }
    });
    expect(() =>
      resolveSecretRefs(
        { providers: { dg: { key: "secret://env/MISSING" } } },
        { env: {} }
      )
    ).to.throw(
      "providers.dg.key: secret://env/MISSING: environment variable MISSING is not set"
    );
  });

  it("rejects malformed and unknown references", function () {
    expect(() => resolveSecretRef("secret://vault/x")).to.throw(
      /unsupported reference/
    );
    expect(() => resolveSecretRef("secret://k8s/db")).to.throw(
      /missing #<key>/
    );
    expect(() => resolveSecretRef("secret://env/1BAD")).to.throw(
      /invalid variable name/
    );
    expect(() =>
      resolveSecretRef(`secret://file${join(dir, "nope")}`)
    ).to.throw(/ENOENT/);
  });

  it("is applied by loadServiceConfig before validation", function () {
    const file = join(dir, "svc.yaml");
    writeFileSync(
      file,
      "db: secret://k8s/fonoster-db#url\ntoken: secret://env/TOKEN\n"
    );
    const config = loadServiceConfig({
      service: "svc",
      schema: z.object({
        db: z.string().startsWith("postgres://"),
        token: z.string()
      }),
      argv: ["node", "x", "--config", file],
      env: { FONOSTER_SECRETS_DIR: dir, TOKEN: "t" }
    });
    expect(config).to.deep.equal({ db: "postgres://u:p@db/x", token: "t" });
  });
});
