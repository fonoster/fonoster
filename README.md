
# Fonoster: The open-source alternative to Twilio

[Fonoster Inc](https://fonoster.com) researches an innovative Programmable Telecommunications Stack that will allow for an entirely cloud-based utility for businesses to connect telephony services with the Internet.

<a href="https://discord.gg/mpWSRUhG7e"><img alt="Fonoster community banner" src="https://raw.githubusercontent.com/fonoster/.github/main/profile/community.png"></img></a>

![build](https://github.com/fonoster/fonoster/workflows/unit%20tests/badge.svg) [![release](https://github.com/fonoster/fonoster/actions/workflows/release.yml/badge.svg)](https://github.com/fonoster/fonoster/actions/workflows/release.yml) [![Discord](https://img.shields.io/discord/1016419835455996076?color=5865F2&label=Discord&logo=discord&logoColor=white)](https://discord.gg/4QWgSz4hTC) <a href="https://github.com/fonoster/fonoster/blob/main/CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Code%20of%20Conduct-v1.0-ff69b4.svg?color=%2347b96d" alt="Code Of Conduct"></a> ![GitHub](https://img.shields.io/github/license/fonoster/fonoster?color=%2347b96d) ![Twitter Follow](https://img.shields.io/twitter/follow/fonoster?style=social)

## Features 

The most notable features on FN 0.4 are:

- [x] Cloud initialization with Cloud-Init
- [x] Multitenancy
- [x] Easy deployment of PBXs functionalities
- [x] Programmable Voice Applications
- [x] NodeJS SDK
- [x] Web SDK
- [x] Support for Amazon Simple Storage Service (S3)
- [x] Secure API endpoints with Let's Encrypt
- [x] Authentication with OAuth2
- [X] Authentication with JWT 
- [x] Role-Based Access Control (RBAC)
- [x] Plugins-based Command-line Tool
- [x] Support for Google Speech API
- [x] Experimental support for Cloud Functions
- [x] Experimental support for Secret management

## Code Examples

A Voice Application is a server that takes control of the flow in a call. A Voice Application can use any combination of the following verbs:

- `Answer` - Accepts an incoming call
- `Hangup` - Closes the call
- `Play` - Takes an URL or file and streams the sound back to the calling party
- `Say` - Takes a text, synthesizes the text into audio, and streams back the result
- `Gather` - Waits for DTMF or speech events and returns back the result
- `SGather` - Returns a stream for future DTMF and speech results
- `Dial` - Passes the call to an Agent or a Number at the PSTN
- `Record` - It records the voice of the calling party and saves the audio on the Storage sub-system
- `Mute` - It tells the channel to stop sending media, effectively muting the channel
- `Unmute` - It tells the channel to allow media flow

Voice Application Example:

```typescript
const { VoiceServer } = require("@fonoster/voice");

const serverConfig = {
  pathToFiles: `${process.cwd()}/sounds`,
};

new VoiceServer(serverConfig).listen(
  async (req, res) => {
    console.log(req);
    await res.answer();
    await res.play(`sound:${req.selfEndpoint}/sounds/hello-world.sln16`);
    await res.hangup();
  }
);

// your app will live at http://127.0.0.1:3000 
// and you can easily publish it to the Internet with:
// ngrok http 3000
```

Everything in FN is an API first, and initiating a call is no exception. You can use the SDK to start a call with a few lines of code.

Example of originating a call with the SDK:

```typescript
const Fonoster = require("@fonoster/sdk");
const callManager = new Fonoster.CallManager();

callManager.call({
 from: "9842753574",
 to: "17853178070",
 webhook: "https://5a2d2ea5d84d.ngrok.io/voiceapp"
})
 .then(console.log)
 .catch(console.error);
```

## Getting Started

To get started with FN use the following resources:

- [Deploying Fonoster to the Cloud](./docs/operator/deploy-your-server.md)
- [Getting started with Fonoster](https://learn.fonoster.com/)
- [Connecting Fonoster with Dialogflow](https://learn.fonoster.com/docs/tutorials/connecting_with_dialogflow)
- [Using Google Speech APIs](https://learn.fonoster.com/docs/tutorials/using_google_speech)
- [How we created an open-source alternative to Twilio and why it matters](https://github.com/fonoster/blog/blob/main/2021/001/post.md)

## Give a Star! ⭐

If you like this project or plan to use it in the future, please give it a star. Thanks 🙏

## Bugs and Feedback

For bugs, questions, and discussions, please use the [Github Issues](https://github.com/fonoster/fonoster/issues)

## Contributing

For contributing, please see the following links:

 - [Contribution Documents](https://github.com/fonoster/fonoster/blob/main/CONTRIBUTING.md)
 - [Contributors](https://github.com/fonoster/fonoster/contributors)

<a href="https://github.com/fonoster/fonoster/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=fonoster/fonoster" />
</a>

## Sponsors

We're glad to be supported by respected companies and individuals from several industries.

<a href="https://github.com/sponsors/fonoster"><img src="https://www.camanio.com/en/wp-content/uploads/sites/11/2018/09/camanio-carerund-cclogga-transparent.png" height="50"/></a>

Find all our supporters [here](https://github.com/sponsors/fonoster)

> [Become a Github Sponsor](https://github.com/sponsors/fonoster)

## Authors
 - [Pedro Sanders](https://github.com/psanders)

## License
Copyright (C) 2023 by [Fonoster Inc](https://fonoster.com). MIT License (see [LICENSE](https://github.com/fonoster/fonoster/blob/main/LICENSE) for details).

