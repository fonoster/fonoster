Voice application plugin that converts text into natural-sounding speech using an API powered by Amazon’s AI technologies.

## Installation

```cli
npm install @fonoster/pollytts
```

or

```cli
yarn add @fonoster/pollytts
```

## Usage

```javascript
const { VoiceServer } = require("@fonoster/voice");
const PollyTTS, { Voice } = require("@fonoster/pollytts");

const voiceServer = new VoiceServer();

// Set the server to use Polly
const speechConfig = { keyFilename: "./amazon.json" };
voiceServer.use(new PollyTTS(speechConfig));

voiceServer.listen(async(req, res) => {
  console.log(req);
  await res.answer();
  await res.say("Hi! This is polly text to speech", { voice: Voice.BIANCA });
  await res.hangup();
});
```
