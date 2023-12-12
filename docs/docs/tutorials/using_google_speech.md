# Using Fonoster with Google speech APIs

This quick guide will walk you thorugh what is needed to **enable Google Speech in Fonoster**, and unlock the potential
of using Text-to-Speech (TTS) and Automatic Speech Recognition (ASR) in your Voice Applications.

## Obtaining a Service Account Key

To use Google Speech in Fonoster **you will need a Service Account Key**. 

To obtain the key please perform the following steps.

1. Open GCP console https://console.cloud.google.com/
2. Select or create a new project
> Assign a name and organization, you can leave those to be the default values
3. Search for "Cloud Speech-to-Text API" and enable it
> Check the documentation for the [Cloud Speech-to-Text API](https://cloud.google.com/speech-to-text/docs?hl=es_419&_ga=2.185527210.-2040607004.1664903945)
4. Search for "Service accounts" and create a new service account
5. Add a key to the service account 
6. Choose JSON format
7. Download and save in a safe location

## Using the Speech APIs in a Voice Application

To use the speech APIs you first need to install the NPM plugins with:

```bash
npm install @fonoster/googleasr @fonoster/googletts
```

Then, configure the Voice Server to use the plugins we just installed. For example:

```javascript
const { VoiceServer } = require("@fonoster/voice");
const GoogleTTS = require("@fonoster/googletts");
const GoogleASR = require("@fonoster/googleasr");
const voiceServer = new VoiceServer();
const speechConfig = { keyFilename: "./google.json" };

// Set the server to use the speech APIS
voiceServer.use(new GoogleTTS(speechConfig));
voiceServer.use(new GoogleASR(speechConfig));

voiceServer.listen(async(req, res) => {
  console.log(req);
  await res.answer();
  // To use this verb you MUST have a TTS plugin
  const speech = await res.gather();

  await res.say("You said " + speech);
  await res.hangup();
});
```

That's all. Now you can use Google Speech APIs in your Fonoster applications.
