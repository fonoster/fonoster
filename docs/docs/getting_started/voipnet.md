---
id: voipnet
title: VoIP Net
description: VoIP Networks
---

# VoIP Networks

Fonoster comes with support to deploy VoIP networks with ease. For example, with Fonoster you can create a SIP trunk to connect to the PSTN and assign Numbers for inbound or outbound calling.

Adding a new Provider (trunk) is easy with the [CLI](/docs/getting_started/cli). Here is an example:

```bash
$ fonoster providers:create
This utility will help you create a new Provider
Press ^C at any time to quit.
? friendly name voip ms
? username 20131
? secret *********
? host newyork1.voip.ms
? transport tcp
? expire 300
? ready? Yes
Creating provider voip ms... c2uO-eO7tR
```

> Adding a number is just as easy with `fonoster numbers:create`

You can also create your Office/Home network by combining `Domains` and `Agents`. Thanks to SIP, you can connect to your VoIP Net using a Softphone or IP Phone.