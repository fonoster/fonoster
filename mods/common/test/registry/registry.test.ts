/*
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
import {
  MemoryRegistryStore,
  Registry,
  RegistryError,
  Usage,
  UsageSource,
  agentRequirements
} from "../../src/registry";

class Usages implements UsageSource {
  readonly notices: { workspace: string; notice: Record<string, unknown> }[] =
    [];
  constructor(public items: Usage[]) {}
  find(id: string) {
    return this.items.filter((u) => u.model === id || u.voice === id);
  }
  rewrite(
    u: Usage,
    change: { model?: string; voice?: string; dropSettings: string[] }
  ) {
    if (change.model) u.model = change.model;
    if (change.voice) u.voice = change.voice;
    u.settings = u.settings.filter((s) => !change.dropSettings.includes(s));
    return true;
  }
  notify(workspace: string, notice: Record<string, unknown>) {
    this.notices.push({ workspace, notice });
  }
}

function app(
  n: number,
  voice: string,
  settings: string[] = [],
  workspace = `ws-${n % 3}`
): Usage {
  return {
    workspace,
    config: { kind: "app", ref: `app-${voice}-${n}`, name: `App ${n}` },
    model: "elevenlabs/turbo-v2",
    voice,
    settings,
    requires: ["streaming"]
  };
}

function elevenlabs(usages = new Usages([])) {
  const store = new MemoryRegistryStore();
  const r = new Registry({
    store,
    usages,
    actor: "ops@fonoster",
    now: () => new Date("2026-10-15T08:00:00Z")
  });
  r.addProvider({
    id: "elevenlabs",
    adapter: "elevenlabs",
    capabilities: ["tts"],
    credentialRef: "elevenlabs-default"
  });
  r.addModel({
    id: "elevenlabs/turbo-v2",
    type: "tts",
    features: ["streaming"],
    settings: ["style", "stability"]
  });
  r.addModel({
    id: "elevenlabs/flash-v2.5",
    type: "tts",
    features: ["streaming", "word-timings"],
    settings: ["stability"]
  });
  r.addVoice({
    id: "elevenlabs/rachel",
    models: ["elevenlabs/turbo-v2", "elevenlabs/flash-v2.5"],
    language: "en",
    gender: "female"
  });
  r.addVoice({
    id: "elevenlabs/adam",
    models: ["elevenlabs/turbo-v2", "elevenlabs/flash-v2.5"]
  });
  r.addVoice({ id: "elevenlabs/nova-legacy", models: ["elevenlabs/turbo-v2"] });
  r.addVoice({ id: "elevenlabs/bella", models: ["elevenlabs/flash-v2.5"] });
  return { r, store, usages };
}

/** The spec's turbo-v2 case: rachel 41 apps, adam 9, nova-legacy 3, and 2 apps setting style. */
function turboUsages() {
  const items: Usage[] = [];
  for (let i = 0; i < 41; i++)
    items.push(app(i, "elevenlabs/rachel", i < 2 ? ["style"] : []));
  for (let i = 0; i < 9; i++) items.push(app(i, "elevenlabs/adam"));
  for (let i = 0; i < 3; i++) items.push(app(i, "elevenlabs/nova-legacy"));
  return new Usages(items);
}

