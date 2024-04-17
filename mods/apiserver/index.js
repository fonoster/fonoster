const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
  
app.post('/dialogflow', (req, res) => {
  const agent = new WebhookClient({request: req, response: res});
  function handleRequest(agent) {
    // Extract phone number from request (placeholder for validation)
    if (agent.action !== 'Menu.Menu-yes') {
      return;
    }

    console.log(req.body);
    const phoneNumber = req.body
      .originalDetectIntentRequest.payload.telephony.caller_id;

    // Replace with your actual SMS sending logic (e.g., using Twilio)
    console.log(`Sending SMS to: ${phoneNumber}`);

    // Inform user and trigger "GreettingsDefaultIntent" context
    agent.add(`It seems you are calling from a landline and we were unable to deliver the text. Please call from a mobile number and try again.`);
    agent.setContext('GreetingsFollowup', 0, { phoneNumber: phoneNumber });
  }

  agent.handleRequest(handleRequest);
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});