const dialogflow = require('@google-cloud/dialogflow')
const uuid = require('uuid')

class Talk {
    constructor(projectId, credentials) {
        const sessionId = uuid.v4()
        // Create a new session
        this.sessionClient = new dialogflow.SessionsClient(credentials)
        this.sessionPath = this.sessionClient.projectAgentSessionPath(projectId, sessionId)
    }

    findIntentSync(txt) {
        const sleep = require('sync').sleep
        const request = {
            session: this.sessionPath,
            queryInput: {
                text: {
                    text: txt,
                    languageCode: 'en-US',
                },
            },
        }
        let responses
        let error
        
        this.sessionClient.detectIntent(request)
            .then(r => (responses = r))
            .catch(e => (error = e))

        while (responses === undefined && error === undefined) sleep(100)

        return responses[0].queryResult
    }
}

module.exports = Talk