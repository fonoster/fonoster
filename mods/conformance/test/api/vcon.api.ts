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
import { execFile } from "child_process";
import { generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import {
  CallRecordWriter,
  SignedVcon,
  decodeVcon,
  fsStores,
  withPartUrls
} from "@fonoster/callrecord";
import Ajv from "ajv";
import { expect } from "chai";
import {
  FIXTURE_CALLS,
  loadFixtureCall,
  playFixtureCall
} from "../../../callrecord/test/fixtures";

// call-record "Additions after sealing create new versions / An added analysis names its dialog"
// (API-073 in mods/conformance/catalog/areas/api.md). Every fixture call's vCons, as the records
// API returns them (absolute part urls), through vcon-lib 0.10.0, the vCon authors' reference
// library, and the pinned draft-04 schema: originals, redacted copies, a later version, two
// deletions and an erasure tombstone. CI installs vcon-lib (vcon-requirements.txt) and sets
// VCON_PYTHON to that interpreter.

const run = promisify(execFile);
const PYTHON = process.env.VCON_PYTHON;
const VALIDATE = path.join(__dirname, "vcon_validate.py");
const SCHEMA = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "callrecord",
  "schema",
  "vcon-core-04.schema.json"
);

function schemaValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false });
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

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const KEY = {
  kid: "k1",
  privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
};

describe("@api call-record: vCons pass the vCon validator", function () {
  this.timeout(60_000);
  let dir: string;
  let corpus: string;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "api-vcon-records-"));
    corpus = fs.mkdtempSync(path.join(os.tmpdir(), "api-vcon-corpus-"));
  });
  after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(corpus, { recursive: true, force: true });
  });

  it("[API-073] every sealed copy, later version and tombstone passes vcon-lib and the -04 schema", async function () {
    expect(
      PYTHON,
      "VCON_PYTHON must name a Python with vcon-lib 0.10.0 (mods/conformance/test/api/vcon-requirements.txt)"
    ).to.be.a("string").and.not.empty;
    const stores = fsStores(dir);
    const writer = new CallRecordWriter({
      ...stores,
      key: KEY,
      region: "us-east"
    });
    const files: string[] = [];
    // A copy as GET /api/records/:callRef returns it.
    const save = (
      label: string,
      callRef: string,
      version: number,
      signed: SignedVcon
    ) => {
      const vcon = withPartUrls(
        decodeVcon(signed),
        (name) =>
          `https://api.example.com/api/records/${encodeURIComponent(callRef)}/parts/${name}?version=${version}`
      );
      const file = path.join(corpus, `${label}.json`);
      fs.writeFileSync(file, JSON.stringify(vcon));
      files.push(file);
    };
    const saveCurrent = async (label: string, callRef: string) => {
      const v = (await stores.store.getVersion(callRef))!;
      save(`${label}.original`, callRef, v.version, v.signed);
      save(`${label}.redacted`, callRef, v.version, v.redacted);
    };

    for (const name of FIXTURE_CALLS) {
      const fixture = loadFixtureCall(name);
      await playFixtureCall(writer as never, fixture);
      await saveCurrent(name, fixture.callRef);
    }
    const ref = loadFixtureCall("card-number").callRef;
    await writer.addVersion(ref, {
      analysis: [{ type: "summary", vendor: "fonoster", body: "A payment." }]
    });
    await saveCurrent("card-number.addition", ref);
    await writer.deleteParts(ref, ["recording"], {
      reason: "retention",
      actor: "system:retention"
    });
    await saveCurrent("card-number.recording-deleted", ref);
    await writer.deleteParts(ref, ["transcript"], {
      reason: "request",
      actor: "u1"
    });
    await saveCurrent("card-number.transcript-deleted", ref);
    const { version } = await writer.erase(ref, {
      reason: "erasure request",
      actor: "u1"
    });
    const tomb = (await stores.store.getVersion(ref, version))!;
    save("card-number.tombstone", ref, version, tomb.signed);

    const { stdout } = await run(PYTHON!, ["-I", VALIDATE, ...files]);
    const results = JSON.parse(stdout) as {
      file: string;
      valid: boolean;
      errors: string[];
    }[];
    expect(results.map((r) => r.file)).to.deep.equal(files);
    const failed = results
      .filter((r) => !r.valid)
      .map((r) => `${path.basename(r.file)}: ${r.errors.join("; ")}`);
    expect(failed, "vcon-lib 0.10.0").to.deep.equal([]);

    const validate = schemaValidator();
    const invalid = files.flatMap((file) =>
      validate(JSON.parse(fs.readFileSync(file, "utf8")))
        ? []
        : [
            `${path.basename(file)}: ${(validate.errors ?? [])
              .map((e) => `${e.instancePath || "/"} ${e.message}`)
              .join("; ")}`
          ]
    );
    expect(invalid, "draft-04 schema").to.deep.equal([]);
  });
});
