---
slug: The essentials of building Voice Applications with Fonoster
title: The essentials of building Voice Applications with Fonoster
authors: [psanders]
tags: [fonoster, voice]
---

The purpose of this tutorial is to show the basics of Fonoster. Here you will find how to create a Voice Application, add a Number, and then use that Number to originate a call. Please follow the guide in sequence, as each step builds on the last one.

# Requirements  

Before you start this guide, you will need the following:

- A set of credentials from [here](https://console.fonoster.io/) 👈
- An account for access to a SIP Service Provider (For US and Canada, we recommend [voip.ms](https://voip.ms/residential))
- NodeJS 14+ (Use nvm if possible)
- Fonoster command-line tool install with `npm install -g @fonoster/ctl`
- Ngrok `install with npm install -g ngrok`

You can login to the server with:

```none
fonoster auth:login
```

And your output will be similar to:

```none
Access your Fonoster infrastructure
Press ^C at any time to quit.
? api endpoint api.fonoster.io
? access key id psanders
? access key token *************************...
? ready? Yes
Accessing endpoint api.fonoster.io... Done
```

Then, set the default Project: 

```none
# Get the PROJECT_ID of the project using the 'projects:list' command 
fonoster projects:use ${PROJECT_ID}
```

# Creating a basic Voice Application 

A Voice Application is a server that takes control of the flow of a call. 

A Voice Application can use any combination of the following verbs:

- `Answer` - Accepts the call
- `Hangup` - Closes the call
- `Play` - It takes an URL or file and streams the sound back to the calling part
- `Say` - It takes a text, synthesizes the text into audio, and streams the result
- `Gather` - It waits for DTMF events and returns back the result
- `SGather` - It listen for a stream DTMF events and returns back the result
- `Record` - It records the voice of the calling party and saves the audio on the Storage sub-system
- `Mute` - It tells the channel to stop sending media, thus effectively muting the channel
- `Unmute` - It tells the channel to allow media flow

To create a Voice Application perform the following steps.

First, clone the NodeJS example template as follows:

```none
git clone https://github.com/fonoster/nodejs-voiceapp
```
Next, install the dependencies:

```none
cd nodejs-voiceapp
npm install
```
Finally, launch the Voice Application with:
```none
npm start
```

Your output will look like this:
```none
info: initializing voice server
info: starting voice server on @ 0.0.0.0, port=3000
```
> Your app will live at `http://127.0.0.1:3000.` Be sure to leave the server up!

## Using Ngrok to publish your Voice Application 

Now that we have our Voice Application up and running, we need to make it available on the Internet——the fastest way to enable public access by using Ngrok. 

For example, with ngrok, you can publish a web server with a single command.

On a new console, run Ngrok with the following command:
```none
ngrok http 3000
```

The output will look like this:

![ngrok_output](https://user-images.githubusercontent.com/80093500/193677206-08190c5d-b1b1-4358-bd32-4b7d62dd99ef.png)

Leave this service running, and save the Forwarding URL for use in the next step.

## Building a SIP Network 
A SIP Network has all the building blocks needed to establish communication between two SIP endpoints (i.e., softphone, webphone, cellphone, the PSTN, etc.) We want to configure a Number and route the calls to our Voice Application on this guide.

Let's start by creating a SIP Service Provider.

## Adding a SIP Service Provider
A SIP Service Provider is an organization that will terminate your calls to the phone network (or PSTN). 

You will need the `username`, `password`, and `host` you obtained from your SIP Service Provider for this section.

Create a new provider with:
```none
fonoster providers:create
```

The output will look similar to this:
```none
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

## Adding a SIP Number
A Number, often referred to as DID/DOD, is a number managed by your SIP Service provider.

> If your Provider doesn't accept E164, you can append the `--ignore-e164-validation`
```none
fonoster numbers:create --ignore-e164-validation
```

Here is an example of the output:
```none
This utility will help you create a new Number
Press ^C at any time to quit.
? number in E.164 format (e.g. +16471234567) 9842753574    
? service provider VOIPMS
? aor link (leave empty)
? webhook https://5a2d2ea5d84d.ngrok.io # Replace with the value you obtained from Ngrok
? ready? Yes
Creating number +17853178071... KyjgGEkasj
```

>  Be sure to replace the information with what was given to you by your Provider.

## Creating a SIP Domain

A SIP Domain is a space within the SIP Network where SIP entities live (usually SIP Agents). To create a SIP Domain, you can use the command-line tool or the SDK.

In this step, you need to select the Number you just created as your `Egreess Number`. Also, make sure to use an "unclaimed" `uri` or you will receive this error: "› Error: This Domain already exists."

Create a new Domain with:
```none
fonoster domains:create
```

Your output will look similar to this:
```none
This utility will help you create a new Domain
Press ^C at any time to quit.
? friendly name Acme Corp
? domain uri (e.g acme.com) sip.acme.com
? egress number none
? egress rule .*
? ready? Yes
Creating domain Acme Corp... Jny9B_qaIh
```
> In the demo server, you don't need to own the Domain. Any available URI is fair game!

## Using the API to make a call

To make a call, you need install the SDK.

Install the SDK, from within the `voiceapp`, with:
```none
npm install --save @fonoster/sdk 
```

Next, create the script `call.js` with the following code:
```none
// This will load the SDK and reuse your Fonoster credentials
const Fonoster = require("@fonoster/sdk");
const callManager = new Fonoster.CallManager();

// Few notes:
//  1. Update the from to look exactly as the Number you added 
//  2. Use an active phone or mobile
//  3. Replace the webhook with the one from your Ngrok
callManager.call({
 from: "9842753574",
 to: "17853178070",
 webhook: "https://5a2d2ea5d84d.ngrok.io",
 ignoreE164Validation: true
})
.then(console.log)
.catch(console.error);
```

Finally, run your script with: `node call.js`

If everything goes well, you will start seeing the output in the console you are running your Voice Application. You will also receive a call that will stream a "Hello World," which further confirms that everything is behaving as it should.

![call_request](https://user-images.githubusercontent.com/80093500/193678241-8be38da0-cb54-4b25-a4d3-7842a94baa00.png)

### Troubleshooting 

1. Are you not receiving the call at all?
The first thing to check is that your SIP Service Provider configuration is correct. Next, double-check the `username`, `password`, and `host`. If your Provider has an Admin console, check if you can see the registration from Fonoster.

Next, make sure the `from` matches the Number given to you by your Provider. 
Also, double-check the `to` has the correct prefix (for example, +1, etc.).

2. You receive the call but immediately hang up (did not hear a sound)
First, verify that Ngrok is still running. Next, compare Ngrok's URL with the webhook on your Number. They both need to match!

Then observe the console's output where your Voice Application is running, and see if there are any errors.

#### Giving feedback to Team Fonoster
We want to provide you with the best possible experience. To do that, we need your valuable feedback. Because we know you are busy, we provide two ways to get quick feedback from you. From the command line, use the `fonoster bug` command to start a GitHub issue. Or, you can use the `fonoster feedback` command to complete a short survey (which takes less than 30 seconds).
