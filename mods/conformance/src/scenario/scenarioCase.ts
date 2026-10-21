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

// The QA catalog (catalog/areas/*.md) ties each scenario file to a case through its Runs lines.
// Suites that run scenario files put that case id in each test's title, so the release report
// can find the result. Outside the repository (the published package) there is no catalog.
const AREAS_DIR = path.join(__dirname, "..", "..", "catalog", "areas");

let runs: Map<string, string> | undefined;

function loadRuns(): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(AREAS_DIR)) return map;
  for (const file of fs
    .readdirSync(AREAS_DIR)
    .filter((f) => f.endsWith(".md"))) {
    let id: string | undefined;
    for (const line of fs
      .readFileSync(path.join(AREAS_DIR, file), "utf8")
      .split("\n")) {
      const heading = /^### ([A-Z]{2,4}-\d{3}) /.exec(line);
      if (heading) id = heading[1];
      const run = /^- \*\*Runs:\*\* scenarios\/(.+?)\s*$/.exec(line);
      if (run && id)
        for (const target of run[1].split(/,\s*/))
          map.set(target.replace(/\.yaml$/, ""), id);
    }
  }
  return map;
}

/**
 * The catalog case that runs a scenario file, as "[VSD-003] " for a test title, or "" when no
 * case claims it. A case can run a single file or a whole contract.
 */
export function scenarioCase(contract: string, name: string): string {
  runs ??= loadRuns();
  const id = runs.get(`${contract}/${name}`) ?? runs.get(contract);
  return id ? `[${id}] ` : "";
}
