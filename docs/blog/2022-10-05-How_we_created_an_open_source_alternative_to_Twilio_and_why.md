---
slug: How we created an open-source alternative to Twilio and why it matters
title: How we created an open-source alternative to Twilio and why it matters
authors: [psanders]
tags: [fonoster, voice, javascript, voice]
---

# How we created an open-source alternative to Twilio and why it matters

Last year, when I started assembling Team Fonoster, I published a [post](https://www.reddit.com/r/Entrepreneur/comments/j96avf/an_opensource_alternative_to_twilio/) on Reddit that sparked a great conversation and placed Fonoster on Github's trending list even though we didn't have much to show.

As a result, I had the opportunity to interview dozens of CTOs from companies worldwide and speak with several investors who were interested in the idea of an open-source stack of Programmable Telecommunications.

In the interviews, I found we need an innovative approach to a cloud-based stack for Programmable Telecommunications.

## Why we needed CPaaS in the first place?

Building an application that takes advantage of the existing Telecom network has always been a difficult task compared with, for example, building a web-based application.

This is difficult because it involves a particular set of skills that is challenging to find and can get really costly.

Let's face it, no one wants to read through dozens of RFCs to program a phone call.

So, when the API era arrived along with UCaaS and CPaaS providers, it was a no-brainer to use one of those providers to deploy a solution within weeks instead of spending months only to get a simple use-case.

## So what's wrong with traditional CPaaS?
There is nothing wrong with traditional CPaaS. In fact, in most cases, using a CPaaS is a great option to deploy a Telecommunications solution.

However, even though the concept of using a CPaaS to go to market quickly is fantastic, it comes at a high price for some use-cases. After all, if something goes wrong, you will have no other option but to migrate to another CPaaS or build your own solution and start again on square zero.

Some companies complain about the high prices for using a CPaaS. A startup CTO once told me, “It almost feels that we are paying for a lot of features we don't need.” This is because, with a traditional CPaaS, you start on a pay-as-you-go model, but costs can quickly get out of control.

Other companies find themselves limited by their providers' features because with traditional CPaaS you have no option but to use what they have available. There is no chance for customization. And even though that's not a problem for most companies, it is a deal-breaker for technology companies.

Then you have use-cases, especially in the healthcare industry, that can't benefit from using a traditional CPaaS due to privacy concerns and local regulations.

In which of those categories does your company fall?

## How can we make this better?
The primary innovation of Fonoster lies in researching and developing the means for creating a highly portable, cloud-based Programmable Telecommunications stack.

This Programmable Telecommunications stack will allow businesses to call an API to dial, answer a call, establish a video session, send SMS, etc. There won't be any concern about what servers and networks are doing with that information in the background.

Our overall approach to building Fonoster is to use existing open-source solutions that are best in their class when possible and build our own when necessary. We then integrate this individual open-source software into a cohesive set of APIs that resembles a traditional CPaaS.

For example, to start a simple Voice Application one could write a Javascript code like the one below:
```none
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
```

Or to make a call to the telephone network, you could use the SDK and write a simple script like this:
```none
const Fonoster = require("@fonoster/sdk");
const callManager = new Fonoster.CallManager();

callManager.call({
 from: "9842753574",
 to: "17853178070",
 webhook: "https://5a2d2ea5d84d.ngrok.io"
})
.then(console.log)
.catch(console.error);
```

Want to create a reminders application? No problem, in few easy steps, you can create and deploy a Cloud Function that will run based on a given Cron schedule.

First, initialize your Cloud Function with:
```none
fonoster funcs:init
```

Then, edit the handler with the following code:
```none
const Fonoster = require("@fonoster/sdk");
const callManager = new Fonoster.CallManager();

// 🚀 Let's get started
// Use fonoster funcs:deploy to send to the cloud functions
module.exports = async(request, response) => {
  await callManager.call({
    from: "9842753589",
    to: "17853178070",
    webhook: "https://5a2d2ea5d84d.ngrok.io"
  })
  return response.succeed("OK");
};
```

Finally, deploy to the Cloud Functions subsystem with a Cron string.
```none
fonoster funcs:deploy --schedule "*/5 * * * *"
```

You get the idea.

> The Cloud Functions capability if offered by the integration with OpenFaaS (by Alex Ellis)

### What's next?
Be sure to check [The essentials of building Voice Applications with Fonoster](https://learn.fonoster.dev/blog/The%20essentials%20of%20building%20Voice%20Applications%20with%20Fonoster) to overview the Programmable Voice features available on Project Fonoster. 

Star the project on Github and contact us via:

- Twitter: [@fonoster](https://twitter.com/fonoster)
- Email: fonosterteam@fonoster.com
- [Discord](https://discord.com/invite/mpWSRUhG7e)
