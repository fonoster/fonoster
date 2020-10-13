# Project Fonos ![build](https://github.com/fonoster/fonos/workflows/unit%20tests/badge.svg) <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license: MIT"></a> [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Programmable%20Voice%20&url=https://github.com/fonoster/fonos&via=fonoster&hashtags=voip,sip,webrtc,telephony)

Project Fonos is open-source communications for the cloud. This repository assembles the various components needed to deploy a telephony system. It helps VoIP integrators quickly deploy new networks and include value-added services such as Programmable Voice, Messaging, and Video.

![Repo Banner](https://raw.githubusercontent.com/fonoster/fonos/master/repo_banner.jpg)

## Getting started

To get started with Fonos Programmable Voice follow the next few steps.

<details><summary>Preparation</summary>

<br />
The first step with Fonos Programmable Voice is to install all the requirements.
Refer to websites of the various products in the list bellow for detail on installation and configuration.
<br /><br />

Requirements:

- K8S Cluster
- Node and NPM
- A softphone (with support for tcp)

</details>

<details><summary>Running the Infrastructure</summary>

<br />
To run Fonos in your cluster, please follow the <a href="https://github.com/fonoster/fonos/tree/master/.helm">deployment instructions</a>
<br /><br />

> Work is on the way to enable Fonos for Docker Swarm
</details>

<details><summary>Installing the Tools</summary>
 
<br />
The next step is to install the Command-Line Tool. To install the tool run the following command:
<br /><br />

```
npm install @fonos/ctl -g
```

For details on this tool please go to [ctl @ npmjs](https://www.npmjs.com/package/@fonos/ctl).
</details>

<details><summary>Creating and Deploy an Application</summary>

<br />
If everything is went to plan, it is now time to generate and deploy
your first Voice Application.
<br /><br />

```bash
mkdir voice-app
cd voice-app
fonos apps:init
fonos apps:deploy
```

For more examples go the [examples folder](/examples) in this repository.

</details>

<details><summary>Testing</summary>
<br />
To interact with your application, point your softphone to Asterisk sub-system. The testing information
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
Congratulations if you made it this far. The next step with Fonos is to get familiar with the <a href="https://www.npmjs.com/package/@fonos/ctl">Command-Line Tool</a> and the <a href="https://github.com/fonoster/fonos/wiki/AppManager">SDK</a>.
  
</details>

## Features

Fonos' main features are:

- Programmable Voice
- Available on Kubernetes environment
- Typical SIP Server functions; Proxy, Registrar, Location Service
- Configurable routing strategies; Intra-Domain, Domain Ingress, Domain Egress and Peer Egress
- Per node Multi-Tenancy/Multi-Domain with Domain level Access Control List
- Transport: TCP, UDP, TLS, WebSocket
- Database: Redis

## Modules and Components

The following is a list of modules and other subcomponents of Project Fonos by topic and current status. 

| Name        | Topic | Description | Status
|-------------|-------|-------------|-------|
| [core](/mods/core)                       | Core  		                         | Core API                                              | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [events](/mods/events)                   | Core  		                         | Event managment                                       | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [storage](/mods/storage) 	               | Core  		                         | Utility module for storage managment                  | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [ctl](/mods/ctl) 		                      | Tooling  	                       | Controls a Fonos deployment using the API             | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [sdk](/mods/sdk) 		                      | Tooling  	                       | Bundle API for all user facing components             | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [voice](/mods/voice)                     | Programmable Voice               | NodeJS Implementation of Voice API                    | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [appmanager](/mods/appmanager)           | Programmable Voice               | API for deployment and managment of PVAs              | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [dispatcher](/mods/dispatcher)           | Programmable Voice               | Takes a call and passes control to media controller   | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [tts](/mods/tts)                         | Programmable Voice               | Abstracts for TTS features                            | ![beta](https://img.shields.io/badge/beta-brightgreen)
| [marytts](/mods/marytts)                 | Programmable Voice               | Default TTS implementation                            | ![beta](https://img.shields.io/badge/beta-brightgreen)
| [googleasr](/mods/googleasr)             | Programmable Voice               | Google implementation for ASR feature                 | ![beta](https://img.shields.io/badge/beta-brightgreen)
| [googletts](/mods/googletts)             | Programmable Voice               | Google implementation for TTS feature                 | ![beta](https://img.shields.io/badge/beta-brightgreen)
| [mediacontroller](/mods/mediacontroller) | Programmable Voice               | NodeJS implementation for Fonos media controller      | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [mediaserver](/mods/mediaserver)         | VoIP Network, Programmable Voice | Asterisk based media server                           | ![beta](https://img.shields.io/badge/beta-brightgreen)
| [agents](/mods/agents)   	               | VoIP Network                     | API to create, update, get and delete `Agents`        | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [domains](/mods/domains)  	              | VoIP Network                     | API to create, update, get and delete `Domains`       | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [providers](/mods/providers)             | VoIP Network                     | API to create, update, get and delete `Providers`     | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [numbers](/mods/numbers)                 | VoIP Network                     | API to create, update, get and delete `Numbers`       | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [sipproxy](https://routr.io)             | VoIP Network                     | SIP proxy subcomponent                                | ![rc](https://img.shields.io/badge/rc-brightgreen)
| mediarelay                               | VoIP Network                     | RTPEngine controller and balancer                     | ![alpha](https://img.shields.io/badge/alpha-yellow)
| aaa                                      | VoIP Network  		                 | Access Authorization Accounting                       | ![not yet implemented](https://img.shields.io/badge/nyi-red)
| [logger](/mods/logger)  	                | Misc      	                      | Useful for Programmable Voice Applications (PVAs)     | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [certs](/mods/certs)  	                  | Misc  	                          | Certificate creation and managment                    | ![alpha](https://img.shields.io/badge/alpha-yellow)
| [errors](/mods/errors)  	                | Misc  		                         | Util module for error managment                       | ![alpha](https://img.shields.io/badge/alpha-yellow)
| roles           		                       | Misc                             | API Access Control                                    | ![not yet implemented](https://img.shields.io/badge/nyi-red)

## Bugs and Feedback

For bugs, questions, and discussions please use the [Github Issues](https://github.com/fonoster/fonos/issues)

## Contributing

For contributing, please see the following links:

 - [Contribution Documents](https://github.com/fonoster/fonos/blob/master/CONTRIBUTING.md)
 - [Contributors](https://github.com/fonoster/fonos/contributors)

## Authors
 - [Pedro Sanders](https://github.com/psanders)

## License
Copyright (C) 2020 by [Fonoster Inc](https://fonoster.com). MIT License (see [LICENSE](https://github.com/fonoster/fonos/blob/master/LICENSE) for details).
