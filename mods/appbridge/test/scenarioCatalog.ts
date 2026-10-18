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
import { Registry as RegistryNs } from "@fonoster/common";
import { Scenario } from "@fonoster/conformance";

/**
 * The scenario's `setup.catalog` as a registry (add-provider-registry 1.6): the fake provider, a
 * TTS model, fake/default, and each listed voice in its state.
 */
export function catalogFor(scenario: Scenario) {
  const c = scenario.setup?.catalog;
  if (!c) return undefined;
  const store = new RegistryNs.MemoryRegistryStore();
  const r = new RegistryNs.Registry({ store, testMode: true });
  r.addProvider({
    id: "fake",
    adapter: "fake",
    capabilities: ["tts", "stt"],
    credentialRef: "fake-default"
  });
  r.addModel({ id: "fake/tts", type: "tts", features: ["streaming"] });
  const voices = [{ id: "fake/default" }, ...(c.voices ?? [])];
  for (const v of voices) r.addVoice({ id: v.id, models: ["fake/tts"] });
  for (const v of voices) {
    if (!v.state || v.state === "active") continue;
    r.deprecate("voice", v.id, v.replacement!, "2099-01-01");
    if (v.state === "retired") r.retire("voice", v.id);
  }
  return store;
}
