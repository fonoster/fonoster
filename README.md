
# YAPS - Yet Another Phone System

<p align="left">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#bugs-and-feedback">Bugs and Feedback</a> •
  <a href="#Contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

YAPS stands for **Y**et **A**nother **P**hone **S**ystem, and like the name states it is mainly a telephony system; while currently focused on Voice over Internet Protocol(VoIP) and PSTN, its power lies in its ability to be easily extended with ARI applications and rich RESTful APIs.  YAPS flexible routing engine based in [Routr](https://github.com/fonoster/routr), helps maximize communications efficiency and minimizing infrastructure costs for business.

:warning: Not yet production ready

## Features

YAPS' main features are:

- Typical SIP Server functions; Proxy, Registrar, Location Service
- Per node Multi-Tenancy/Multi-Domain with Domain level Access Control List
- Transport: TCP, UDP, TLS, WebSocket
- Database: Redis
- Available on Docker and Kubernetes environments
- ARI application server
- Configurable routing strategies; Intra-Domain, Domain Ingress, Domain Egress and Peer Egress

## Quick Start

You must have docker and docker-compose to run this platform

&#10122; Run using docker-compose

```bash
export HOST_ADDR={YOUR HOST ADDRESS}
docker-compose up
```

&#10123; Configure your endpoints

Use the information located on `bootstrap.yml` to configure your sip-phones.

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
Copyright (C) 2019 by [Fonoster Inc](https://fonoster.com). MIT License (see [LICENSE](https://github.com/fonoster/yaps/blob/master/LICENSE) for details).
