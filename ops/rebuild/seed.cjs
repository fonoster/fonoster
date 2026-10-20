#!/usr/bin/env node
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
/* global process, console, setTimeout */
// Seeds the local rebuild stack through the public API (@fonoster/sdk), idempotently:
//   workspace "Demo", an API key, a SIP Domain + Credentials + Agent for a softphone, a carrier
//   Trunk, one Autopilot app, and a Number on that Trunk pointing at the app.
//
// Run by `ops/rebuild/stack seed`. Reads RB_API_ENDPOINT, RB_ADMIN_EMAIL, RB_ADMIN_PASSWORD,
// RB_AGENT_PASSWORD, RB_SEED_FILE and, to override what the catalog offers, RB_DEFAULT_VOICE,
// RB_DEFAULT_STT and RB_DEFAULT_MODEL (catalog ids) from the environment, and writes the result
// (refs and the local credentials) to RB_SEED_FILE. Nothing here is meant for a shared or production deployment.
const fs = require("fs");
const SDK = require("@fonoster/sdk");

const env = (name, def) => {
  const v = process.env[name] ?? def;
  if (v === undefined) throw new Error(`${name} is not set`);
  return v;
};

const endpoint = env("RB_API_ENDPOINT", "localhost:16449");
const seedFile = env("RB_SEED_FILE");
const DEMO = {
  workspace: "Demo",
  domainUri: env("RB_SIP_DOMAIN", "demo.fonoster.local"),
  agentUser: "softphone",
  agentPassword: env("RB_AGENT_PASSWORD"),
  // One label under sip.<domain>: the API requires it (features.trunks.inboundUri).
  trunkUri: env("RB_CARRIER_URI", "carrier.sip.fonoster.local"),
  number: env("RB_DEMO_NUMBER", "+17853178070"),
  appName: "Demo Autopilot"
};

const LANGUAGE = "en-US";

// Picked when the workspace can use them (as the dashboard does for a new agent).
const PREFERRED = {
  voice: ["deepgram/aura-2-thalia-en"],
  stt: ["deepgram/nova-3"],
  llm: ["groq/openai/gpt-oss-120b", "openai/gpt-4o-mini"]
};

/** Whether a catalog item serves the app's language ("multi" or no languages: any). */
const speaks = (item) =>
  !item.languages?.length ||
  item.languages.some(
    (l) => l === "multi" || l.split("-")[0] === LANGUAGE.split("-")[0]
  );

/**
 * The demo app's voice, transcriber and model: RB_DEFAULT_VOICE / RB_DEFAULT_STT /
 * RB_DEFAULT_MODEL when set, else from what the workspace's catalog offers (the vendors with a
 * platform key, and the providers that need none): a preferred item, else the first that serves
 * the language.
 */
function choose(items) {
  const offered = (kind, type) =>
    items.filter((i) => i.kind === kind && (!type || i.type === type));
  const pick = (name, options, preferred) => {
    const id =
      process.env[name] ||
      preferred.find((p) => options.some((o) => o.id === p)) ||
      options.find(speaks)?.id;
    if (!id)
      throw new Error(
        `the catalog offers no ${name.slice(11).toLowerCase()} (set ${name})`
      );
    return id;
  };
  return {
    voice: pick("RB_DEFAULT_VOICE", offered("voice"), PREFERRED.voice),
    sttModel: pick("RB_DEFAULT_STT", offered("model", "stt"), PREFERRED.stt),
    model: pick("RB_DEFAULT_MODEL", offered("model", "llm"), PREFERRED.llm)
  };
}

// The session agent schema (sessionAgentSchema): the model is a catalog id, and the
// recognition hints bias Deepgram toward the product name.
const agent = (model) => ({
  conversationSettings: {
    firstMessage: "Hello, this is the Fonoster demo agent. How can I help you?",
    systemPrompt:
      "You are a friendly receptionist for a small business that answers the phone. Keep answers short: one or two sentences.",
    goodbyeMessage: "Thanks for calling. Goodbye!",
    systemErrorMessage: "Sorry, something went wrong on my side.",
    idleOptions: {
      message: "Are you still there?",
      timeout: 30000,
      maxTimeoutCount: 2
    },
    hints: ["Fonoster"]
  },
  languageModel: {
    model,
    temperature: 0.4,
    maxTokens: 250
  }
});

async function login(accessKeyId) {
  const client = new SDK.Client({ endpoint, accessKeyId, allowInsecure: true });
  await client.login(env("RB_ADMIN_EMAIL"), env("RB_ADMIN_PASSWORD"));
  return client;
}

