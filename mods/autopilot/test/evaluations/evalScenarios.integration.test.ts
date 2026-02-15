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

/**
 * Integration test for autopilot evaluation scenarios.
 *
 * Loads etc/autopilot.yaml, injects API keys from config/integrations.json,
 * runs evalTestCases (no API server needed), and asserts that every scenario
 * passes -- including tool-call expectations (e.g. hangup).
 *
 * Skips gracefully when the YAML or credentials file is missing.
 */
import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import * as yaml from "js-yaml";
import { assistantSchema } from "@fonoster/common";
import { ExpectedTextType, ScenarioEvaluationReport } from "@fonoster/types";
import { evalTestCases } from "../../src/models/evaluations/evalTestCases";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const REPO_ROOT = path.join(__dirname, "..", "..", "..", "..");
const AUTOPILOT_YAML = path.join(REPO_ROOT, "etc", "autopilot.yaml");
const INTEGRATIONS_JSON = path.join(REPO_ROOT, "config", "integrations.json");

// ---------------------------------------------------------------------------
// Types (lightweight, test-only)
// ---------------------------------------------------------------------------
type Integration = {
  productRef: string;
  credentials?: { apiKey?: string };
};

type RawAutopilotConfig = {
  intelligence?: {
    config: Record<string, unknown> & {
      testCases?: { scenarios?: unknown[] };
    };
  };
};

type LanguageModelConfig = {
  provider?: string;
  apiKey?: string;
  temperature?: number;
  [key: string]: unknown;
};

type TestCasesConfig = {
  scenarios: {
    conversation: {
      expected?: { text?: { type?: string } };
    }[];
  }[];
  evalsLanguageModel?: {
    provider?: string;
    model?: string;
    apiKey?: string;
  };
};

type AssistantRawConfig = {
  languageModel?: LanguageModelConfig;
  testCases?: TestCasesConfig;
};

// ---------------------------------------------------------------------------
// Provider-to-productRef mapping
// ---------------------------------------------------------------------------
const PROVIDER_PRODUCT_REF: Record<string, string> = {
  openai: "llm.openai",
  anthropic: "llm.anthropic",
  groq: "llm.groq",
  google: "llm.google"
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Read and parse a JSON file, or return null if missing. */
function loadJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

/** Read and parse the autopilot YAML, or return null if missing. */
function loadAutopilotYaml(): RawAutopilotConfig | null {
  if (!fs.existsSync(AUTOPILOT_YAML)) return null;
  return yaml.load(fs.readFileSync(AUTOPILOT_YAML, "utf8")) as RawAutopilotConfig;
}

/** Look up an API key in the integrations array by productRef. */
function findApiKey(
  integrations: Integration[],
  productRef: string
): string | undefined {
  return integrations.find((i) => i.productRef === productRef)?.credentials
    ?.apiKey;
}

/** Resolve a provider name (e.g. "openai") to its productRef (e.g. "llm.openai"). */
function resolveProductRef(provider: string): string {
  return PROVIDER_PRODUCT_REF[provider] ?? "llm.google";
}

/**
 * Inject API keys from integrations.json into the parsed config.
 * Also forces temperature to 0 for maximum eval determinism.
 */
function injectCredentials(
  config: AssistantRawConfig,
  integrations: Integration[]
): void {
  const provider = config.languageModel?.provider ?? "google";

  config.languageModel = {
    ...config.languageModel,
    apiKey: findApiKey(integrations, resolveProductRef(provider)),
    temperature: 0
  };

  if (config.testCases?.evalsLanguageModel) {
    config.testCases.evalsLanguageModel = {
      ...config.testCases.evalsLanguageModel,
      apiKey: findApiKey(integrations, "llm.openai")
    };
  }
}

/**
 * Normalize the expected text type strings from the YAML (e.g. "SIMILAR")
 * into the enum values that the evaluation engine expects.
 */
function normalizeExpectedTextTypes(
  scenarios: TestCasesConfig["scenarios"]
): void {
  for (const scenario of scenarios) {
    for (const step of scenario.conversation) {
      if (step.expected?.text?.type) {
        const raw = String(step.expected.text.type).toLowerCase();
        (step.expected.text as { type: string }).type =
          raw === "similar" ? ExpectedTextType.SIMILAR : "EXACT";
      }
    }
  }
}

/** Format a scenario report into a readable assertion message. */
function formatFailureMessage(report: ScenarioEvaluationReport): string {
  const details = report.steps?.map((s) => ({
    passed: s.passed,
    errorMessage: s.errorMessage,
    toolEvaluations: s.toolEvaluations
  }));
  return `Scenario "${report.scenarioRef}" failed. Steps: ${JSON.stringify(details, null, 2)}`;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe("Autopilot Evaluation Scenarios", function () {
  this.timeout(240_000);

  let reports: ScenarioEvaluationReport[];

  before(async function () {
    const raw = loadAutopilotYaml();

    if (!raw?.intelligence?.config?.testCases?.scenarios?.length) {
      console.log("[eval] skipping: autopilot.yaml missing or has no scenarios");
      this.skip();
      return;
    }

    const integrations = loadJsonFile<Integration[]>(INTEGRATIONS_JSON);

    if (!integrations) {
      console.log("[eval] skipping: config/integrations.json not found");
      this.skip();
      return;
    }

    const config = raw.intelligence.config as AssistantRawConfig;

    injectCredentials(config, integrations);
    normalizeExpectedTextTypes(config.testCases!.scenarios);

    const parsed = assistantSchema.parse(config);

    console.log(
      "[eval] running %d scenario(s) with provider=%s model=%s",
      parsed.testCases?.scenarios?.length ?? 0,
      config.languageModel?.provider,
      (config.languageModel as Record<string, unknown>)?.model
    );

    reports = await evalTestCases({
      intelligence: { config: parsed }
    });
  });

  it("should run all scenarios successfully", function () {
    expect(reports, "evaluation reports should exist").to.be.an("array").that
      .is.not.empty;
  });

  it("should pass every scenario", function () {
    for (const report of reports) {
      expect(report.overallPassed, formatFailureMessage(report)).to.be.true;
    }
  });

  it("should pass conversation-termination with a hangup tool call", function () {
    const termination = reports.find(
      (r) => r.scenarioRef === "conversation-termination"
    );
    expect(termination, "conversation-termination scenario should exist").to
      .exist;
    expect(termination!.overallPassed, formatFailureMessage(termination!)).to
      .be.true;

    // Verify the hangup tool was actually invoked
    const lastStep = termination!.steps?.[termination!.steps.length - 1];
    expect(
      lastStep?.toolEvaluations,
      "last step should have tool evaluations"
    ).to.be.an("array").that.is.not.empty;
    expect(
      lastStep?.toolEvaluations?.[0]?.passed,
      "hangup tool evaluation should pass"
    ).to.be.true;
  });
});
