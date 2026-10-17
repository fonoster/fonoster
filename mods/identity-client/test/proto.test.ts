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
import { execFileSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { expect } from "chai";

// identity-client spec, "The proto comes from the canonical source" (harden-conformance 5.3): the
// proto the client loads is byte-for-byte @fonoster/common's identity.proto, and no copy is
// committed anywhere else.

const ROOT = resolve(__dirname, "../../..");
const CANONICAL = join(ROOT, "mods/common/src/protos/identity.proto");
const CLIENT_COPY = join(ROOT, "mods/identity-client/proto/identity.proto");

describe("@identity-client[proto]", function () {
  it("loads the same identity.proto as @fonoster/common", function () {
    expect(
      existsSync(CLIENT_COPY),
      "run `npm run build` to copy the proto"
    ).to.equal(true);
    expect(readFileSync(CLIENT_COPY).equals(readFileSync(CANONICAL))).to.equal(
      true,
      "mods/identity-client/proto/identity.proto differs from mods/common's; rebuild the client"
    );
  });

  it("commits no copy of identity.proto outside @fonoster/common", function () {
    const committed = execFileSync("git", ["ls-files", "*identity.proto"], {
      cwd: ROOT,
      encoding: "utf8"
    })
      .split("\n")
      .filter(Boolean);
    expect(committed).to.deep.equal(["mods/common/src/protos/identity.proto"]);
  });
});
