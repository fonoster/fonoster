This example shows the use of the third-party dependencies into a with Fonos Programmable Voice features, to build a reminders application. It uses Google Text-to-Speech for the synthesis, Google Speech-to-Text for speech transcription, and DialogFlow as the operation's brain.

## Pre-requirement

Fonos CTL 
A valid set of credentials for Google APIs
Access to a Fonos deployment
A softphone configure register against Fonos registrar

## Overview

Before we continue, let's listen to audio featuring this example. As you can hear, It can even pick up my accent. It's simple, but with some minor adjustments, this AI-power Programmable Application could be your next reminder application.

[Demo with a picture from Sound Cloud](https://soundcloud.com/pedro-sanders/dialog-example)

## Installing on Fonos

Before you can run this example, you must have a valid set of credentials. At a minimum, the credentials must have the following Google APIs: Text-to-Speech, Speech-to-Text, and DialogFlow. Save the file as `google-credentials.json` at the root of this example.

Next, you need your `fonos` properly configure against your Fonos deployment. Then, from the example's directory run the `fonos:deploy` command.

## Changing the Text-to-Speech Engine

[Google TTS image]

As mention before, we are using Google Text-to-Speech for the synthesis.    For this integration, Fonos uses the module @fonos/googletts. This module overrides the default TTS engine, @fonos/marytts. Notice the line:

```
chan.overrideTTS(tts)
```

Fonos will use this TTS for subsequent calls to the `Say` verb. 

> You can pass a second parameter to the Say verb, to change the default voice and other settings. Those settings will be pass to the TTS engine. 

DialogFlow Intents

[Dialog screenshot cut]

For this example, we are using the pre-built agent `Reminders` available on DialogFlow. We also added the intent `session.close.` The training phrases for the intent are: 

[Screenshot with intent]

No, Goodbye
No, Thanks
No, I'm done, 
No, That's all.

Also, we added two responses for this intent: Great. Please call again if you need any help, and Ok! goodbye.

## Improvements

Reduce the response time of the Text-to-Speech

There are two possible ways to improve in this area. This first is using a Text-to-Speech colocated in the same network with Fonos. The other way is to begin to stream the synthesize audio instead of downloading the file to play the sound then.

Reduce the response time of the Speech-to-Speech

Just as before, having the service in the same network could help speed things up.

Another improvement for this prototype is to start the silenceSeconds, for `listen` function, only after the persons start talking. By starting the timer after the person begins speaking, we can avoid repeating, "Sorry, I didn't quite get that. Can you say again?"

