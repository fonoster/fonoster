# Reminders - Programmable Voice Application
**This example is outdated from the new Fonos Voice API.**

This example shows the use of the third-party dependencies with Fonos Programmable Voice features to build an application for reminders. It uses Google Text-to-Speech for the synthesis, Google Speech-to-Text for speech transcription, and DialogFlow as the operation's brain.

## Prerequisites

- Fonos CTL 
- Google APIs credentials
- Access to a Fonos deployment
- A softphone configured to register to Fonos

## Overview

Before we continue, let's listen to a recording featuring this example. It's simple, but with some adjustments, this AI-power Programmable Application could be the base for your next voice application.

<a href="https://soundcloud.com/pedro-sanders/dialog-example"><img alt="Demo Picture at Sound Cloud" src="https://raw.githubusercontent.com/fonoster/fonos/master/examples/dialog/assets/prototype-recording.png" /></a>

## Installing on Fonos

Before you can run this example, you must have a valid set of credentials from [Google Cloud](https://console.developers.google.com/apis/credentials). At a minimum, you must enable the following Google APIs: Text-to-Speech, Speech-to-Text, and DialogFlow. Save the file as `google_credentials.json` at the root of this example.

Next, you need your `fonos` Command-Line properly configure against your Fonos deployment. Then, from the example's directory run the `fonos apps:deploy` command.

## Changing the Text-to-Speech Engine

<img alt="Google TTS" src="https://raw.githubusercontent.com/fonoster/fonos/master/examples/dialog/assets/googletts.png" height="140" />

As mentioned before, we are using Google Text-to-Speech for the synthesis. For the integration, Fonos uses the module `@fonos/googletts.` This module overrides the default TTS engine, `@fonos/marytts.` To replace the engine simply:

```
chan.overrideTTS(new GoogleTTS())
```

Fonos will utilize this new TTS for subsequent calls to the `Say` verb. Keep in mind that you can pass a second parameter to the verb to change the default voice and other settings. Fonos will pass the settings to the TTS engine. 

## DialogFlow Intents

For this example, we are using the pre-built agent `Reminders` available on DialogFlow. We also added the intent `session.close.` The training phrases for the intent are: 

<img alt="DialogFlow Intents" src="https://raw.githubusercontent.com/fonoster/fonos/master/examples/dialog/assets/dialogflow-intents.png" height="400" />

Also, we added two responses for this intent: Great. Please call again if you need any help, and Ok! goodbye.

## Improvements

**Reduce the response time of the Text-to-Speech**

There are two possible ways to improve in this area. The first is using a Text-to-Speech colocated on the same network with Fonos. The other way is to begin to stream the synthesize audio instead of downloading the file to play the sound then.

**Reduce the response time of the Speech-to-Text**

Just as before, having the service in the same network could help speed things up.


