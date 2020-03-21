
# YAPS [![Join the chat at https://gitter.im/fonoster/yaps](https://badges.gitter.im/fonoster/yaps.svg)](https://gitter.im/fonoster/yaps?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license: MIT"></a> [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Programmable%20Voice%20&url=https://github.com/fonoster/yaps&via=fonoster&hashtags=voip,sip,webrtc,telephony)

YAPS stands for **Y**et **A**nother **P**hone **S**ystem, and like the name states it is mainly a telephony system; the current roadmap is focus on Programmable Voice and Voice over Internet Protocol(VoIP) and PSTN communication.

<br />
<img src="https://raw.githubusercontent.com/fonoster/yaps/master/docs/assets/banner_yaps.png"></img>
<br />

<table border="0" width="100%" cellpadding="0" cellspacing="0" bgcolor=green>
<tr border="0">
<td border="0">
:warning: This platform is not yet production ready. We are working to deliver a beta version as soon as possible. Please keep an eye on the <a href="https://github.com/orgs/fonoster/projects">projects</a> section for development status.
</td>
</tr>
</table>

## Getting started

YAPS a composite of several microservices. To get started with YAPS you are going to need Docker and Docker Compose.
Other deployment options will soon be available.

### Requirements

- Docker Compose, Docker Swarm, or K8s
- Node and NPM
- Git (optional)
- A softphone

### Running the System

YAPS deploys in various environments such as Docker Compose, Docker Swarm, and K8s. Click bellow for deployment details:

<details><summary><b>Docker Compose</b></summary>
<br />
You must have docker and docker-compose on your system to run this platform
<br /><br />

Run using docker-compose

```bash
git clone https://github.com/fonoster/yaps
cd yaps
docker-compose up
```

</details>

<details><summary><b>Docker Swarm</b></summary>
<br />
Coming soon...

</details>

<details><summary><b>K8s</b></summary>
<br />
Coming soon...

</details>

### Installing the Command-Line Tool

```
npm install @yaps/ctl -g
```

### Creating and Deploying an Application

```
mkdir voice-app
cd voice-app
yaps apps:init
yaps apps:deploy
```

For more commands go to [ctl @ npmjs](https://www.npmjs.com/package/@yaps/ctl) for more commands.

### Testing the Application

To interact with your application, point a softphone to your Asterisk sub-system.
Asterisk will be listening for SIP traffic on port `6060\tcp`. The test account is `1001` with
password `1234`. Calling extension `1002` will connect your test account to your
voice application.

## Features

YAPS' main features are:

- Programmable Voice
- Available on Docker and Kubernetes environments
- Typical SIP Server functions; Proxy, Registrar, Location Service
- Configurable routing strategies; Intra-Domain, Domain Ingress, Domain Egress and Peer Egress
- Per node Multi-Tenancy/Multi-Domain with Domain level Access Control List
- Transport: TCP, UDP, TLS, WebSocket
- Database: Redis

## Bugs and Feedback

For bugs, questions, and discussions please use the [Github Issues](https://github.com/fonoster/yaps/issues)

> We are currently unable to place calls using UDP do to NAT issues.

## Contributing

For contributing, please see the following links:

 - [Contribution Documents](https://github.com/fonoster/yaps/blob/master/CONTRIBUTING.md)
 - [Contributors](https://github.com/fonoster/yaps/contributors)

## Authors
 - [Pedro Sanders](https://github.com/psanders)

## License
Copyright (C) 2020 by [Fonoster Inc](https://fonoster.com). MIT License (see [LICENSE](https://github.com/fonoster/yaps/blob/master/LICENSE) for details).
