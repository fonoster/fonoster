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
const dialogflow = require("@google-cloud/dialogflow");
const uuid = require("uuid");

class Talk {
  constructor(projectId, credentials) {
    const sessionId = uuid.v4();
    // Create a new session
    this.sessionClient = new dialogflow.SessionsClient(credentials);
    this.sessionPath = this.sessionClient.projectAgentSessionPath(
      projectId,
      sessionId
    );
  }

  findIntent(txt, callback) {
    const request = {
      session: this.sessionPath,
      queryInput: {
        text: {
          text: txt,
          languageCode: "en-US"
        }
      }
    };
    process.nextTick(() => {
      this.sessionClient
        .detectIntent(request)
        .then((responses) => {
          callback(null, responses[0].queryResult);
        })
        .catch((e) => callback(e));
    });
  }
}

module.exports = Talk;
