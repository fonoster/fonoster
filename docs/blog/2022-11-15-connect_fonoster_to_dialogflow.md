---
slug: Connect Fonoster to Dialogflow
title: Connect Fonoster to Dialogflow
authors: [yuricodes]
tags: [fonoster, voice, dialogflow, OSS]
---

# Connecting Fonoster to Dialogflow 

Connecting Fonoster to Dialogflow is just a few clicks away using the Fonoster Dashboard. 

**Trunking information you'll need:**
- VoIP provider
- Number
- Username
- Password
- Host

## Set up your provider's information
Sign in to Fonoster and go to the Fonoster Project Dashboard, next select SIP Network tab and create a new Trunk.

Here you'll need to provide this information from your provider's account:
- Your provider's name
- Your username 
- Your secret / password
- Providers Hostname or IPv4

### Google Service Account key
Next step, you'll need to create a new Secret on the Secrets tab and set it to be the Google Service Account json key.

#### Create a new Fonoster Application 

Now we are ready to create a new Application, go to the Applications tab and create a new one. 
- Pick a name
- Select the secret you previously added from the previous step
- Pick a voice
- Type the intent ID from your Dialogflow Agent
- Type the project ID from your Dialogflow project
- Hit save

##### Add a new number to call 

Lastly, we need to add a new number we can call and trigger Dialogflow.

Create a new number from the SIP Network tab
- Add your number from the provider
- Add the weebhook URL ```http://voice.fonoster:3000```
- Click save

And there you have it. You're ready to call that number and be able to interact with the AI. 

###### Need help?

Fonoster is developed in the open. Here are some of the channels you can use to reach us: 

[Discord](https://discord.gg/4QWgSz4hTC)

**GitHub discussions:**
- [Q&A](https://github.com/fonoster/fonoster/discussions/categories/q-a) 

**Twitter:** [@fonoster](https://twitter.com/fonoster)

We look forward to hearing from you.
