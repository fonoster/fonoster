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
import { expect } from "chai";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// #1180: ops/release/npm-publish.sh retries lerna publish from-package after npm provenance
// 409s, and ops/release/require-on-npm.sh stops the release when @fonoster/common is missing.
// Both run against fake `npx` and `npm` placed first on PATH.

const RELEASE = path.join(__dirname, "..");

// Real lines from release runs 40715214867 (409) and 40697419682 (EBEHIND).
const failed = (pkg: string) =>
  `lerna WARN notice Package failed to publish: ${pkg}\n` +
  "lerna ERR! TLOG_CREATE_ENTRY_ERROR error creating tlog entry - (409) an equivalent entry already exists in the transparency log with UUID 108e9186e8c5677ab61adcf818142b6005e0f79cd6be8e46bceb406d571db215dbed544d64bd4400\n" +
  'lerna ERR! errno "undefined" is not a valid exit code - exiting with code 1\n';
const EBEHIND =
  "lerna ERR! EBEHIND Local branch 'main' is behind remote upstream origin/main\n";

// Each call logs its argv to calls.log and answers with attempt-<n>.out and attempt-<n>.status
// (n counts the publish runs); `npm view` answers from the published file.
const FAKE = `#!/usr/bin/env bash
dir="$(dirname "$0")/.."
if [ "$1" = view ]; then
  n=$(( $(cat "$dir/views" 2>/dev/null || echo 0) + 1 )); echo "$n" > "$dir/views"
  grep -qxF "$2" "$dir/published" 2>/dev/null && echo "\${2##*@}"
  [ -f "$dir/published-after" ] && [ "$n" -ge "$(cat "$dir/published-after")" ] && echo "\${2##*@}"
  exit 0
fi
n=$(( $(cat "$dir/count" 2>/dev/null || echo 0) + 1 )); echo "$n" > "$dir/count"
echo "$(basename "$0") $*" >> "$dir/calls.log"
cat "$dir/attempt-$n.out" 2>/dev/null
exit "$(cat "$dir/attempt-$n.status" 2>/dev/null || echo 0)"
`;

const FROM_PACKAGE = [
  "npx",
  "lerna",
  "publish",
  "from-package",
  "--yes",
  "--dist-tag",
  "latest"
];

