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
import { generateKeyPairSync } from "crypto";
import { RecordStore, signVcon, Vcon } from "@fonoster/callrecord";
import { ConfigSnapshot, WorkspaceKinds } from "../src/types";

// Shared fixtures for the region agent's tests.

export const WS = "WOtestworkspace";
export const WS2 = "WOsecondworkspace";

/** One workspace's kinds in a snapshot (default: WS). */
export function kindsOf(s: ConfigSnapshot, ws = WS): WorkspaceKinds {
  return s.workspaces![ws].kinds;
}

/** The old single-workspace shape (`kinds`, catalog inside). */
export function legacySnapshot(version: number): ConfigSnapshot {
  const s = snapshot(version);
  return {
    type: "region.config",
    configVersion: version,
    full: true,
    kinds: { ...kindsOf(s), catalog: s.catalog }
  };
}

/** A second workspace of the same region with its own app, webhook and Routr domain. */
export function secondWorkspace(): WorkspaceKinds {
  return {
    apps: [
      {
        ref: "app-sales",
        name: "Sales",
        type: "STREAM",
        url: "wss://sales.example.com/session",
        signingSecret: "sales-secret"
      }
    ],
    webhooks: [
      {
        ref: "wh-2",
        url: "https://hooks.example.com/s",
        events: [],
        secret: "s2"
      }
    ],
    recordingPolicy: { retention: [{ part: "recording", days: 7 }] },
    numbers: [],
    routr: {
      acls: [],
      trunks: [],
      domains: [
        {
          ref: "cp-dom-2",
          name: "Sales",
          domainUri: "sales.sip.fonoster.local"
        }
      ],
      agents: []
    }
  };
}

export function snapshot(
  version: number,
  over: Partial<WorkspaceKinds> = {},
  more: Record<string, WorkspaceKinds> = {},
  region: ConfigSnapshot["region"] = {
    ref: "rg_testregion",
    id: "acme-hq",
    kind: "private",
    sipDomain: null,
    rootDomain: "sip.fonoster.local"
  }
): ConfigSnapshot {
  const { catalog, ...kinds } = baseKinds(over);
  return {
    type: "region.config",
    configVersion: version,
    full: true,
    region,
    catalog,
    workspaces: {
      [WS]: { ref: "ws-1", name: "Acme", domain: null, kinds },
      ...Object.fromEntries(
        Object.entries(more).map(([id, k]) => [id, { name: id, kinds: k }])
      )
    }
  };
}

function baseKinds(over: Partial<WorkspaceKinds>): WorkspaceKinds {
  return {
    catalog: [
      {
        kind: "provider",
        id: "deepgram",
        adapter: "deepgram",
        capabilities: ["tts", "stt"],
        credentialRef: "deepgram",
        state: "active"
      },
      {
        kind: "model",
        id: "deepgram/nova-3",
        type: "stt",
        features: [],
        languages: ["en-US"],
        settings: [],
        state: "active"
      }
    ],
    apps: [
      {
        ref: "app-support",
        accessKeyId: "WOsomeoneelse",
        name: "Support",
        type: "STREAM",
        url: "wss://example.com/session",
        protocol: "fonoster",
        signingSecret: "app-secret",
        speechVoice: "deepgram/aura-2-thalia-en",
        speechLanguage: "en-US",
        speechSttModel: "deepgram/nova-3"
      },
      {
        ref: "app-bot",
        name: "Bot",
        type: "AUTOPILOT",
        url: "ws://autopilot.fonoster.com:3000",
        protocol: "fonoster",
        intelligence: {
          productRef: "llm.groq",
          config: {
            languageModel: { model: "groq/llama-3.3-70b" },
            conversationSettings: { firstMessage: "Hi" }
          }
        }
      }
    ],
    webhooks: [
      {
        ref: "wh-1",
        url: "https://hooks.example.com/f",
        events: ["call.ended"],
        secret: "whsec"
      }
    ],
    recordingPolicy: "on",
    numbers: [
      {
        ref: "cp-num-1",
        name: "Main",
        telUrl: "tel:+15550002222",
        trunkRef: "cp-trunk-1",
        aorLink: "sip:roomr@default",
        extraHeaders: [{ name: "X-App-Ref", value: "app-support" }]
      }
    ],
    routr: {
      acls: [
        {
          ref: "cp-acl-1",
          name: "Office",
          allow: ["10.0.0.0/8"],
          deny: ["0.0.0.0/0"]
        }
      ],
      trunks: [
        {
          ref: "cp-trunk-1",
          name: "Carrier",
          inboundUri: "carrier.example.com",
          accessControlListRef: "cp-acl-1"
        }
      ],
      domains: [
        {
          ref: "cp-dom-1",
          name: "Office",
          domainUri: "office.acme.local",
          accessControlListRef: "cp-acl-1",
          egressPolicies: [{ rule: ".*", numberRef: "cp-num-1" }]
        }
      ],
      agents: [
        {
          ref: "cp-agent-1",
          name: "Jane",
          username: "jane",
          domainRef: "cp-dom-1"
        }
      ]
    },
    ...over
  };
}

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const key = {
  kid: "k1",
  privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
};

/** A sealed record whose original has a recording the redacted copy withholds. */
export async function sealRecord(
  store: RecordStore,
  callRef: string,
  audio: Buffer
) {
  const base: Vcon = {
    vcon: "0.0.1",
    uuid: callRef,
    created_at: "2026-10-15T10:00:00.000Z",
    parties: [
      { tel: "+15550001111", role: "caller" },
      { tel: "+15550002222", role: "callee" }
    ],
    dialog: [
      { type: "text", body: "hello", parties: [0] },
      { type: "recording", url: "parts/recording.wav", mimetype: "audio/wav" }
    ],
    analysis: [],
    attachments: [],
    fonoster: { workspaceRef: "WOtestworkspace", status: "completed" }
  };
  const redacted: Vcon = {
    ...base,
    dialog: [{ type: "text", body: "[redacted]", parties: [0] }]
  };
  await store.putSealed(callRef, {
    version: 1,
    signed: signVcon(base, key),
    redacted: signVcon(redacted, key),
    parts: [{ name: "recording.wav", mimetype: "audio/wav", data: audio }]
  });
}
