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
