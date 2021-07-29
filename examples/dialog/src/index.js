/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
const {listen, talk, tts, asr} = require("./config");

module.exports = (chan) => {
  // Setting up Google TTS
  chan.overrideTTS(tts);
  chan.say("Hi! What reminder do you want to schedule?");

  let noSpeechCount = 0;
  // We keep a loop until we see the 'session.close' intent
  while (true) {
    try {
      const text = listen(chan, asr);

      // If the speaker takes too long we ask them to say again
      // after we ask several time we should to hangup
      if (text === "") {
        noSpeechCount++;
        if (noSpeechCount === 3) throw "No speech detected";
        continue;
      }

      const result = talk.findIntent.sync(talk, text);
      chan.say(result.fulfillmentText);

      // Add here your action handler

      if (result.action === "session.close") break;

      if (
        result.action.startsWith("reminders.") &&
        result.allRequiredParamsPresent
      ) {
        chan.say("Anything else I can help with?");
      }
    } catch (e) {
      // Lets try again!
      noSpeechCount = 0;
      // There was no input
      chan.say("Sorry, I didn't quite get that. Can you say again?");
    }
  }
};
