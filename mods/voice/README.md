voice
=================

[![Voice](https://img.shields.io/badge/voice-api-brightgreen.svg)](https://fonoster.com)
[![Version](https://img.shields.io/npm/v/@fonoster/voice.svg)](https://npmjs.org/package/@fonoster/voice)
[![Downloads/week](https://img.shields.io/npm/dw/@fonoster/voice.svg)](https://npmjs.org/package/@fonoster/voice)
[![License](https://img.shields.io/npm/l/@fonoster/voice.svg)](https://github.com/fonoster/fonoster/blob/main/package.json)

The session SDK for Fonoster voice applications. For every call, Fonoster's VoiceSessionGateway
opens one signed WebSocket **session** to your app; `VoiceServer` accepts it and runs your handler
with the session. The protocol is in `docs/session-protocol.md`, the full SDK guide in
`docs/voice-sdk.md`, and runnable examples in `examples/`.

* [Installation](#installation)
* [Example](#example)
* [The session](#the-session)

## Installation

```sh-session
$ npm install --save @fonoster/voice
```

## Example

```typescript
import { VoiceServer } from "@fonoster/voice";

// The gateway signs every connection with the app's signing secret.
new VoiceServer({ port: 3000, signingSecret: process.env.APP_SIGNING_SECRET }).listen(
  async (session) => {
    await session.say("Hi there! What's your name?");
    const { speech: name } = await session.gather();
    await session.say(`Nice to meet you ${name}!`);

    await session.say("Please enter your 4 digit pin.");
    const { digits } = await session.gather({ maxDigits: 4, finishOnKey: "#" });
    await session.say(`Your pin is ${digits}`);

    await session.hangup();
  }
);
```

`attach(server, handler)` mounts the same server on an existing HTTP or Express server.

## The session

| Method | Does |
| --- | --- |
| `say(text \| asyncIterable, options?)` | Speaks; resolves with `{ interrupted, heardText, heardMs }` |
| `gather(options?)` | Waits for speech or keypresses (`maxDigits`, `finishOnKey`, `timeout`) |
| `play(url)`, `playDtmf(digits)` | Plays media or DTMF tones |
| `transfer(to, { mode })`, `completeTransfer()` | Cold, warm or `refer` transfer |
| `hold()`, `resume()`, `handoff(app, payload)`, `hangup()` | Call control |
| `audio.onFrame`, `audio.send`, `audio.mark`, `audio.clear` | Raw call audio |
| `on(event, cb)`, `subscribe(events)` | Turns, partial transcripts, keypresses |

Fields: `callRef`, `appRef`, `from`, `to`, `direction`, `metadata`.

Coming from the gRPC SDK (`(req, res)` handlers, `VoiceResponse`, `stream`, `sgather`, `dial`)?
Those are gone; see `docs/migrating-to-sessions.md`. `@fonoster/voice/session` resolves to this
package for one more release.
