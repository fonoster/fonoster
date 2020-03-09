
# YAPS [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Programmable%20Voice%20&url=https://github.com/fonoster/yaps&via=fonoster&hashtags=voip,sip,webrtc,telephony)

YAPS stands for **Y**et **A**nother **P**hone **S**ystem, and like the name states it is mainly a telephony system; the current roadmap is focus on Programmable Voice and Voice over Internet Protocol(VoIP) and PSTN communication.

[![Join the chat at https://gitter.im/fonoster/yaps](https://badges.gitter.im/fonoster/yaps.svg)](https://gitter.im/fonoster/yaps?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license: MIT"></a>

:warning: Not yet production ready

## Deployment

YAPS deploys in various environments such as Docker Compose, Docker Swarm, and K8s. Click bellow for deployment details:

<details><summary><b>Docker Compose</b></summary>

You must have docker and docker-compose to run this platform

&#10122; Run using docker-compose

```bash
docker-compose up
```

&#10123; Configure your endpoints

Use the information located on `bootstrap.yml` to configure your sip-phones.
</details>

<details><summary><b>Docker Swarm</b></summary>

Comming soon...

</details>

<details><summary><b>K8s</b></summary>

Comming soon...

</details>


## Features

YAPS' main features are:

- Programmable voice
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

## LICENSE
Copyright (C) 2020 by [Fonoster Inc](https://fonoster.com). MIT License (see [LICENSE](https://github.com/fonoster/yaps/blob/master/LICENSE) for details).
