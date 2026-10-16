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
// Barge-in. The gateway never cuts the agent off by itself; the SDK sends `clear` when the caller
// talks over a say() or play() that is interruptible (the default).
import { Session, VoiceServer } from "@fonoster/voice";

new VoiceServer({
  port: 3000,
  signingSecret: process.env.APP_SIGNING_SECRET
}).listen(async (session: Session) => {
  // Interruptible (default): if the caller talks over it, say() resolves with interrupted: true
  // and heardText holds only the words that were actually spoken.
  const result = await session.say(
    "Your account balance is forty two dollars, and your next payment is due on the first."
  );
  if (result.interrupted) {
    await session.say(`Sorry, go ahead. I had only said: ${result.heardText}`);
  }

  // Not interruptible: legal text the caller must hear. The caller can talk, but the
  // agent keeps going and the speech is kept for the next gather() (type-ahead).
  await session.say("This call may be recorded for quality purposes.", {
    interruptible: false
  });

  const reply = await session.gather({ timeout: 5000 });
  await session.say(reply.speech ? `You said: ${reply.speech}` : "Goodbye.");
  await session.hangup();
});
