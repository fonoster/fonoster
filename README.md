![build](https://github.com/fonoster/fonos/workflows/unit%20tests/badge.svg) <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg"></a> <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license: MIT"></a> [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Programmable%20Voice%20&url=https://github.com/fonoster/fonos&via=fonoster&hashtags=voip,sip,webrtc,telephony)

![Repo Banner](https://raw.githubusercontent.com/fonoster/fonos/master/docs/assets/images/repo_banner.jpg)

With Project Fonos, [Fonoster Inc](https://fonoster.com) researches an innovative Programmable Telecommunications Stack that will allow for an entirely cloud-based utility for businesses to connect telephony services with the Internet.

Project Fonos aims to solve businesses needing to add voice, video, and messaging features to their websites and applications. Companies are, in most cases, unable to accomplish this independently due to the complexity and number of telephony services involved in the task. Instead, businesses rely on third-party providers that offer software as a service (SaaS) that allows for communication between telephony devices and internet-based APIs, services, etc. 

The primary innovation of Project Fonos lies in researching and developing the means for creating a highly portable, extensible, cloud-based Programmable Telecommunications Stack. Using this form of CPaaS, businesses will call up an API to dial, answer a call, establish a video session, send SMS, etc., all with just HTTP requests and without worrying what servers and networks are doing with that information in the background. For Project Fonos to be a viable alternative to existing CPaaS, the system must be portable. Therefore, Project Fonos must take advantage of the various cloud environments such as Kubernetes and AWS ECS to run solutions at scale. Guaranteeing portability for Project Fonos will also mean ensuring the deployability of the system using a "single-click-install" when possible.

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

## Architecture 

High-level overview

![Repo Banner](https://raw.githubusercontent.com/fonoster/fonos/dev/docs/assets/images/arquitecture.png)

> Conceptual architecture and stack. We will post more details soon.

## Code Examples

A Voice Application is a server that takes control of the flow in a call. A Voice Application can use any combination of the following verbs:

- `Play` - Takes an URL or file and streams the sound back to the calling party
- `Say` - Takes a text, synthesizes the text into audio, and streams back the result
- `Gather` - Waits for DTMF events and returns back the result
- `Record` - It records the voice of the calling party and saves the audio on the Storage sub-system
- `Mute` - It tells the channel to stop sending media, effectively muting the channel
- `Unmute` - It tells the channel to allow media flow

Voice Application Example:

```typescript
const { VoiceServer } = require("@fonos/voice");
const voiceServer = new VoiceServer({ base: '/voiceapp' });

voiceServer.listen((req, res) => {
  console.log(req);
  res.play("sound:hello-world");
});

// your app will leave at http://127.0.0.1/voiceapp 
// and you can easily publish it to the Internet with:
// ngrok http 3000
```

Everything in PF is an API first, and initiating a call is no exception. You can use the SDK to start a call with a few lines of code.

Example of originating a call with the SDK:

```typescript
const Fonos = require("@fonos/sdk");
const callManager = new Fonos.CallManager();

callManager.call({
 from: "9842753574",
 to: "17853178070",
 webhook: "https://5a2d2ea5d84d.ngrok.io/voiceapp"
})
.then(console.log)
.catch(console.error);
```

## Getting Started

![command-line tool](https://raw.githubusercontent.com/fonoster/fonos/dev/docs/assets/images/console.png)

To get started with PF use the following resources:

- [Deploying Project Fonos to the Cloud](./docs/operator/deploy-your-server.md)
- [An introduction to Programmable Voice Applications](https://github.com/fonoster/blog/blob/main/2021/002/post.md)
- [How we created an open-source alternative to Twilio and why it matters](https://github.com/fonoster/blog/blob/main/2021/001/post.md)

## Bugs and Feedback

For bugs, questions, and discussions, please use the [Github Issues](https://github.com/fonoster/fonos/issues)

## Contributing

For contributing, please see the following links:

 - [Contribution Documents](https://github.com/fonoster/fonos/blob/master/CONTRIBUTING.md)
 - [Contributors](https://github.com/fonoster/fonos/contributors)

We're glad to be supported by respected companies and individuals from several industries. [See our Github Sponsors learn more](https://github.com/sponsors/psanders).

**Platinum Sponsors**

<a href="https://github.com/sponsors/psanders"><img src="https://www.camanio.com/en/wp-content/uploads/sites/11/2018/09/camanio-carerund-cclogga-transparent.png" height="50"/></a>

Find all supporters in our [`BACKERS.md`](./BACKERS.md) file.

> [Support Fono's developers on Gh Sponsors](https://github.com/sponsors/psanders)

---

## Authors
 - [Pedro Sanders](https://github.com/psanders)

## License
Copyright (C) 2021 by [Fonoster Inc](https://fonoster.com). MIT License (see [LICENSE](https://github.com/fonoster/fonos/blob/master/LICENSE) for details).

