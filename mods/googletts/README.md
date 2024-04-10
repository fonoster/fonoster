Voice application plugin that converts text into natural-sounding speech using an API powered by Google's Speech technologies.

## Installation

```bash
npm install @fonoster/googletts
```

or

```bash
yarn add @fonoster/googletts
```

## Usage

```javascript
const { VoiceServer } = require("@fonoster/voice");
const GoogleTTS = require("@fonoster/googletts");

const voiceServer = new VoiceServer({ base: '/voiceapp' });

// Set the server to use Google's TTS
const speechConfig = { keyFilename: "./google.json" };
voiceServer.use(new GoogleTTS(speechConfig));

voiceServer.listen(async(req, res) => {
  console.log(req);
  await res.answer();
  await res.say("Hi! This is google text to speech");
  await res.hangup();
});
```
