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
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { runWithDatabase } from "../../../common/src/registry/cli";
import {
  createTestDb,
  TestDb,
  testDatabaseUrl
} from "../../../common/test/persistence/testDb";
import { applyCatalog } from "../../src/core/applyCatalog";

// add-self-host-installer 1.2: the apiserver applies `catalog.file` on every start. The stack's
// catalog (ops/rebuild/config/catalog-seed.yaml) against a throwaway Postgres.

const SEED = path.join(
  __dirname,
  "../../../../ops/rebuild/config/catalog-seed.yaml"
);

describe("@apiserver[catalog on boot]", function () {
  this.timeout(120_000);
  let db: TestDb;
  let tmp: string;

  /** Every catalog row (with timestamps) and the audit count: equal snapshots = no row changed. */
  const snapshot = async () =>
    JSON.stringify({
      providers: await db.prisma.registryProvider.findMany({
        orderBy: { id: "asc" }
      }),
      models: await db.prisma.registryModel.findMany({
        orderBy: { id: "asc" }
      }),
      voices: await db.prisma.registryVoice.findMany({
        orderBy: { id: "asc" },
        include: { models: { orderBy: { position: "asc" } } }
      }),
      audit: await db.prisma.registryAudit.count()
    });

  before(async function () {
    if (!testDatabaseUrl()) return this.skip();
    db = (await createTestDb())!;
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-boot-"));
  });

  after(async function () {
    await db?.drop();
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("first boot populates the catalog", async function () {
    const lines = await applyCatalog(SEED, db.prisma);
    expect(lines[0]).to.match(/^\+ add provider/);
    const providers = await db.prisma.registryProvider.findMany();
    expect(providers.map((p: { id: string }) => p.id)).to.include.members([
      "deepgram",
      "openai"
    ]);
    expect(await db.prisma.registryModel.count()).to.be.greaterThan(0);
    expect(await db.prisma.registryVoice.count()).to.be.greaterThan(0);
  });

  it("a restart with the same file changes no rows", async function () {
    const before = await snapshot();
    expect(await applyCatalog(SEED, db.prisma)).to.deep.equal(["no changes"]);
    expect(await snapshot()).to.equal(before);
  });

  it("an operator-added entry survives a restart", async function () {
    const out: string[] = [];
    const code = await runWithDatabase(
      [
        "add-model",
        "openai/operator-added-model",
        "--type",
        "llm",
        "--features",
        "streaming,tool-calling"
      ],
      (l) => out.push(l),
      { prisma: db.prisma, actor: "ops@fonoster" }
    );
    expect(code, out.join("\n")).to.equal(0);
    const before = await snapshot();
    expect(await applyCatalog(SEED, db.prisma)).to.deep.equal(["no changes"]);
    expect(await snapshot()).to.equal(before);
    expect(
      await db.prisma.registryModel.findUnique({
        where: { id: "openai/operator-added-model" }
      })
    ).to.not.equal(null);
  });

  it("a changed file updates listed entries and keeps the rest", async function () {
    const file = path.join(tmp, "catalog.yaml");
    fs.writeFileSync(
      file,
      fs
        .readFileSync(SEED, "utf8")
        .replace(
          "languages: [en, es], settings: [], state: active",
          "languages: [en, es, multi], settings: [], state: active"
        )
    );
    const lines = await applyCatalog(file, db.prisma);
    expect(lines).to.have.length(1);
    expect(lines[0]).to.match(/update model deepgram\/aura-2/);
    expect(
      await db.prisma.registryModel.findUnique({
        where: { id: "openai/operator-added-model" }
      })
    ).to.not.equal(null);
  });

  it("an unreadable file is an error naming the key", async function () {
    let err: Error | undefined;
    try {
      await applyCatalog(path.join(tmp, "missing.yaml"), db.prisma);
    } catch (e) {
      err = e as Error;
    }
    expect(err?.message).to.match(
      /^catalog.file .*missing.yaml could not be read/
    );
  });
});