async function retry(what, fn, tries = 60) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries) throw new Error(`${what}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

const items = (r) => r.items ?? [];

async function main() {
  const saved = fs.existsSync(seedFile)
    ? JSON.parse(fs.readFileSync(seedFile, "utf8"))
    : {};

  // The owner (identity.owner in fonoster.yaml) is created on the apiserver's first boot.
  const userClient = await retry("login", () => login(""));
  const workspaces = new SDK.Workspaces(userClient);
  let ws = items(await workspaces.listWorkspaces()).find(
    (w) => w.name === DEMO.workspace
  );
  if (!ws) {
    const { ref } = await workspaces.createWorkspace({ name: DEMO.workspace });
    ws = await workspaces.getWorkspace(ref);
  }
  // A fresh token carries the new workspace.
  const client = await login(ws.accessKeyId);
  const picked = choose(items(await new SDK.Providers(client).listCatalog({})));

  const apiKeys = new SDK.ApiKeys(client);
  let apiKey = saved.apiKey;
  const keys = items(await apiKeys.listApiKeys({ pageSize: 100 }));
  if (!apiKey || !keys.some((k) => k.accessKeyId === apiKey.accessKeyId)) {
    const created = await apiKeys.createApiKey({ role: "WORKSPACE_ADMIN" });
    apiKey = {
      accessKeyId: created.accessKeyId,
      accessKeySecret: created.accessKeySecret
    };
  }

  const domains = new SDK.Domains(client);
  const domain =
    items(await domains.listDomains({ pageSize: 100 })).find(
      (d) => d.domainUri === DEMO.domainUri
    ) ??
    (await domains.createDomain({ name: "Demo", domainUri: DEMO.domainUri }));

  const credentials = new SDK.Credentials(client);
  const credName = `${DEMO.agentUser} credentials`;
  let cred = items(await credentials.listCredentials({ pageSize: 100 })).find(
    (c) => c.name === credName
  );
  if (cred) {
    await credentials.updateCredentials({
      ref: cred.ref,
      name: credName,
      password: DEMO.agentPassword
    });
  } else {
    cred = await credentials.createCredentials({
      name: credName,
      username: DEMO.agentUser,
      password: DEMO.agentPassword
    });
  }

  const agents = new SDK.Agents(client);
  // listAgents fails to decode agents that have credentials (SDK: credentials.toObject is not a
  // function), so a re-run reuses the ref it saved instead of listing (ST-B9).
  const agent =
    saved.agent?.ref && saved.workspace?.ref === ws.ref
      ? { ref: saved.agent.ref }
      : await agents.createAgent({
          name: "Softphone",
          username: DEMO.agentUser,
          domainRef: domain.ref,
          credentialsRef: cred.ref,
          privacy: "NONE",
          enabled: true,
          maxContacts: 3
        });

  const trunks = new SDK.Trunks(client);
  const trunk =
    items(await trunks.listTrunks({ pageSize: 100 })).find(
      (t) => t.inboundUri === DEMO.trunkUri
    ) ??
    (await trunks.createTrunk({
      name: "Local carrier",
      inboundUri: DEMO.trunkUri,
      sendRegister: false,
      uris: []
    }));

  // Created once, then brought in line with the current keys (voice, model) on every seed.
  const applications = new SDK.Applications(client);
  const appRequest = {
    name: DEMO.appName,
    type: "AUTOPILOT",
    speech: {
      voice: picked.voice,
      language: LANGUAGE,
      sttModel: picked.sttModel
    },
    intelligence: {
      productRef: `llm.${picked.model.split("/")[0]}`,
      config: agent(picked.model)
    }
  };
  const existing = items(
    await applications.listApplications({ pageSize: 100 })
  ).find((a) => a.name === DEMO.appName);
  const app = existing
    ? (await applications.updateApplication({
        ref: existing.ref,
        ...appRequest
      }),
      existing)
    : await applications.createApplication(appRequest);

  const numbers = new SDK.Numbers(client);
  const telUrl = `tel:${DEMO.number}`;
  let number = items(await numbers.listNumbers({ pageSize: 100 })).find(
    (n) => n.telUrl === telUrl
  );
  if (!number) {
    number = await numbers.createNumber({
      name: "Demo number",
      telUrl,
      city: "Topeka",
      country: "United States",
      countryIsoCode: "US",
      appRef: app.ref,
      trunkRef: trunk.ref
    });
  }

  const result = {
    workspace: { ref: ws.ref, accessKeyId: ws.accessKeyId, name: ws.name },
    apiKey,
    domain: { ref: domain.ref, domainUri: DEMO.domainUri },
    agent: {
      ref: agent.ref,
      username: DEMO.agentUser,
      password: DEMO.agentPassword
    },
    trunk: { ref: trunk.ref, inboundUri: DEMO.trunkUri },
    app: { ref: app.ref, name: DEMO.appName },
    number: { ref: number.ref, telUrl }
  };
  fs.writeFileSync(seedFile, JSON.stringify(result, null, 2) + "\n", {
    mode: 0o600
  });
  console.log(
    JSON.stringify({
      ok: true,
      app: result.app,
      number: telUrl,
      model: picked.model,
      voice: picked.voice,
      sttModel: picked.sttModel
    })
  );
}

// Routr starts after the API server (about a minute on a cold start); Routr-backed calls answer
// INTERNAL until then, so the whole (idempotent) seed is retried.
retry("seed", main, 45).catch((e) => {
  console.error(`seed failed: ${e.message}`);
  process.exit(1);
});
