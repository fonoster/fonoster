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
/** Starter code shown next to the create form and on the detail page. */

export type TemplateId = "ivr" | "stream" | "blank";

export const TEMPLATES: {
  id: TemplateId;
  title: string;
  description: string;
  /** Whether the template uses say() / gather(). */
  speech: boolean;
}[] = [
  {
    id: "ivr",
    title: "IVR menu",
    description: "Speak, collect digits or speech",
    speech: true
  },
  {
    id: "stream",
    title: "Audio stream",
    description: "Send live call audio to your own AI",
    speech: false
  },
  {
    id: "blank",
    title: "Blank",
    description: "An empty session handler",
    speech: false
  }
];

const CODE: Record<TemplateId, string> = {
  ivr: `const { VoiceServer } = require("@fonoster/voice");

new VoiceServer().listen(async (session) => {
  await session.say("1 for sales, 2 for support.");

  const { digits } = await session.gather({
    maxDigits: 1
  });

  const team = digits === "1" ? "sales" : "support";
  await session.say(\`Connecting you to \${team}.\`);
  await session.hangup();
});`,
  stream: `const { VoiceServer } = require("@fonoster/voice");

new VoiceServer().listen(async (session) => {
  session.audio.onFrame((frame) => {
    // Send the caller's audio to your own AI;
    // play its answer with session.audio.send(bytes)
  });
});`,
  blank: `const { VoiceServer } = require("@fonoster/voice");

new VoiceServer().listen(async (session) => {
  // Your call logic here
});`
};

export function templateCode(id: TemplateId) {
  return CODE[id];
}

/** The short handler shown on a voice app's page. */
export function handlerSnippet(appRef: string) {
  return `new VoiceServer().listen(async (session) => {
  // session.to · session.callRef · session.appRef = "${appRef}"
  …
});`;
}

export const RUN_LOCALLY = "node index.js && ngrok http 3000";

export const SDK_DOCS_URL = "https://docs.fonoster.com/reference/sdk/voice";
