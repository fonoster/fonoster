
![Repo Banner](https://raw.githubusercontent.com/fonoster/fonos/master/repo_banner.jpg)

![build](https://github.com/fonoster/fonos/workflows/unit%20tests/badge.svg) <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg"></a> <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license: MIT"></a> [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Programmable%20Voice%20&url=https://github.com/fonoster/fonos&via=fonoster&hashtags=voip,sip,webrtc,telephony)

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

## Table of Contents

### Launch additional services

### Prepare the environment

- [About](#about)
  - [Where are we today?](#where-are-we-today)
  - [Who is Project Fonos for?](#who-is-project-fonos-for)
- [Getting Started](#getting-started)
- [Single-host Installation](#single-host-installation)
- [Creating a Voice Application](#creating-a-voice-application)
  - [Publishing a Voice Application with Ngrok](#publishing-a-voice-application-with-ngrok)
- [Configuring a SIP Network](#configuring-the-sip-network)
  - [Adding a SIP Service Provider](#adding-a-sip-service-provider)
  - [Adding a SIP Number](#adding-a-sip-number)
  - [Adding a SIP Domain](#adding-a-sip-domain)
- [Initiating a call with the SDK](#initiating-a-call-with-the-sdk)
- [Creating a Cloud Function](#creating-a-cloud-function)
  - [Managing Secrets](#managing-secrets)
- [Bugs and Feedback](#bugs-and-feedback)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)

## About

With Project Fonos, [Fonoster Inc](https://fonoster.com). researches an innovative Programmable Telecommunications Stack that will allow for a completely cloud-based utility for businesses to connect telephony services with the internet.

Project Fonos aims to be a solution for businesses needing to add voice, video, and messaging features to their websites and applications. Businesses are, in most cases, unable to accomplish this independently due to the complexity and number of telephony services involved in the task. Instead, businesses rely on third-party providers that offer software as a service (SaaS) that allow for communication between telephony devices and internet-based API’s, services, etc. 

The primary innovation of Project Fonos lies in researching and developing the means for creating a highly portable, extensible, full feature, cloud-based Programmable Telecommunications Stack. Using this form of CPaaS, businesses will be able to call up an API to dial, answer a call, establish a video session, send SMS, etc., all with just HTTP requests and without worrying what servers and networks are doing with that information in the background. For Project Fonos to be a viable alternative to existing CPaaS, the system must be portable. Therefore, Project Fonos must take advantage of the various cloud environments such as Kubernetes and AWS ECS to run solutions at scale. Guaranteeing portability for the Project Fonos will also mean ensuring the deployability of the system using a "single-click-install" when possible.

### Where are we today?

As you can imagine this is an enormous task and will need all hands on deck and a lot of resources. Since we are a small team we decided to focus on a few use-cases. Once we are doing those use-cases really well we will move to the next-one.

The first few releases of Project Fonos will focus only on Programmable Voice. We decided to focus on Programmable Voice, because it has the least amount of alternatives to its private CPaaS counterpart. 

### Who is Project Fonos for?

Although Project Fonos is expected to be useful for all businesses at all levels, its initial target group is expected to be made up of entrepreneurial start-ups. Focusing on organizations in this segment allows Project Fonos to address concerns that are directly related to small business which depend on Programmable Telecommunications. Specifically, Project Fonos wants to address the following pain points for start-ups: 

**High Prices:**
- Top competitors dictate prices with no regulations
- Low margins for product-makers
- Costs are difficult to forecast

**Vendor lock:**
- Difficulty migrating from one vendor to another
- Limited to vendor's feature (can't add or remove)

**Technical Complexity:**

- Learning curve for those without coding knowledge
- Copious documentation required

## Getting Started

![Repo banner](https://raw.githubusercontent.com/fonoster/fonos101/master/assets/pf101.png)

The purpose of this guide is to show the basics of Project Fonos. Until the official documentation is released, considerer this as the interim documentation for PF, and be sure to come back for updates.

Here you will find how to create a Voice Application, create a Number, and then use that Number to originate a call. Please follow the guide in sequence, as each step builds on the last one.

## Single-host Installation

### Preparation

While using multipass is optional, it will help you keep your environment clean.

To install multipass, simply use the following command:

```bash
multipass launch --name fonos \
--disk 8G \
--cpus 2 \
--mem 4G
```

Then, enter to the virtual machine with:

```bash
multipass shell fonos
sudo apt update
sudo apt install docker.io docker-compose
```

Finally, create two external volumes `datasource` and `data1-1`:

```bash
docker volume create --name=datasource
docker volume create --name=data1-1
```

### Running the Services

To run `PF`, first clone the repo and go to the directory `.compose` with:

```bash
git clone https://github.com/fonoster/fonos --depth=1
cd .compose
```

Then, copy the `env_example` into `.env` and update the variables `CONFIG`, `DOMAIN`, and `HOST_ADDR.`

Next, run the core services with:

```bash
sudo docker-compose --env-file .env \
    -f 00_deps.yml \
    -f 01_api.yml \
    -f 02_sipnet.yml up
```

Finally, once all the services are up an running initialize server with:

```bash
docker-compose -f init.yml up
```

### Installing optional Components

```bash
git clone https://github.com/fonoster/fonos --depth=1
cd .compose
sudo docker-compose --env-file .env \
    -f 00_deps.yml \
    -f 01_api.yml \
    -f 02_sipnet.yml \
    -f extras/secrets.yml \
    -f extras/funcs.yml \    
    -f extras/events.yml \
    -f extras/logging.yml \
    -f extras/tts.yml \
    up
```

> Append `dev.yml` or `extras\*.dev.yml` if you want to open the ports on all the services (Only recommended for development)

## Creating a Voice Application

### Prerequirements

Before you can create a Voice Application, you will need the following:

- NodeJS 14+ (Use nvm if possible)
- An account for access to a SIP Service Provider
- Fonos command-line tool (install with `npm install -g @fonos/ctl`)
- Ngrok (install with `npm install -g ngrok`) (recommended)

You can login to the server with your credentials with:

```bash
fonos auth:login
```

And your output will be similar to:

```bash
Access your Fonos infrastructure
Press ^C at any time to quit.
? api endpoint api.fonoster.net:50051
? access key id psanders
? access key token *************************...
? ready? Yes
Accessing endpoint api.fonoster.net:50051... Done
```

A Voice Application is a server that takes control of the flow in a call. A Voice Application can use any combination of the following verbs:

- `Play` - Takes an URL or file and streams the sound back to the calling party
- `Say`  - Takes a text, synthesizes the text into audio, and streams back the result
- `Gather` - Waits for DTMF events and returns back the result
- `Record` - It records the voice of the calling party and saves the audio on the Storage sub-system
- `Mute` - It tells the channel to stop sending media, effectively muting the channel
- `Unmute` - It tells the channel to allow media flow

Perform the following steps to create a Voice Application.

First, create an empty NodeJS project with:

```bash
mkdir voiceapp
cd voiceapp
npm init # and follow the wizard
```

Here is an example of the output:

```bash
...
package name: (voiceapp) 
version: (1.0.0) 
description: My voice app
entry point: (index.js) 
test command: 
git repository: 
keywords: 
author: Pedro Sanders
license: MIT 
About to write to /Users/yourusername/Projects/voiceapp/package.json:

{
  "name": "voiceapp",
  "version": "1.0.0",
  "description": "My voice app",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "Pedro Sanders",
  "license": "MIT"
}

Is this OK? (yes) yes
```

Then, install the Voice module with:

```
npm i --save @fonos/voice
```

Next, with your prefer IDE open and edit the file `index.js` with the following content:

```javascript
const { VoiceServer } = require("@fonos/voice");
const voiceServer = new VoiceServer({ base: '/voiceapp' });

voiceServer.listen((req, res) => {
  console.log(req);
  res.play("sound:hello-world");
});
```

Finally, launch the Voice Application with:

```bash
node index.js
```

Your output will look like this:

```
info: initializing voice server
info: starting voice server on @ 0.0.0.0, port=3000
```

> Your app will live at `http://127.0.0.1:3000/voiceapp`.

### Publishing a Voice Application with Ngrok

The fastes way to make a Voice Application available on the Internet is Ngrok. For example, with ngrok, you can publish a web server in a single command.

On a new console, run Ngrok with the following command:

```bash
ngrok http 3000
```

The output will look like this:

![Ngrok output](https://raw.githubusercontent.com/fonoster/fonos101/master/assets/ngrok_output.png)

> The forwarding URL can later be use as the Webhook for your calls with the SDK.

## Configuring a SIP Network

A SIP Network has all the building blocks needed to establish communication between two SIP endpoints(i.e., softphone, webphone, cellphone, the PSTN, etc.)

### Adding a SIP Service Provider

A SIP Service Provider is an organization that will terminate your calls to the phone network (or PSTN). To complete this section, you will need the `username`, `password`, and `host` you obtained from your SIP Service Provider.

Create a new Provider with:

```bash
fonos providers:create
```

The output will look similar to this:

```
This utility will help you create a new Provider
Press ^C at any time to quit.
? friendly name VOIPMS
? username 215706
? secret [hidden]
? host newyork1.voip.ms
? transport tcp
? expire 300
? ready? Yes
Creating provider YourServiceProvider... Done
```

### Adding a SIP Number

A Number, often referred to as DID/DOD, refers to a number managed by your SIP Service provider. 

> If your Provider doesn't accept E164, you can append the `--ignore-e164-validation`

```bash
fonos numbers:create --ignore-e164-validation
```

Here is an example of the output:

```bash
This utility will help you create a new Number
Press ^C at any time to quit.
? number in E.164 format (e.g. +16471234567) 9842753574    
? service provider VOIPMS
? aor link (leave empty)
? webhook https://5a2d2ea5d84d.ngrok.io/voiceapp # Replace with the value you obtained from Ngrok
? ready? Yes
Creating number +17853178071... KyjgGEkasj
```

> ⚠️ Be sure to replace the information with what was given to you by your Provider.

### Adding a SIP Domain

A SIP Domain is a space within the SIP Network where SIP entities live (usually SIP Agents). To create a SIP Domain, you can use the command-line tool or the SDK.

In this step, you need to select the Number you just created as your `Egreess Number`. Also, make sure to use an "unclaimed" `uri` or you will receive the error: "› Error: This Domain already exists." 

Create a new Domain with:

```bash
fonos domains:create
```

Your output will look similar to this:

```bash
This utility will help you create a new Domain
Press ^C at any time to quit.
? friendly name Acme Corp
? domain uri (e.g acme.com) sip.acme.com
? egress number none
? egress rule .*
? ready? Yes
Creating domain Acme Corp... Jny9B_qaIh
```

## Initiating a call with the SDK

To make a call, you are going to need to install the SDK.

Install the SDK, from within the `voiceapp`, with:

```bash
npm i --save @fonos/sdk 
```

Next, create the script `call.js` with the following code:

```javascript
// This will load the SDK and reuse your Fonos credentials
const Fonos = require("@fonos/sdk").default;
const callManager = new Fonos.CallManager();

// Few notes:
//  1. Update the from to look exactly as the Number you added 
//  2. Use an active phone or mobile
//  3. Replace the webhook with the one from Ngrok
callManager.call({
 from: "9842753574",
 to: "17853178070",
 webhook: "https://5a2d2ea5d84d.ngrok.io/voiceapp"
})
.then(console.log)
.catch(console.error);
```

Finally, run your script with: `node call.js`

If everything goes well, you will start seeing the output in the console you are running your Voice Application. You will also receive a call that will stream a "Hello World."

![Call Request output](https://raw.githubusercontent.com/fonoster/fonos101/master/assets/call_request.png)

## Creating a Cloud Function

### Managing Secrets

## Bugs and Feedback

For bugs, questions, and discussions please use the [Github Issues](https://github.com/fonoster/fonos/issues)

## Contributing

For contributing, please see the following links:

 - [Contribution Documents](https://github.com/fonoster/fonos/blob/master/CONTRIBUTING.md)
 - [Contributors](https://github.com/fonoster/fonos/contributors)

---

We're glad to be supported by respected companies and individuals from several industries. [See our Github Sponsors to learn more](https://github.com/sponsors/psanders).

**Platinum Sponsors**

<a href="https://github.com/sponsors/psanders"><img src="https://www.camanio.com/en/wp-content/uploads/sites/11/2018/09/camanio-carerund-cclogga-transparent.png" height="50"/></a>

Find all supporters in our [`BACKERS.md`](./BACKERS.md) file.

> [Support Fono's developers on Gh Sponsors](https://github.com/sponsors/psanders)

---

## Authors
 - [Pedro Sanders](https://github.com/psanders)

## License
Copyright (C) 2021 by [Fonoster Inc](https://fonoster.com). MIT License (see [LICENSE](https://github.com/fonoster/fonos/blob/master/LICENSE) for details).
