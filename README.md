
# Fonoster: The open-source alternative to Twilio

[Fonoster Inc](https://fonoster.com) researches an innovative Programmable Telecommunications Stack that will allow for an entirely cloud-based utility for businesses to connect telephony services with the Internet.

<a href="https://www.producthunt.com/posts/fonoster?utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-fonoster" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=319527&theme=dark&period=daily" alt="Fonoster - Engage&#0032;with&#0032;your&#0032;customers&#0032;with&#0032;VoIP&#0032;or&#0032;SMS | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

https://user-images.githubusercontent.com/539774/170885814-02c53689-af12-4e05-8351-e78d72f958d9.mov

![build](https://github.com/fonoster/fonoster/workflows/unit%20tests/badge.svg) <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg"></a> <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license: MIT"></a> [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Programmable%20Voice%20&url=https://github.com/fonoster/fonos&via=fonoster&hashtags=voip,sip,webrtc,telephony)



## Features

The most notable features on FN 0.2 are:

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
const voiceServer = new VoiceServer({ base: '/voiceapp' });

voiceServer.listen((req, res) => {
  console.log(req);
  res.play("sound:hello-world");
});

// your app will be at http://127.0.0.1/voiceapp 
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

 - [Contribution Documents](https://github.com/fonoster/fonoster/blob/master/CONTRIBUTING.md)
 - [Contributors](https://github.com/fonoster/fonoster/contributors)

We're glad to be supported by respected companies and individuals from several industries. [See our Github Sponsors learn more](https://github.com/sponsors/psanders).

**Sponsors**

<a href="https://github.com/sponsors/psanders"><img src="https://www.camanio.com/en/wp-content/uploads/sites/11/2018/09/camanio-carerund-cclogga-transparent.png" height="50"/></a>

Find all supporters in our [`BACKERS.md`](./BACKERS.md) file.

> [Become a Github Sponsor](https://github.com/sponsors/fonoster)

---

<p align="center">
		<sup>Special Announcement:</sup>
		<br>
		<a href="https://form.typeform.com/to/CvQqk9">
			<img width="70px" src="https://assets.brandfolder.com/pl546j-7le8zk-afym5u/original/Slack_Mark_Web.png">
		</a>
		<br>
		<sub><b>We now have a Slack Channel</b></sub>
		<br>
		<sub>There we plan to discuss roadmaps, feature requests and more<br><a href="https://form.typeform.com/to/CvQqk9">Join the channel</a></sub>
</p>

---

## Authors
 - [Pedro Sanders](https://github.com/psanders)

## License
Copyright (C) 2022 by [Fonoster Inc](https://fonoster.com). MIT License (see [LICENSE](https://github.com/fonoster/fonoster/blob/master/LICENSE) for details).

