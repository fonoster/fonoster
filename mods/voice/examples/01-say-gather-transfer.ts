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
// A small receptionist: greet, ask, and transfer to a person on request.
// Run: APP_SIGNING_SECRET=... npx tsx 01-say-gather-transfer.ts
import { Session, VoiceServer } from "@fonoster/voice";

new VoiceServer({
  port: 3000,
  signingSecret: process.env.APP_SIGNING_SECRET
}).listen(async (session: Session) => {
  await session.say(
    "Thanks for calling. Say sales or support, or press 0 for an operator."
  );
  const answer = await session.gather({
    source: "speech_and_dtmf",
    timeout: 6000
  });

  if (
    answer.digits === "0" ||
    /operator|person|human/i.test(answer.speech ?? "")
  ) {
    await session.say("One moment, I am connecting you.");
    // Cold transfer: resolves when the session ends with reason "transfer".
    await session.transfer("+15551234567");
    return;
  }

  if (answer.speech) await session.say(`You said ${answer.speech}. Goodbye.`);
  else await session.say("I did not hear anything. Goodbye.");
  await session.hangup();
});
