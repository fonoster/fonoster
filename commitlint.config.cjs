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
// Conventional commits: the type drives .scripts/next-release.sh. Everything else is relaxed:
// merge commits are skipped, and header length, subject case and body/footer line lengths are
// not checked (revamp-ci-workflows CI-B3).
module.exports = {
  extends: ["@commitlint/config-conventional"],
  ignores: [(message) => /^Merge /.test(message)],
  rules: {
    // The conventional types plus spec (OpenSpec changes).
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "spec",
        "style",
        "test"
      ]
    ],
    "header-max-length": [0],
    "subject-case": [0],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
    "body-leading-blank": [0],
    "footer-leading-blank": [0]
  }
};
