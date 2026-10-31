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
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { Registry } from "@fonoster/common";
import { RegistryLlmResolver } from "../../src/session";

// The catalog feature `reasoning` (#1239) reaches the language model adapter through the resolver.

describe("@fonoster/autopilot reasoning models", function () {
  let dir: string;
  let registry: Registry.Registry;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "autopilot-reasoning-"));
    registry = new Registry.Registry({
      store: new Registry.FileRegistryStore(path.join(dir, "registry.json"))
    });
    registry.addProvider({
      id: "openai",
      adapter: "openai",
      capabilities: ["llm"],
      credentialRef: "openai"
    });
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const optionsOf = async (id: string) => {
    const r = await new RegistryLlmResolver({
      registry,
      credentials: { get: () => "k" }
    }).resolve(id, { temperature: 0.4, maxTokens: 100 }, {});
    return (r.think as unknown as { options: Record<string, unknown> }).options;
  };

  it("the resolver passes reasoning when the catalog entry has the feature", async function () {
    registry.addModel({
      id: "openai/gpt-5.4-mini",
      type: "llm",
      features: ["streaming", "tool-calling", "reasoning"]
    });
    registry.addModel({
      id: "openai/gpt-4o-mini",
      type: "llm",
      features: ["streaming", "tool-calling"]
    });
    expect(await optionsOf("openai/gpt-5.4-mini")).to.deep.equal({
      temperature: 0.4,
      maxTokens: 100,
      reasoning: true
    });
    expect(await optionsOf("openai/gpt-4o-mini")).to.deep.equal({
      temperature: 0.4,
      maxTokens: 100
    });
  });

  it("a catalog entry with feature reasoning is accepted", function () {
    registry.addModel({
      id: "openai/gpt-5.4-mini",
      type: "llm",
      features: ["streaming", "reasoning"]
    });
    expect(
      registry.list().find((e) => e.id === "openai/gpt-5.4-mini")
    ).to.deep.include({ features: ["streaming", "reasoning"] });
  });
});
