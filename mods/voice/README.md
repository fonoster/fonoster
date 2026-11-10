voice
=================

[![Voice](https://img.shields.io/badge/voice-api-brightgreen.svg)](https://fonoster.com)
[![Version](https://img.shields.io/npm/v/@fonoster/voice.svg)](https://npmjs.org/package/@fonoster/voice)
[![Downloads/week](https://img.shields.io/npm/dw/@fonoster/voice.svg)](https://npmjs.org/package/@fonoster/voice)
[![License](https://img.shields.io/npm/l/@fonoster/voice.svg)](https://github.com/fonoster/fonoster/blob/main/package.json)

The session SDK for Fonoster voice applications. For every call, Fonoster's AppBridge
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

// AppBridge signs every connection with the app's signing secret.
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


<a name="Session"></a>

## Session
One call's session, built on the fonoster.session.v1 messages (voice-sdk S8). Verbs are
conveniences: each sends one command and resolves on the event that answers it.

**Kind**: global class  

* [Session](#Session)
    * [.midTurn](#Session+midTurn)
    * [.turnExpired](#Session+turnExpired)
    * [.say()](#Session+say)
    * [.stopSay()](#Session+stopSay)
    * [.gather()](#Session+gather)
    * [.listen()](#Session+listen)
    * [.subscribe()](#Session+subscribe)
    * [.transfer()](#Session+transfer)
    * [.completeTransfer()](#Session+completeTransfer)
    * [.handoff()](#Session+handoff)
    * [.hangup()](#Session+hangup)
    * [.note()](#Session+note)
    * [.reportUsage()](#Session+reportUsage)
    * [.answer()](#Session+answer)
    * [.receive()](#Session+receive)
    * [.closed()](#Session+closed)
    * [.command()](#Session+command)
    * [.bargeIn()](#Session+bargeIn)

<a name="Session+midTurn"></a>

### session.midTurn
The caller is mid-turn: a turn.user_started with no turn.ended yet.

**Kind**: instance property of [<code>Session</code>](#Session)  
<a name="Session+turnExpired"></a>

### session.turnExpired
A gather gave up on the current turn; its late turn.ended is dropped, not buffered.

**Kind**: instance property of [<code>Session</code>](#Session)  
<a name="Session+say"></a>

### session.say()
Speaks text, or a stream of text pieces as one utterance, and reports what was heard.

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+stopSay"></a>

### session.stopSay()
Cuts the agent off: every pending say and play resolves as interrupted.

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+gather"></a>

### session.gather()
Waits for speech (turn.ended) or digits (dtmf), whichever comes first.

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+listen"></a>

### session.listen()
Starts listening or changes how AppBridge listens (`listen.update`): recognition language,
hints, and the turn-taking patience knob (`low`, `normal` or `high`).

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+subscribe"></a>

### session.subscribe()
Requests opt-in events: "turn.estimate", "transcript.partial".

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+transfer"></a>

### session.transfer()
Transfers the call; resolves when AppBridge ends the session with reason transfer.

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+completeTransfer"></a>

### session.completeTransfer()
Completes the pending warm transfer: the agent leaves, caller and new party stay. Resolves
when the session ends with reason transfer; rejects with a SessionError
(`transfer_not_answered`) when the new party has not answered yet, which leaves the transfer
pending: wait for the `transfer.answered` event and call it again.

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+handoff"></a>

### session.handoff()
Hands the call to another app with a payload; resolves when this session ends.

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+hangup"></a>

### session.hangup()
Hangs up; resolves when the session ends. `failure` ends the call as failed in the call record
(@internal: reserved for Fonoster's own apps (Autopilot); AppBridge ignores it from others).

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+note"></a>

### session.note()
Adds a note to the call record (record.note).

**Kind**: instance method of [<code>Session</code>](#Session)  
**Internal**: Reserved for Fonoster's own apps (Autopilot); not part of the public SDK and may change.  
<a name="Session+reportUsage"></a>

### session.reportUsage()
Adds model token usage to the call (usage.report, add-usage-metering).

**Kind**: instance method of [<code>Session</code>](#Session)  
**Internal**: Reserved for Fonoster's own Autopilot; AppBridge refuses it from other apps.  
<a name="Session+answer"></a>

### session.answer()
Resolves at once: AppBridge answers the call on connect (voice-sdk S2).

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+receive"></a>

### session.receive()
Feeds one frame from the socket.

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+closed"></a>

### session.closed()
The socket closed.

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+command"></a>

### session.command()
Sends a command whose only answer is a possible error (logged as a session error).

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+bargeIn"></a>

### session.bargeIn()
The app owns interruption (appbridge B22): when the caller starts talking over an interruptible
say or play, the SDK cuts it off with clear; a non-interruptible one keeps playing.

**Kind**: instance method of [<code>Session</code>](#Session)  

<a name="VoiceServer"></a>

## VoiceServer
Accepts AppBridge sessions over WebSocket and runs the handler once per session
(voice-sdk, "VoiceServer accepts AppBridge sessions over WebSocket").

**Kind**: global class  

* [VoiceServer](#VoiceServer)
    * [.listen()](#VoiceServer+listen)
    * [.attach()](#VoiceServer+attach)
    * [.handleUpgrade()](#VoiceServer+handleUpgrade)

<a name="VoiceServer+listen"></a>

### voiceServer.listen()
Starts a standalone server. Resolves once it is listening.

**Kind**: instance method of [<code>VoiceServer</code>](#VoiceServer)  
<a name="VoiceServer+attach"></a>

### voiceServer.attach()
Mounts on an existing HTTP server (Express included): sessions arrive on `path`.

**Kind**: instance method of [<code>VoiceServer</code>](#VoiceServer)  
<a name="VoiceServer+handleUpgrade"></a>

### voiceServer.handleUpgrade()
Handles one upgrade request: verifies the signature, then runs a session.

**Kind**: instance method of [<code>VoiceServer</code>](#VoiceServer)  

<a name="SessionError"></a>

## SessionError
A command failed: AppBridge sent `error` with `relatesTo` set to the command's id.

**Kind**: global class  

<a name="SessionEndedError"></a>

## SessionEndedError
The session ended (or a fatal error arrived) while the command was pending.

**Kind**: global class  

