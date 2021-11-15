Voice application plugin that accurately convert speech into text using an API powered by Google’s AI technologies.

## Installation

```bash
npm install @fonoster/googleasr
```

or

```bash
yarn add @fonoster/googleasr
```

## Usage

```javascript
const { VoiceServer } = require("@fonoster/voice");
const GoogleASR = require("@fonoster/googleasr");
const voiceServer = new VoiceServer({ base: '/voiceapp' });

// Set the server to use the speech APIS
const speechConfig = { keyFilename: "./google.json" };
voiceServer.use(new GoogleASR(speechConfig));

voiceServer.listen(async(req, res) => {
  console.log(req);
  await res.answer();
  // To use this verb you MUST have a TTS plugin
  const speech = await res.gather();

  console.log("User input: " + speech");
  await res.hangup();
});
```
