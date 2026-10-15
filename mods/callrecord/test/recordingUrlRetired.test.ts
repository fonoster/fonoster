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
import * as path from "path";
import { expect } from "chai";

// add-call-record 7.2: recordings are found through the call record's recording part, never by the
// retired `${RECORDING_BASE_URL}/${appRef}_${mediaSessionRef}.wav` convention. Fails if any
// service source builds a URL that way again.

const MODS = path.join(__dirname, "..", "..");
const SERVICES = [
  "apiserver",
  "gateway",
  "autopilot",
  "voice",
  "sdk",
  "ctl",
  "common"
];

function sources(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "generated" ? [] : sources(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

describe("@callrecord[recording URL convention retired]", function () {
  it("no service builds recording URLs from appRef and a media session id", function () {
    const pattern =
      /RECORDING_BASE_URL|recordings\.baseUrl|\$\{[^}]*appRef[^}]*\}_\$\{[^}]*\}\.wav/;
    const offenders = SERVICES.flatMap((m) =>
      sources(path.join(MODS, m, "src"))
    )
      .filter((f) => pattern.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(MODS, f));
    expect(offenders).to.deep.equal([]);
  });
});
