
# YAPS [![Build Status](https://github.com/fonoster/yaps/workflows/integration/badge.svg)](https://github.com/fonoster/yaps/actions?workflow=integration) [![Join the chat at https://gitter.im/fonoster/yaps](https://badges.gitter.im/fonoster/yaps.svg)](https://gitter.im/fonoster/yaps?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license: MIT"></a> [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Programmable%20Voice%20&url=https://github.com/fonoster/yaps&via=fonoster&hashtags=voip,sip,webrtc,telephony)

YAPS stands for **Y**et **A**nother **P**hone **S**ystem, and like the name states it is mainly a telephony system; our main focus at this time is on Programmable Voice, Voice over Internet Protocol(VoIP), and PSTN communication.

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

To get started with YAPS Programmable Voice follow the next few steps.

<details><summary>Preparation</summary>

<br />
The first step with YAPS Programmable Voice is to install all the requirements.
Refer to websites of the various products in the list bellow for detail on installation and configuration.
<br /><br />

Requirements:

- Docker Compose
- Node and NPM
- Git (optional)
- A softphone (with support for tcp)

</details>

<details><summary>Running the Infrastructure</summary>

<br />
Once all the requirements are installed, the next step is to run the infraestructure.
For that, you must clone or download YAPS git repository. The first time you run this commands
it will take awhile.

<br /><br />

Run using docker-compose

```bash
git clone https://github.com/fonoster/yaps
cd yaps
docker-compose up
```

> Work is on the way to enable YAPS for Docker Swarm and K8s.
</details>

<details><summary>Installing the Tools</summary>
 
<br />
The next step is to install the Command-Line Tool. To install the tool run the following command:
<br /><br />

```
npm install @yaps/ctl -g
```

For details on this tool please go to [ctl @ npmjs](https://www.npmjs.com/package/@yaps/ctl).
</details>

<details><summary>Creating and Deploy an Application</summary>

<br />
If everything is went to plan, it is now time to generate and deploy
your first Voice Application.
<br /><br />

```bash
mkdir voice-app
cd voice-app
yaps apps:init
yaps apps:deploy
```

For more examples go the [examples folder](/examples) in this repository.

</details>

<details><summary>Testing</summary>
<br />
To interact with your application, point your softphone to Asterisk sub-system.
Asterisk will be listening for SIP traffic on port `6060\tcp`. The testing information
is as follows:
 
<br />

<br />
USENAME = 1001
<br />
PASSWORD = 1234
<br />
TEST EXTENSION = 1002

</details>

<details><summary>What's Next?</summary>
<br />
Congratulations if you made it this far. The next step with YAPS is to get familiar with the [Command-Line Tool](https://www.npmjs.com/package/@yaps/ctl) and [SDK](https://github.com/fonoster/yaps/wiki/AppManager).
  
</details>

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
