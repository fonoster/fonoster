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
import Ajv from "ajv";
import { parse } from "yaml";
import { Contract, Scenario } from "./types";

// The package root holds scenarios/ and schema/ next to src/ (or dist/), so both the TypeScript
// sources and the compiled output resolve the same folders.
const PACKAGE_ROOT = path.join(__dirname, "..", "..");

export const SCENARIOS_DIR = path.join(PACKAGE_ROOT, "scenarios");
export const SCHEMA_PATH = path.join(
  PACKAGE_ROOT,
  "schema",
  "scenario.schema.json"
);

let validator: ReturnType<Ajv["compile"]> | undefined;

function getValidator() {
  if (!validator) {
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
    validator = new Ajv({ allErrors: true, strict: false }).compile(schema);
  }
  return validator;
}

export class ScenarioError extends Error {
  constructor(
    readonly file: string,
    readonly problems: string[]
  ) {
    super(`invalid scenario ${file}:\n  - ${problems.join("\n  - ")}`);
  }
}

/**
 * Validates already-parsed scenario data against the schema and the rules the schema cannot
 * express. Returns the list of problems (empty when valid).
 */
export function validateScenario(data: unknown, file?: string): string[] {
  const validate = getValidator();
  const problems: string[] = [];

  if (!validate(data)) {
    for (const err of validate.errors ?? []) {
      problems.push(`${err.instancePath || "/"} ${err.message}`);
    }
    return problems;
  }

  const scenario = data as Scenario;

  if (file && path.basename(file, path.extname(file)) !== scenario.name) {
    problems.push(`name "${scenario.name}" does not match the file name`);
  }

  if (file && path.basename(path.dirname(file)) !== scenario.contract) {
    problems.push(
      `contract "${scenario.contract}" does not match the folder "${path.basename(path.dirname(file))}"`
    );
  }

  if (scenario.contract === "voice-sdk" && !scenario.fixture) {
    problems.push("voice-sdk scenarios must name a fixture");
  }

  const labels = new Set<string>();
  scenario.steps.forEach((step, i) => {
    if (step.from && !labels.has(step.from)) {
      problems.push(
        `step ${i + 1}: "from: ${step.from}" does not name an earlier label`
      );
    }
    if (step.label) {
      if (labels.has(step.label)) {
        problems.push(`step ${i + 1}: duplicate label "${step.label}"`);
      }
      labels.add(step.label);
    }
    if (step.next && step.expect === undefined) {
      problems.push(`step ${i + 1}: next is only allowed on expect`);
    }
    if (step.capture && step.expect === undefined) {
      problems.push(`step ${i + 1}: capture is only allowed on expect`);
    }
    if (
      (step.within_ms !== undefined ||
        step.budget_ms !== undefined ||
        step.not_before_ms !== undefined) &&
      step.expect === undefined &&
      step.expect_audio === undefined &&
      step.expect_close === undefined
    ) {
      problems.push(
        `step ${i + 1}: timing limits are only allowed on expect steps`
      );
    }
  });

  return problems;
}

export function loadScenarioFile(file: string): Scenario {
  const data = parse(fs.readFileSync(file, "utf8"));
  const problems = validateScenario(data, file);
  if (problems.length > 0) {
    throw new ScenarioError(file, problems);
  }
  return { ...(data as Scenario), file };
}

/** Lists scenario files, optionally for one contract, sorted by path. */
export function listScenarioFiles(
  contract?: Contract,
  dir = SCENARIOS_DIR
): string[] {
  const contracts = contract
    ? [contract]
    : fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && d.name !== "audio")
        .map((d) => d.name);

  return contracts
    .flatMap((c) => {
      const folder = path.join(dir, c);
      if (!fs.existsSync(folder)) return [];
      return fs
        .readdirSync(folder)
        .filter((f) => f.endsWith(".yaml"))
        .map((f) => path.join(folder, f));
    })
    .sort();
}

export function loadScenarios(
  contract?: Contract,
  dir = SCENARIOS_DIR
): Scenario[] {
  return listScenarioFiles(contract, dir).map(loadScenarioFile);
}
