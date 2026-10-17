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
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { expect } from "chai";

// identity-client spec, "Installing the client stays lightweight" (harden-conformance 5.2): walk
// everything an install of @fonoster/identity-client pulls in and refuse Prisma, the Identity
// server and telephony runtimes.

const PACKAGE_DIR = resolve(__dirname, "..");

const FORBIDDEN = [
  /prisma/i,
  /^@fonoster\//,
  /^express$/,
  /^grpc-health-check$/,
  /^nats$/,
  /^@nats-io\//,
  /^ari-client$/,
  /^@influxdata\//,
  /^nodemailer$/
];

type Manifest = {
  name: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const readManifest = (dir: string): Manifest =>
  JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));

/** Where Node would load `name` from when required inside `fromDir`. */
function packageDir(name: string, fromDir: string) {
  return dirname(require.resolve(`${name}/package.json`, { paths: [fromDir] }));
}

/** Every package an install brings in (runtime dependencies, transitively). */
function installedTree() {
  const seen = new Map<string, string>();
  const visit = (dir: string) => {
    const manifest = readManifest(dir);
    const deps = {
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
      ...manifest.peerDependencies
    };
    for (const name of Object.keys(deps)) {
      let depDir: string;
      try {
        depDir = packageDir(name, dir);
      } catch {
        continue; // an optional or peer dependency that isn't installed
      }
      if (seen.has(depDir)) continue;
      seen.set(depDir, name);
      visit(depDir);
    }
  };
  visit(PACKAGE_DIR);
  return [...new Set(seen.values())].sort();
}

describe("@identity-client[dependencies]", function () {
  it("declares only the gRPC runtime, the proto loader and jsonwebtoken", function () {
    const { dependencies = {} } = readManifest(PACKAGE_DIR);
    expect(Object.keys(dependencies).sort()).to.deep.equal([
      "@grpc/grpc-js",
      "@grpc/proto-loader",
      "jsonwebtoken"
    ]);
  });

  it("pulls in no Prisma, Identity server or telephony runtime", function () {
    const tree = installedTree();
    expect(tree).to.include("@grpc/grpc-js");
    const forbidden = tree.filter((name) =>
      FORBIDDEN.some((re) => re.test(name))
    );
    expect(forbidden, "forbidden packages in the install tree").to.deep.equal(
      []
    );
  });

  it("publishes only the built client and its proto", function () {
    const { files } = JSON.parse(
      readFileSync(join(PACKAGE_DIR, "package.json"), "utf8")
    );
    expect(files).to.deep.equal(["dist", "proto"]);
  });
});
