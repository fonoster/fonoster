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

// ops/rebuild/merge-config.cjs (#1207): the bundle's files plus overlays, merged in order.

const SCRIPT = path.join(__dirname, "..", "merge-config.cjs");

function dirWith(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-config-"));
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), text);
  }
  return dir;
}

describe("@rebuild merge-config.cjs", function () {
  it("merges objects, replaces other values, deletes on null, applies overlays in order", function () {
    // Arrange
    const src = dirWith({
      "appbridge.yaml":
        "# comment\nnats: { url: nats://nats:4222, user: appbridge }\nrtp: { host: 0.0.0.0, advertiseHost: a }\nlist: [1, 2]\ngone: yes\n"
    });
    const first = dirWith({
      "appbridge.yaml": "rtp: { advertiseHost: b }\nlist: [3]\ngone: null\n"
    });
    const second = dirWith({ "appbridge.yaml": "rtp: { advertiseHost: c }\n" });
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "merge-config-out-"));

    // Act
    execFileSync("node", [SCRIPT, src, out, first, second]);

    // Assert
    expect(
      parse(fs.readFileSync(path.join(out, "appbridge.yaml"), "utf8"))
    ).to.deep.equal({
      nats: { url: "nats://nats:4222", user: "appbridge" },
      rtp: { host: "0.0.0.0", advertiseHost: "c" },
      list: [3]
    });
  });

  it("copies files without an overlay and folders as they are, renames examples, keeps the rest of out", function () {
    // Arrange
    const src = dirWith({
      "nats.conf": "# kept byte for byte\nport: 4222\n",
      "roomr.example.yaml": "# kept\nnodeId: a\n",
      "nats-permissions/roomr.conf": "x\n"
    });
    const out = dirWith({ "keys/private.pem": "KEY\n" });

    // Act
    execFileSync("node", [SCRIPT, src, out, path.join(src, "no-such-overlay")]);

    // Assert
    expect(fs.readFileSync(path.join(out, "nats.conf"), "utf8")).to.equal(
      "# kept byte for byte\nport: 4222\n"
    );
    expect(fs.readFileSync(path.join(out, "roomr.yaml"), "utf8")).to.equal(
      "# kept\nnodeId: a\n"
    );
    expect(
      fs.readFileSync(path.join(out, "nats-permissions/roomr.conf"), "utf8")
    ).to.equal("x\n");
    expect(
      fs.readFileSync(path.join(out, "keys/private.pem"), "utf8")
    ).to.equal("KEY\n");
  });
});
