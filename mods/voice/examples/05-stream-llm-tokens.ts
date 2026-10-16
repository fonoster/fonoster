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
// Stream LLM tokens straight into speech: one utterance, sent as `speak` pieces sharing an id.
import { Session, VoiceServer } from "@fonoster/voice";

async function* reply(question: string): AsyncGenerator<string> {
  // Replace with your model's token stream.
  for (const token of [
    "You ",
    "asked ",
    `"${question}". `,
    "Here ",
    "is ",
    "my ",
    "answer."
  ])
    yield token;
}

new VoiceServer({
  port: 3000,
  signingSecret: process.env.APP_SIGNING_SECRET
}).listen(async (session: Session) => {
  await session.say("Ask me anything.");
  const q = await session.gather({ timeout: 6000 });
  if (q.speech) await session.say(reply(q.speech));
  await session.hangup();
});
