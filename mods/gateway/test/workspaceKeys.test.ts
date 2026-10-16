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
import { Catalog } from "../src/speech/Catalog";
import { chainKeySources } from "../src/speech/keySources";

// Workspace vendor keys (add-provider-registry 3.2, build log CP-B12).

describe("@gateway/workspace vendor keys", function () {
  const config = {
    nats: { url: "nats://x" },
    providers: {
      deepgram: {
        adapter: "deepgram" as const,
        capabilities: ["stt" as const, "tts" as const],
        credential: { value: "platform-key" }
      },
      elevenlabs: {
        adapter: "elevenlabs" as const,
        capabilities: ["tts" as const]
      }
    }
  };
  const key = (adapter: unknown) =>
    (adapter as { options: { apiKey: string } }).options.apiKey;

  it("uses the workspace's key after prepare, the platform key otherwise", async function () {
    const lookups: string[] = [];
    const catalog = new Catalog(config, undefined, {
      get: async (workspaceRef, providerId) => {
        lookups.push(`${workspaceRef}/${providerId}`);
        if (workspaceRef === "WO1" && providerId === "deepgram")
          return "ws-key";
        if (workspaceRef === "WO1" && providerId === "elevenlabs")
          return "ws-el-key";
        return undefined;
      }
    });
    expect(key(catalog.resolveVoice("deepgram/aura", "WO1")!.adapter)).to.equal(
      "platform-key"
    );
    await catalog.prepare("WO1");
    await catalog.prepare("WO2");
    expect(lookups).to.have.members([
      "WO1/deepgram",
      "WO1/elevenlabs",
      "WO2/deepgram",
      "WO2/elevenlabs"
    ]);
    expect(key(catalog.resolveVoice("deepgram/aura", "WO1")!.adapter)).to.equal(
      "ws-key"
    );
    expect(key(catalog.resolveStt("deepgram/nova-3", "WO1")!.adapter)).to.equal(
      "ws-key"
    );
    expect(key(catalog.resolveStt(undefined, "WO1")!.adapter)).to.equal(
      "ws-key"
    );
    expect(key(catalog.resolveVoice("deepgram/aura", "WO2")!.adapter)).to.equal(
      "platform-key"
    );
    // A provider with no platform key works for a workspace that brought its own.
    expect(catalog.resolveVoice("elevenlabs/rachel", "WO2")).to.equal(
      undefined
    );
    expect(
      key(catalog.resolveVoice("elevenlabs/rachel", "WO1")!.adapter)
    ).to.equal("ws-el-key");
    expect(catalog.usesWorkspaceKey("deepgram", "WO1")).to.equal(true);
  });

  it("falls back to platform keys when the lookup fails", async function () {
    const catalog = new Catalog(config, undefined, {
      get: async () => {
        throw new Error("db down");
      }
    });
    await catalog.prepare("WO1");
    expect(key(catalog.resolveVoice("deepgram/aura", "WO1")!.adapter)).to.equal(
      "platform-key"
    );
  });

  it("resolves in order: cell secrets, then the workspace's key, then the platform key", async function () {
    const cell = {
      get: async (w: string, p: string) =>
        w === "WO1" && p === "deepgram" ? "cell-key" : undefined
    };
    const db = {
      get: async (w: string, p: string) =>
        w === "WO1" ? `db-${p}-key` : undefined
    };
    const catalog = new Catalog(config, undefined, chainKeySources(cell, db));
    await catalog.prepare("WO1");
    await catalog.prepare("WO2");
    expect(key(catalog.resolveVoice("deepgram/aura", "WO1")!.adapter)).to.equal(
      "cell-key"
    );
    expect(
      key(catalog.resolveVoice("elevenlabs/rachel", "WO1")!.adapter)
    ).to.equal("db-elevenlabs-key");
    expect(key(catalog.resolveVoice("deepgram/aura", "WO2")!.adapter)).to.equal(
      "platform-key"
    );
    // No platform key for ElevenLabs and none in WO2: not offered.
    expect(catalog.resolveVoice("elevenlabs/rachel", "WO2")).to.equal(
      undefined
    );
    expect(chainKeySources(undefined, undefined)).to.equal(undefined);
    expect(chainKeySources(undefined, db)).to.equal(db);
  });
});
