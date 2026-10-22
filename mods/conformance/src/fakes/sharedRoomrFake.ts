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
import { FakeRoomr } from "@fonoster/roomr/fake";

// One roomr-fake per test process (extract-roomr 2.3): every FakeSessionNode and FakeRoomr starts
// its nodes in it. It runs $ROOMR_FAKE_BIN when set, else the binary this package's postinstall
// downloaded for the pinned @fonoster/roomr version (scripts/fetch-roomr-fake.cjs), else the
// fonoster/roomr-fake image of that version with host networking. NATS: $ROOMR_FAKE_NATS, else
// $CONFORMANCE_NATS_URL, else localhost (the fake runs without NATS and keeps retrying).

/** The binary fetch-roomr-fake.cjs downloaded, if it did. */
function downloadedBinary(): string | undefined {
  try {
    // The package's exports do not list package.json: read it next to dist/.
    const pkg = path.join(
      require.resolve("@fonoster/roomr"),
      "..",
      "..",
      "package.json"
    );
    const { version } = JSON.parse(fs.readFileSync(pkg, "utf8"));
    const file = path.join(
      __dirname,
      "..",
      "..",
      ".roomr-fake",
      version,
      "roomr-fake"
    );
    return fs.existsSync(file) ? file : undefined;
  } catch {
    return undefined;
  }
}

let shared: Promise<FakeRoomr> | undefined;

export function sharedRoomrFake(): Promise<FakeRoomr> {
  if (!shared) {
    shared = FakeRoomr.start({
      binary: process.env.ROOMR_FAKE_BIN ?? downloadedBinary(),
      nats:
        process.env.ROOMR_FAKE_NATS ??
        process.env.CONFORMANCE_NATS_URL ??
        "nats://127.0.0.1:4222"
    });
    shared.then(
      (fake) => {
        process.once("exit", () => void fake.stop());
      },
      () => (shared = undefined)
    );
  }
  return shared;
}