describe("@release npm-publish.sh and require-on-npm.sh", function () {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "npm-publish-"));
    const bin = path.join(dir, "bin");
    fs.mkdirSync(bin);
    for (const name of ["npx", "npm"]) {
      fs.writeFileSync(path.join(bin, name), FAKE, { mode: 0o755 });
    }
    const repo = path.join(dir, "repo");
    for (const [name, version] of [
      ["@fonoster/common", "0.35.0"],
      ["@fonoster/logger", "0.35.0"],
      ["@fonoster/identity-client", "0.34.3"]
    ]) {
      const pkg = path.join(repo, "mods", name.split("/")[1]);
      fs.mkdirSync(pkg, { recursive: true });
      fs.writeFileSync(
        path.join(pkg, "package.json"),
        JSON.stringify({ name, version })
      );
    }
    fs.writeFileSync(
      path.join(repo, "package.json"),
      JSON.stringify({ workspaces: ["mods/*"] })
    );
    for (const args of [
      ["init", "-q"],
      ["add", "."],
      ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "init"]
    ]) {
      spawnSync("git", args, { cwd: repo });
    }
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function attempts(...answers: Array<[string, number]>) {
    answers.forEach(([out, status], i) => {
      fs.writeFileSync(path.join(dir, `attempt-${i + 1}.out`), out);
      fs.writeFileSync(path.join(dir, `attempt-${i + 1}.status`), `${status}`);
    });
  }

  function run(script: string, args: string[]) {
    const summary = path.join(dir, "summary.md");
    const result = spawnSync(path.join(RELEASE, script), args, {
      cwd: path.join(dir, "repo"),
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${path.join(dir, "bin")}:${process.env.PATH}`,
        GITHUB_STEP_SUMMARY: summary,
        NPM_PUBLISH_RETRY_DELAY: "0",
        REQUIRE_ON_NPM_DELAY: "0"
      }
    });
    const read = (f: string) =>
      fs.existsSync(path.join(dir, f))
        ? fs.readFileSync(path.join(dir, f), "utf8")
        : "";
    return {
      status: result.status,
      out: result.stdout + result.stderr,
      calls: read("calls.log").split("\n").filter(Boolean),
      summary: read("summary.md")
    };
  }

  describe("npm-publish.sh", () => {
    it("retries from-package after 409s and exits 0 when attempt 2 succeeds", () => {
      // Arrange
      attempts([failed("@fonoster/logger"), 1], ["", 0]);

      // Act
      const r = run("npm-publish.sh", ["--attempts", "4", ...FROM_PACKAGE]);

      // Assert
      expect(r.status).to.equal(0);
      expect(r.calls).to.have.length(2);
      expect(r.calls[1]).to.equal(
        "npx lerna publish from-package --yes --dist-tag latest --concurrency 1"
      );
      expect(r.calls[1]).to.equal(r.calls[0]);
      expect(r.out).to.include(
        "npm provenance answered 409 for @fonoster/logger; retrying lerna publish from-package (attempt 2 of 4)"
      );
      expect(r.summary).to.equal("");
    });

    it("runs exactly 4 times when every attempt 409s, then warns and writes the summary", () => {
      // Arrange
      const out = failed("@fonoster/logger");
      attempts([out, 1], [out, 1], [out, 1], [out, 1], ["", 0]);

      // Act
      const r = run("npm-publish.sh", ["--attempts", "4", ...FROM_PACKAGE]);

      // Assert
      expect(r.status).to.equal(0);
      expect(r.calls).to.have.length(4);
      expect(r.out).to.include(
        "::warning::@fonoster/logger: npm provenance answered 409 on every attempt (4); it and the packages that depend on it stay on their previous version"
      );
      expect(r.summary).to.include(
        "### Packages npm provenance refused (409) after 4 attempts"
      );
      expect(r.summary).to.include("- @fonoster/logger");
    });

    it("fails on the first attempt when the failure is not a 409", () => {
      // Arrange
      attempts([EBEHIND, 1], ["", 0]);

      // Act
      const r = run("npm-publish.sh", ["--attempts", "4", ...FROM_PACKAGE]);

      // Assert
      expect(r.status).to.equal(1);
      expect(r.calls).to.have.length(1);
      expect(r.out).to.include("::error::");
    });

    it("fails when attempt 2 fails with something other than a 409", () => {
      // Arrange
      attempts([failed("@fonoster/logger"), 1], [EBEHIND, 1], ["", 0]);

      // Act
      const r = run("npm-publish.sh", ["--attempts", "4", ...FROM_PACKAGE]);

      // Assert
      expect(r.status).to.equal(1);
      expect(r.calls).to.have.length(2);
      expect(r.out).to.include("::error::");
    });

    it("fails without retrying when a 409 and another failure come in the same attempt", () => {
      // Arrange
      const out =
        failed("@fonoster/logger") +
        "lerna WARN notice Package failed to publish: @fonoster/common\n" +
        EBEHIND;
      attempts([out, 1], ["", 0]);

      // Act
      const r = run("npm-publish.sh", ["--attempts", "4", ...FROM_PACKAGE]);

      // Assert
      expect(r.status).to.equal(1);
      expect(r.calls).to.have.length(1);
      expect(r.out).to.include("::error::");
    });

    it("counts a 409'd package that npm already has at its version as published", () => {
      // Arrange
      attempts([failed("@fonoster/identity-client"), 1], ["", 0]);
      fs.writeFileSync(
        path.join(dir, "published"),
        "@fonoster/identity-client@0.34.3\n"
      );

      // Act
      const r = run("npm-publish.sh", ["--attempts", "4", ...FROM_PACKAGE]);

      // Assert
      expect(r.status).to.equal(0);
      expect(r.calls).to.have.length(1);
      expect(r.out).not.to.include("::warning::");
      expect(r.summary).to.equal("");
    });

    it("with --defer, leaves one notice and no warning or summary for the 409s that remain", () => {
      // Arrange
      const out = failed("@fonoster/logger");
      attempts([out, 1], [out, 1], [out, 1], [out, 1]);

      // Act
      const r = run("npm-publish.sh", [
        "--attempts",
        "4",
        "--defer",
        ...FROM_PACKAGE
      ]);

      // Assert
      expect(r.status).to.equal(0);
      expect(r.calls).to.have.length(4);
      expect(r.out.match(/::notice::/g)).to.have.length(1);
      expect(r.out).not.to.include("::warning::");
      expect(r.summary).to.equal("");
    });

    it("refuses --attempts with npm run release before running anything", () => {
      // Act
      const r = run("npm-publish.sh", [
        "--attempts",
        "4",
        "npm",
        "run",
        "release",
        "--"
      ]);

      // Assert
      expect(r.status).to.equal(2);
      expect(r.calls).to.have.length(0);
    });

    it("runs npm run release exactly once with --defer, even after a 409", () => {
      // Arrange
      attempts([failed("@fonoster/logger"), 1], ["", 0]);

      // Act
      const r = run("npm-publish.sh", [
        "--defer",
        "npm",
        "run",
        "release",
        "--",
        "--force-publish",
        "@fonoster/common"
      ]);

      // Assert
      expect(r.status).to.equal(0);
      expect(r.calls).to.deep.equal([
        "npm run release -- --force-publish @fonoster/common --concurrency 1"
      ]);
      expect(r.summary).to.equal("");
    });
  });

  describe("require-on-npm.sh", () => {
    it("exits 0 once the version shows up on a later poll", () => {
      // Arrange
      fs.writeFileSync(path.join(dir, "published-after"), "3");

      // Act
      const r = run("require-on-npm.sh", ["@fonoster/common", "0.35.0"]);

      // Assert
      expect(r.status).to.equal(0);
      expect(r.summary).to.equal("");
    });

    it("exits 1 with the error naming the package and version when it never shows up", () => {
      // Act
      const r = run("require-on-npm.sh", ["@fonoster/common", "0.35.0"]);

      // Assert
      expect(r.status).to.equal(1);
      expect(r.out).to.include(
        "::error::@fonoster/common@0.35.0 is not on npm after the publish attempts."
      );
      expect(r.summary).to.include(
        "### @fonoster/common@0.35.0 did not publish"
      );
      expect(fs.readFileSync(path.join(dir, "views"), "utf8").trim()).to.equal(
        "6"
      );
    });

    it("exits 2 on a usage error", () => {
      // Act
      const r = run("require-on-npm.sh", ["@fonoster/common"]);

      // Assert
      expect(r.status).to.equal(2);
    });
  });
});
