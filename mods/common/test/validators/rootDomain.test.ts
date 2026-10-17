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
import * as path from "path";
import { pathToFileURL } from "url";
import { expect } from "chai";

// fix-config-and-placement-gaps: the root domain comes from the apiserver's config
// (setRootDomain at boot), never from APISERVER_ROOT_DOMAIN / ROOT_DOMAIN.
describe("@fonoster/common root domain", function () {
  this.timeout(30000);

  it("ignores APISERVER_ROOT_DOMAIN and ROOT_DOMAIN in the environment", function () {
    const tsx = pathToFileURL(require.resolve("tsx")).href;
    const envs = path.join(__dirname, "..", "..", "src", "envs.ts");
    const out = execFileSync(
      process.execPath,
      [
        `--import=${tsx}`,
        "-e",
        `const e = require(${JSON.stringify(envs)}); const a = e.getRootDomain(); e.setRootDomain("acme.example"); console.log(JSON.stringify([a, e.getRootDomain()]))`
      ],
      {
        env: {
          PATH: process.env.PATH,
          NODE_ENV: "development",
          APISERVER_ROOT_DOMAIN: "from-env.example",
          ROOT_DOMAIN: "from-env.example"
        },
        encoding: "utf8"
      }
    );
    expect(JSON.parse(out.trim())).to.deep.equal([
      "fonoster.local",
      "acme.example"
    ]);
  });
});
