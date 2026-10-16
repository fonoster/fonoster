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
import { generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import Ajv from "ajv";
import { expect } from "chai";
import {
  CallRecordWriter,
  RecordStore,
  SignedVcon,
  decodeVcon,
  fsStores
} from "../src";
import { FIXTURE_CALLS, loadFixtureCall, playFixtureCall } from "./fixtures";

// Every sealed record validates against the vCon JSON Schema pinned from
// draft-ietf-vcon-vcon-core-04, Appendix B (task 1.1, LO-B8): originals, redacted copies, later
// versions, deletion versions and erasure tombstones.

const SCHEMA = path.join(__dirname, "..", "schema", "vcon-core-04.schema.json");

function validator() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  // The schema uses draft-07 formats; ajv-formats is not installed, so the three in use are here.
  ajv.addFormat(
    "uuid",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  );
  ajv.addFormat("date-time", (s: string) =>
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(s)
  );
  ajv.addFormat("uri", (s: string) => {
    try {
      return Boolean(new URL(s));
    } catch {
      return false;
    }
  });
  return ajv.compile(JSON.parse(fs.readFileSync(SCHEMA, "utf8")));
}

const validate = validator();

/**
 * Validates one copy. Part URLs are relative to the record (`parts/<name>`, LO-B8 deviation: a
 * record moves between stores, so its parts are addressed relative to it); they are checked to
 * have exactly that shape, then resolved against a placeholder base for the schema's `uri`.
 */
function problems(signed: SignedVcon | undefined): string[] {
  expect(signed, "a signed vCon").to.not.equal(undefined);
  const vcon = decodeVcon(signed!);
  const resolve = (items: Record<string, unknown>[]) =>
    items.map((x) => {
      if (x.url === undefined) return x;
      expect(String(x.url)).to.match(/^parts\/[A-Za-z0-9._-]+$/);
      return { ...x, url: `https://records.invalid/${vcon.uuid}/${x.url}` };
    });
  const ok = validate({
    ...vcon,
    dialog: resolve(vcon.dialog),
    attachments: resolve(vcon.attachments),
    analysis: resolve(vcon.analysis)
  });
  return ok
    ? []
    : (validate.errors ?? []).map(
        (e) =>
          `${e.instancePath || "/"} ${e.message} ${JSON.stringify(e.params)}`
      );
}

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const KEY = {
  kid: "k1",
  privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
};

describe("@callrecord vCon schema (draft-ietf-vcon-vcon-core-04)", function () {
  let dir: string;
  let store: RecordStore;
  let writer: CallRecordWriter;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "callrecord-schema-"));
    const stores = fsStores(dir);
    store = stores.store;
    writer = new CallRecordWriter({
      ...stores,
      key: KEY,
      region: "us-east"
    });
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("pins the draft's schema file", function () {
    const schema = JSON.parse(fs.readFileSync(SCHEMA, "utf8"));
    expect(schema.$id).to.equal(
      "https://ietf.org/vcon/schemas/unsigned-vcon.json"
    );
    expect(schema.properties.vcon.const).to.equal("0.4.0");
  });

  FIXTURE_CALLS.forEach((name) => {
    it(`fixture ${name}: the original and the redacted copy are valid`, async function () {
      const fixture = loadFixtureCall(name);
      await playFixtureCall(writer, fixture);
      const v = (await store.getVersion(fixture.callRef))!;
      expect(problems(v.signed)).to.deep.equal([]);
      expect(problems(v.redacted)).to.deep.equal([]);
    });
  });

  it("later versions, deletions and erasure tombstones are valid", async function () {
    const fixture = loadFixtureCall("card-number");
    await playFixtureCall(writer, fixture);
    const ref = fixture.callRef;
    const current = async (label: string) => {
      const v = (await store.getVersion(ref))!;
      expect(problems(v.signed), label).to.deep.equal([]);
      expect(problems(v.redacted), `${label} (redacted)`).to.deep.equal([]);
    };
    await writer.addVersion(ref, {
      analysis: [{ type: "summary", vendor: "fonoster", body: "A payment." }]
    });
    await current("addition");
    await writer.deleteParts(ref, ["recording"], {
      reason: "retention",
      actor: "system:retention"
    });
    await current("recording deleted");
    await writer.deleteParts(ref, ["transcript"], {
      reason: "request",
      actor: "u1"
    });
    await current("transcript deleted");
    const { version } = await writer.erase(ref, {
      reason: "erasure request",
      actor: "u1"
    });
    const tomb = (await store.getVersion(ref, version))!;
    expect(problems(tomb.signed)).to.deep.equal([]);
  });
});
