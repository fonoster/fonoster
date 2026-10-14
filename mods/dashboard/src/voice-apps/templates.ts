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
    description: "Answer, speak, collect digits or speech",
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
    description: "Just answer the call",
    speech: false
  }
];

const CODE: Record<TemplateId, string> = {
  ivr: `const { VoiceServer } = require("@fonoster/voice");

new VoiceServer().listen(async (req, voice) => {
  await voice.answer();
  await voice.say("1 for sales, 2 for support.");

  const { digits } = await voice.gather({
    maxDigits: 1
  });

  const team = digits === "1" ? "sales" : "support";
  await voice.say(\`Connecting you to \${team}.\`);
  await voice.hangup();
});`,
  stream: `const { VoiceServer, StreamDirection } = require("@fonoster/voice");

new VoiceServer().listen(async (req, voice) => {
  await voice.answer();

  const stream = await voice.stream({
    direction: StreamDirection.BOTH
  });

  stream.onPayload((payload) => {
    // Send the caller's audio to your own AI
  });
});`,
  blank: `const { VoiceServer } = require("@fonoster/voice");

new VoiceServer().listen(async (req, voice) => {
  await voice.answer();
  // Your call logic here
});`
};

export function templateCode(id: TemplateId) {
  return CODE[id];
}

/** The short handler shown on a voice app's page. */
export function handlerSnippet(appRef: string) {
  return `new VoiceServer().listen(async (req, voice) => {
  // req.ingressNumber · req.sessionRef · req.appRef = "${appRef}"
  await voice.answer();
  …
});`;
}

export const RUN_LOCALLY = "node index.js && ngrok tcp 50061";

export const SDK_DOCS_URL = "https://docs.fonoster.com/reference/sdk/voice";
