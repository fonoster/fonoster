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
// appsync (rebuild stack, ST-B4): makes Autopilot apps created through the API or the dashboard
// answer calls on the new path, until the apiserver does it on create.
//
// For every AUTOPILOT application it
//   1. writes the session-app columns the gateway reads (url = the hosted Autopilot, flavor native,
//      the hosted Autopilot's signing secret, speech voice and language), and
//   2. writes the hosted Autopilot's assistants file ({apps: {<appRef>: {workspaceRef, assistant}}})
//      with each stored assistant converted to the session assistant schema.
//
// Runs inside the apiserver image (its Prisma client, encryption and fonoster.yaml):
//   node appsync.cjs            # once
//   node appsync.cjs --watch    # every RB_APPSYNC_EVERY_MS (default 3000)
//
// Environment: AUTOPILOT_SIGNING_SECRET, RB_AUTOPILOT_URL, RB_DEFAULT_VOICE, RB_TTS_PROVIDERS
// (comma-separated providers the gateway has), RB_ASSISTANTS_FILE.
const fs = require("fs");
const path = require("path");

const APISERVER = process.env.RB_APISERVER_DIST ?? "/work/mods/apiserver/dist";
const secret = process.env.AUTOPILOT_SIGNING_SECRET;
const url = process.env.RB_AUTOPILOT_URL ?? "ws://autopilot:3000";
const defaultVoice =
  process.env.RB_DEFAULT_VOICE ?? "deepgram/aura-2-thalia-en";
const ttsProviders = (process.env.RB_TTS_PROVIDERS ?? "deepgram")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);
const file =
  process.env.RB_ASSISTANTS_FILE ??
  "/var/lib/fonoster/assistants/assistants.json";
const every = Number(process.env.RB_APPSYNC_EVERY_MS ?? 3000);

const SETTINGS = [
  "firstMessage",
  "systemPrompt",
  "goodbyeMessage",
  "systemErrorMessage",
  "initialDtmf",
  "maxSessionDuration",
  "idleOptions",
  "allowUserBargeIn"
];

/** A stored (legacy) assistant as the hosted Autopilot's session assistant (strict schema). */
function toSessionAssistant(legacy) {
  const cs = legacy?.conversationSettings ?? {};
  const lm = legacy?.languageModel ?? {};
  const conversationSettings = {};
  for (const key of SETTINGS)
    if (cs[key] !== undefined && cs[key] !== null)
      conversationSettings[key] = cs[key];
  conversationSettings.systemPrompt ??= "You are a helpful phone assistant.";
  conversationSettings.goodbyeMessage ??= "Goodbye!";
  conversationSettings.systemErrorMessage ??= "Sorry, something went wrong.";
  if (cs.transferOptions?.phoneNumber)
    conversationSettings.transferOptions = {
      phoneNumber: cs.transferOptions.phoneNumber,
      message: cs.transferOptions.message ?? ""
    };
  // VAD-era wait → the patience knob (rework-autopilot AP-B3).
  conversationSettings.patience =
    (cs.maxSpeechWaitTimeout ?? 0) > 0 ? "high" : "normal";
  const model = String(lm.model ?? "gpt-4o-mini");
  const languageModel = {
    model: model.includes("/") ? model : `${lm.provider ?? "openai"}/${model}`
  };
  if (typeof lm.temperature === "number")
    languageModel.temperature = lm.temperature;
  if (typeof lm.maxTokens === "number") languageModel.maxTokens = lm.maxTokens;
  if (Array.isArray(lm.tools)) languageModel.tools = lm.tools;
  if (Array.isArray(lm.knowledgeBase))
    languageModel.knowledgeBase = lm.knowledgeBase;
  return { conversationSettings, languageModel };
}

/** The app's voice: its own, else its legacy TTS voice when the gateway has that provider. */
function voiceFor(app) {
  if (app.speechVoice) return app.speechVoice;
  const vendor = app.textToSpeech?.productRef?.split(".")[1];
  const voice = app.textToSpeech?.config?.voice;
  if (vendor && voice && ttsProviders.includes(vendor))
    return `${vendor}/${voice}`;
  return defaultVoice;
}

function languageFor(app) {
  return (
    app.speechLanguage ??
    app.speechToText?.config?.languageCode ??
    app.textToSpeech?.config?.languageCode ??
    "en-US"
  );
}

function writeIfChanged(target, text) {
  if (fs.existsSync(target) && fs.readFileSync(target, "utf8") === text)
    return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text, { mode: 0o644 });
  fs.renameSync(tmp, target);
  return true;
}

async function syncOnce(prisma) {
  const apps = await prisma.application.findMany({
    where: { type: "AUTOPILOT" },
    include: { intelligence: true, textToSpeech: true, speechToText: true },
    orderBy: { createdAt: "asc" }
  });
  const assistants = {};
  let updated = 0;
  for (const app of apps) {
    assistants[app.ref] = {
      workspaceRef: app.accessKeyId,
      assistant: toSessionAssistant(app.intelligence?.config)
    };
    const want = {
      url,
      flavor: "native",
      signingSecret: secret,
      speechVoice: voiceFor(app),
      speechLanguage: languageFor(app)
    };
    if (Object.entries(want).some(([k, v]) => app[k] !== v)) {
      await prisma.application.update({ where: { ref: app.ref }, data: want });
      updated++;
      console.log(
        `appsync: ${app.ref} (${app.name}) → ${url}, voice ${want.speechVoice}`
      );
    }
  }
  if (
    writeIfChanged(file, JSON.stringify({ apps: assistants }, null, 2) + "\n")
  )
    console.log(
      `appsync: wrote ${Object.keys(assistants).length} assistant(s) to ${file}`
    );
  return { apps: apps.length, updated };
}

async function main() {
  if (!secret) throw new Error("AUTOPILOT_SIGNING_SECRET is not set");
  // Always leave a readable file, even before the first app exists.
  if (!fs.existsSync(file)) writeIfChanged(file, '{ "apps": {} }\n');
  const { prisma } = require(path.join(APISERVER, "core", "db"));
  if (!process.argv.includes("--watch")) {
    console.log(JSON.stringify(await syncOnce(prisma)));
    return prisma.$disconnect();
  }
  for (;;) {
    try {
      await syncOnce(prisma);
    } catch (e) {
      // The apiserver may still be applying migrations; try again on the next tick.
      console.warn(`appsync: ${e.message.split("\n").slice(-1)[0]}`);
    }
    await new Promise((r) => setTimeout(r, every));
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(`appsync failed: ${e.message}`);
    process.exit(1);
  });
}

module.exports = { toSessionAssistant, voiceFor, languageFor };