describe("@common/registry", function () {
  it("registers a model, shows it and audits the write", function () {
    const store = new MemoryRegistryStore();
    const r = new Registry({ store, actor: "ops" });
    r.addProvider({
      id: "deepgram",
      adapter: "deepgram",
      capabilities: ["stt"],
      credentialRef: "deepgram-default"
    });
    r.addModel({
      id: "deepgram/nova-3",
      type: "stt",
      features: ["interim-results", "word-timings"],
      languages: ["en", "es", "pt"]
    });
    expect(r.show("deepgram/nova-3")).to.deep.include({
      type: "stt",
      state: "active",
      features: ["interim-results", "word-timings"],
      languages: ["en", "es", "pt"]
    });
    expect(r.history("deepgram/nova-3")).to.have.length(1);
    expect(r.history("deepgram/nova-3")[0]).to.include({
      actor: "ops",
      action: "add-model"
    });
  });

  it("takes model names with slashes, as hosted models have, and refuses malformed ids", function () {
    const r = new Registry({ store: new MemoryRegistryStore(), actor: "ops" });
    r.addProvider({
      id: "groq",
      adapter: "groq",
      capabilities: ["llm"],
      credentialRef: "groq-default"
    });
    r.addModel({ id: "groq/openai/gpt-oss-120b", type: "llm" });
    expect(r.show("groq/openai/gpt-oss-120b")).to.include({ type: "llm" });
    for (const id of ["groq/", "groq//x", "Groq/x", "groq/a b"])
      expect(() => r.addModel({ id, type: "llm" })).to.throw(
        RegistryError,
        `invalid catalog id ${id}`
      );
  });

  it("offers a voice only with the models it works on", function () {
    const { r } = elevenlabs();
    expect(r.voicesFor("elevenlabs/flash-v2.5").map((v) => v.id))
      .to.include("elevenlabs/rachel")
      .and.not.include("elevenlabs/nova-legacy");
  });

  it("never reuses a catalog id", function () {
    const { r } = elevenlabs();
    r.deprecate(
      "model",
      "elevenlabs/turbo-v2",
      "elevenlabs/flash-v2.5",
      "2027-01-31"
    );
    r.retire("model", "elevenlabs/turbo-v2");
    expect(() =>
      r.addModel({ id: "elevenlabs/turbo-v2", type: "tts" })
    ).to.throw(
      RegistryError,
      "catalog id elevenlabs/turbo-v2 already exists (state: retired)"
    );
  });

  it("accepts only built-in adapters, the fake one like any other", function () {
    const r = new Registry({ store: new MemoryRegistryStore() });
    expect(() =>
      r.addProvider({
        id: "acme",
        adapter: "acme",
        capabilities: ["tts"],
        credentialRef: "acme-default"
      })
    ).to.throw("unknown adapter: acme");
    // Keyless (no credentialRef) and labeled.
    expect(
      r.addProvider({
        id: "fake",
        adapter: "fake",
        capabilities: ["tts"],
        label: "Fakes"
      })
    ).to.deep.include({ id: "fake", label: "Fakes" });
    expect(r.show("fake")).to.not.have.property("credentialRef");
    expect(() =>
      r.addProvider({
        id: "bad",
        adapter: "openai",
        capabilities: ["llm"],
        credentialRef: "Not A Name"
      })
    ).to.throw("credentialRef must be a name");
  });

  it("serves noise cancelling as a capability and refuses unknown ones", function () {
    const r = new Registry({ store: new MemoryRegistryStore() });
    expect(
      r.addProvider({
        id: "aicoustics",
        adapter: "aicoustics",
        capabilities: ["nc"],
        credentialRef: "aicoustics-default"
      })
    ).to.deep.include({
      state: "active",
      capabilities: ["nc"],
      credentialRef: "aicoustics-default"
    });
    expect(() =>
      r.addProvider({
        id: "denoiser",
        adapter: "aicoustics",
        capabilities: ["denoise" as never]
      })
    ).to.throw("unknown capability: denoise");
  });

  it("applies labels and keyless providers from a file", function () {
    const store = new MemoryRegistryStore();
    expect(
      new Registry({ store }).apply(`entries:
  - { kind: provider, id: fake, label: Fakes, adapter: fake, capabilities: [tts], state: active }
  - { kind: model, id: fake/tts, label: Fake voice model, type: tts, features: [], languages: [multi], settings: [], state: active }
`)
    ).to.deep.equal(["+ add provider fake", "+ add model fake/tts"]);
    expect(store.get("fake/tts")).to.include({ label: "Fake voice model" });
  });

  it("keeps provider endpoints, and refuses ones that are not plain URLs", function () {
    const r = new Registry({ store: new MemoryRegistryStore() });
    r.addProvider({
      id: "ollama",
      adapter: "ollama",
      capabilities: ["llm"],
      credentialRef: "ollama-default",
      endpoints: { llm: "http://ollama:11434" }
    });
    expect(r.show("ollama")).to.include({ adapter: "ollama" });
    expect(
      (r.show("ollama") as { endpoints: unknown }).endpoints
    ).to.deep.equal({ llm: "http://ollama:11434" });
    const add = (id: string, endpoints: Record<string, string>) => () =>
      r.addProvider({
        id,
        adapter: "openai",
        capabilities: ["llm"],
        credentialRef: `${id}-default`,
        endpoints
      });
    expect(add("a", { llm: "https://user:pass@llm.example.com" })).to.throw(
      "user information"
    );
    expect(add("b", { llm: "ftp://llm.example.com" })).to.throw("http, https");
    expect(add("c", { llm: "not a url" })).to.throw("must be a URL");
    expect(add("d", { vad: "http://x" })).to.throw("unknown endpoint");
  });

  it("finds no change when only the order of endpoint keys differs", function () {
    const store = new MemoryRegistryStore();
    const r = new Registry({ store });
    r.apply(`entries:
  - { kind: provider, id: fake, adapter: fake, capabilities: [stt, tts], credentialRef: fake-default, endpoints: { tts: "http://fakes:7001", stt: "ws://fakes:7002" }, state: active }
`);
    expect(
      r.plan(`entries:
  - { kind: provider, id: fake, adapter: fake, capabilities: [stt, tts], credentialRef: fake-default, endpoints: { stt: "ws://fakes:7002", tts: "http://fakes:7001" }, state: active }
`)
    ).to.deep.equal([]);
  });

  it("refuses anything that looks like a secret, and exports none", function () {
    const r = new Registry({ store: new MemoryRegistryStore() });
    expect(() =>
      r.addProvider({
        id: "deepgram",
        adapter: "deepgram",
        capabilities: ["stt"],
        credentialRef: "deepgram-default",
        "api-key": "abc123"
      })
    ).to.throw("secrets cannot be stored in the catalog");
    expect(() =>
      r.addProvider({
        id: "openai",
        adapter: "openai",
        capabilities: ["llm"],
        credentialRef: "sk-live-123"
      })
    ).to.throw("secrets");
    r.addProvider({
      id: "deepgram",
      adapter: "deepgram",
      capabilities: ["stt"],
      credentialRef: "deepgram-default"
    });
    expect(r.export())
      .to.contain("credentialRef: deepgram-default")
      .and.not.match(/key|secret|token/i);
  });

  it("prints the deprecation impact report from the spec", function () {
    const { r, usages } = elevenlabs(turboUsages());
    const report = r.deprecate(
      "model",
      "elevenlabs/turbo-v2",
      "elevenlabs/flash-v2.5",
      "2027-01-31"
    );
    const lines = report.lines.map(
      (l) => `${l.mark} ${l.text} (${l.count} apps)`
    );
    expect(lines).to.deep.equal([
      "✓ voice rachel works on replacement (41 apps)",
      '~ setting "style" not supported, will be dropped (soft) (2 apps)',
      "✓ voice adam works on replacement (9 apps)",
      "✗ voice nova-legacy only exists on turbo-v2 → needs --voice-map nova-legacy=<voice> (3 apps)"
    ]);
    expect(r.show("elevenlabs/turbo-v2")).to.include({
      state: "deprecated",
      replacement: "elevenlabs/flash-v2.5",
      retireOn: "2027-01-31"
    });
    // One provider.deprecated notice per affected workspace.
    expect(usages.notices.map((n) => n.workspace).sort()).to.deep.equal([
      "ws-0",
      "ws-1",
      "ws-2"
    ]);
  });

  it("requires an active replacement of the same kind", function () {
    const { r } = elevenlabs();
    expect(() =>
      r.deprecate(
        "model",
        "elevenlabs/turbo-v2",
        "elevenlabs/rachel",
        "2027-01-31"
      )
    ).to.throw("replacement must be an active model");
  });

  it("retires with a voice map: rewrites, drops settings, audits each config", function () {
    const { r, usages } = elevenlabs(turboUsages());
    r.deprecate(
      "model",
      "elevenlabs/turbo-v2",
      "elevenlabs/flash-v2.5",
      "2027-01-31"
    );
    const report = r.retire("model", "elevenlabs/turbo-v2", {
      "nova-legacy": "bella"
    });
    expect(report.unmappable).to.have.length(0);
    expect(
      usages.items.every((u) => u.model === "elevenlabs/flash-v2.5")
    ).to.equal(true);
    expect(
      usages.items.filter((u) => u.voice === "elevenlabs/bella")
    ).to.have.length(3);
    expect(usages.items.some((u) => u.settings.includes("style"))).to.equal(
      false
    );
    expect(
      r
        .history("elevenlabs/turbo-v2")
        .filter((h) => h.action === "rewrite-config")
    ).to.have.length(53);
    expect(r.show("elevenlabs/turbo-v2").state).to.equal("retired");
  });

  it("retires without a voice map, leaving unmappable configs on the old id", function () {
    const { r, usages } = elevenlabs(turboUsages());
    r.deprecate(
      "model",
      "elevenlabs/turbo-v2",
      "elevenlabs/flash-v2.5",
      "2027-01-31"
    );
    const report = r.retire("model", "elevenlabs/turbo-v2");
    expect(report.unmappable).to.have.length(3);
    expect(
      usages.items
        .filter((u) => u.model === "elevenlabs/turbo-v2")
        .map((u) => u.voice)
    ).to.deep.equal(Array(3).fill("elevenlabs/nova-legacy"));
  });

  it("resolves retired ids to their replacement and flags deprecated ones", function () {
    const { r } = elevenlabs();
    r.deprecate(
      "model",
      "elevenlabs/turbo-v2",
      "elevenlabs/flash-v2.5",
      "2027-01-31"
    );
    expect(r.resolve("elevenlabs/turbo-v2")).to.deep.include({
      event: "provider.deprecated_used",
      id: "elevenlabs/turbo-v2"
    });
    r.retire("model", "elevenlabs/turbo-v2");
    expect(r.resolve("elevenlabs/turbo-v2")).to.deep.include({
      event: "provider.retired_used",
      id: "elevenlabs/flash-v2.5"
    });
  });

  it("flags configs whose hard requirements the replacement lacks", function () {
    const store = new MemoryRegistryStore();
    const usages = new Usages([
      {
        workspace: "w",
        config: { kind: "agent", ref: "a1", name: "Billing" },
        model: "openai/gpt-4o-mini",
        settings: [],
        requires: agentRequirements({ languageModel: { tools: [{}] } })
      }
    ]);
    const r = new Registry({ store, usages });
    r.addProvider({
      id: "openai",
      adapter: "openai",
      capabilities: ["llm"],
      credentialRef: "openai-default"
    });
    r.addModel({
      id: "openai/gpt-4o-mini",
      type: "llm",
      features: ["streaming", "tool-calling"]
    });
    r.addModel({ id: "openai/tiny", type: "llm", features: ["streaming"] });
    const report = r.impact("openai/gpt-4o-mini", "openai/tiny");
    expect(report.unmappable).to.have.length(1);
    expect(report.lines[0].text).to.contain("requires tool-calling");
  });

  it("syncs two registries with plan and apply, idempotently", function () {
    const a = elevenlabs().r;
    a.deprecate(
      "model",
      "elevenlabs/turbo-v2",
      "elevenlabs/flash-v2.5",
      "2027-01-31"
    );
    const bStore = new MemoryRegistryStore();
    const b = new Registry({ store: bStore });
    b.addProvider({
      id: "elevenlabs",
      adapter: "elevenlabs",
      capabilities: ["tts"],
      credentialRef: "elevenlabs-default"
    });
    b.addModel({
      id: "elevenlabs/turbo-v2",
      type: "tts",
      features: ["streaming"],
      settings: ["style", "stability"]
    });
    const file = a.export();
    const plan = b.plan(file);
    expect(plan).to.include("+ add model elevenlabs/flash-v2.5");
    expect(plan).to.include(
      "~ deprecate model elevenlabs/turbo-v2 → elevenlabs/flash-v2.5"
    );
    b.apply(file);
    expect(b.export()).to.equal(file);
    const audits = bStore.history().length;
    expect(b.apply(file)).to.deep.equal(["no changes"]);
    expect(bStore.history().length).to.equal(audits);
  });
});
