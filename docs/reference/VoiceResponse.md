<a name="VoiceResponse"></a>

## VoiceResponse ⇐ <code>Verb</code>
Use the VoiceResponse object, to construct advance Interactive
Voice Response (IVR) applications.

**Kind**: global class  
**Extends**: <code>Verb</code>  
**See**: module:core:APIClient  

* [VoiceResponse](#VoiceResponse) ⇐ <code>Verb</code>
    * [new VoiceResponse(request)](#new_VoiceResponse_new)
    * [.use(plugin)](#VoiceResponse+use)
    * [.play(media, options)](#VoiceResponse+play)
    * [.say(text, options)](#VoiceResponse+say)
    * [.gather(options)](#VoiceResponse+gather)
    * [.sgather(options)](#VoiceResponse+sgather) ⇒ <code>SGatherStream</code>
    * [.dtmf(options)](#VoiceResponse+dtmf)
    * [.dial(destination, options)](#VoiceResponse+dial) ⇒ <code>StatusStream</code>
    * [.playback(playbackId)](#VoiceResponse+playback)
    * [.on(handler)](#VoiceResponse+on)
    * [.mute(options)](#VoiceResponse+mute)
    * [.unmute(options)](#VoiceResponse+unmute)
    * [.answer()](#VoiceResponse+answer)
    * [.hangup()](#VoiceResponse+hangup)
    * [.record(options)](#VoiceResponse+record) ⇒ <code>Promise.&lt;RecordResult&gt;</code>

<a name="new_VoiceResponse_new"></a>

### new VoiceResponse(request)
Constructs a new VoiceResponse object.


| Param | Type | Description |
| --- | --- | --- |
| request | <code>VoiceRequest</code> | Options to indicate the objects endpoint |

**Example**  
```js
import { VoiceServer } from "@fonoster/voice";

async function handler (request, response) {
  await response.answer();
  await response.play("sound:hello-world");
}

const voiceServer = new VoiceServer({base: '/voiceapp'})
voiceServer.listen(handler, { port: 3000 })
```
<a name="VoiceResponse+use"></a>

### voiceResponse.use(plugin)
Adds a tts or asr plugin. Only one type of plugin can be attached.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**See**

- GoogleTTS
- GoogleASR


| Param |
| --- |
| plugin | 

<a name="VoiceResponse+play"></a>

### voiceResponse.play(media, options)
Play an audio in the channel.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**See**: Playback  

| Param | Type | Description |
| --- | --- | --- |
| media | <code>string</code> | Sound name or uri with audio file |
| options | <code>PlayOptions</code> | Optional parameters to alter the command's normal behavior |
| options.offset | <code>string</code> | Milliseconds to skip before playing. Only applies to the first URI if multiple media URIs are specified |
| options.skip | <code>string</code> | Milliseconds to skip for forward/reverse operations |
| options.playbackId | <code>string</code> | Playback identifier to use in Playback operations |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  await response.play("https://soundsserver:9000/sounds/hello-world.wav");
}
```
<a name="VoiceResponse+say"></a>

### voiceResponse.say(text, options)
Converts a text into a sound and sends sound to media server. To use this verb, you must
first setup a TTS plugin such as MaryTTS, GoogleTTS, or AWS PollyTTS

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**See**

- Play
- Voice.use


| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | Converts a text into a sound and sends sound to media server |
| options | <code>SayOptions</code> | Optional parameters to alter the command's normal behavior |
| options.offset | <code>string</code> | Milliseconds to skip before playing |
| options.skip | <code>string</code> | Milliseconds to skip for forward/reverse operations |
| options.playbackId | <code>string</code> | Playback identifier to use in Playback operations |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  response.use(new GoogleTTS())
  await response.say("Hello workd");   // Plays the sound using GoogleTTS's default values
}
```
<a name="VoiceResponse+gather"></a>

### voiceResponse.gather(options)
Waits for data entry from the user's keypad or from a speech provider.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Note**: When including `speech` the default timeout is 10000 (10s).  
**See**: SpeechProvider  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>GatherOptions</code> | Options to select the maximum number of digits, final character, and timeout |
| options.numDigits | <code>number</code> | Milliseconds to skip before playing. Only applies to the first URI if multiple media URIs are specified |
| options.timeout | <code>number</code> | Milliseconds to wait before timeout. Defaults to 4000. Use zero for no timeout. |
| options.finishOnKey | <code>string</code> | Optional last character to wait for. Defaults to '#'. It will not be included in the returned digits |
| options.source | <code>string</code> | Where to listen as input source. This option accepts `dtmf` and `speech`. A speech provider must be configure when including the `speech` source. You might inclue both with `dtmf,speech`. Defaults to `dtmf` |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  const digits = await response.gather({numDigits: 3});
  console.log("digits: " + digits);
}
```
<a name="VoiceResponse+sgather"></a>

### voiceResponse.sgather(options) ⇒ <code>SGatherStream</code>
Waits for data entry from the user's keypad or from a stream speech provider. This command is different from `gather`
in that it returns a stream of results instead of a single result. You can think of it as active listening.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Returns**: <code>SGatherStream</code> - The SGatherStream fires events via the `on` method for `transcription`, `dtmf`, and `error`. And the stream can be close
with the `close` function.  
**See**: StreamSpeechProvider  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>SGatherOptions</code> | Options object for the SGather verb |
| options.source | <code>string</code> | Where to listen as input source. This option accepts `dtmf` and `speech`. A speech provider must be configure when including the `speech` source. You might inclue both with `dtmf,speech`. Defaults to `speech,dtmf` |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  const stream = await response.sgather({source: "dtmf,speech"});

  stream.on("transcript", (text, isFinal) => {
     console.log("transcript: %s", text);
  })

  stream.on("dtmf", digit => {
     console.log("digit: " + digit);
     if (digit === "#") stream.close();
  })
}
```
<a name="VoiceResponse+dtmf"></a>

### voiceResponse.dtmf(options)
Sends dtmf tones to the current session.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>DtmfOptions</code> | Options object for the Dtmf verb |
| options.dtmf | <code>string</code> | A string of the dtmf tones |

**Example**  
```js
async function handler (request, response) {
   await response.answer();
   await response.play("sound:hello-world");
   await response.dtmf({dtmf: "1234"});
}
```
<a name="VoiceResponse+dial"></a>

### voiceResponse.dial(destination, options) ⇒ <code>StatusStream</code>
Forwards the call to an Agent or the PSTN.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Returns**: <code>StatusStream</code> - The StatusStream fires events via the `on` method for `progress`, `answer`, `noanswer`, and `busy`. And the stream can be close
with the `close` function.  

| Param | Type | Description |
| --- | --- | --- |
| destination | <code>string</code> | Number or Agent to forward the call to |
| options | <code>DialOptions</code> | Options object for the Dial verb |
| options.timeout | <code>timeout</code> | Dial timeout |

**Example**  
```js
async function handler (request, response) {
   await response.answer();
   await response.say("dialing number");
   const stream = await response.dial("17853178070");
   stream.on("progress", console.log)
   stream.on("answer", console.log)
   stream.on("busy", console.log)
}
```
<a name="VoiceResponse+playback"></a>

### voiceResponse.playback(playbackId)
Returns a PlaybackControl control object.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**See**: Play  

| Param | Type | Description |
| --- | --- | --- |
| playbackId | <code>string</code> | Playback identifier to use in Playback operations |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  response.onDtmfReceived(async(digit) => {
     const control = response.playback("1234")
     digit === "3"
       ? await control.restart()
       : await control.forward()
  })

  await response.play("https://soundsserver:9000/sounds/hello-world.wav", {
     playbackId: "1234"
  });
}
```
<a name="VoiceResponse+on"></a>

### voiceResponse.on(handler)
Listens event publication.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  

| Param | Type | Description |
| --- | --- | --- |
| handler | <code>function</code> | Event handler |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  response.on("DtmfReceived", async(digit) => {
     const control = response.playback("1234")
     digit === "3"
       ? await control.restart()
       : await control.forward()
  })

  await response.play("https://soundsserver:9000/sounds/hello-world.wav", {
     playbackId: "1234"
  });
}
```
<a name="VoiceResponse+mute"></a>

### voiceResponse.mute(options)
Mutes a channel.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**See**: unmute  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>MuteOptions</code> | Indicate which direction of he communication to mute |
| options.direction | <code>string</code> | Possible values are 'in', 'out', and 'both' |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  await response.mute();       // Will mute both directions
}
```
<a name="VoiceResponse+unmute"></a>

### voiceResponse.unmute(options)
Unmutes a channel.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**See**: mute  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>MuteOptions</code> | Indicate which direction of he communication to unmute |
| options.direction | <code>string</code> | Possible values are 'in', 'out', and 'both' |

**Example**  
```js
async function handler (request, response) {
  ...
  await response.unmute({direction: "out"});       // Will unmute only the "out" direction
}
```
<a name="VoiceResponse+answer"></a>

### voiceResponse.answer()
Answer the communication channel. Before running any other verb you
must run the anwer command.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Example**  
```js
async function handler (request, response) {
  await response.answer();
  ...
}
```
<a name="VoiceResponse+hangup"></a>

### voiceResponse.hangup()
Terminates the communication channel.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Example**  
```js
async function handler (request, response) {
  ...
  await response.hangup();
}
```
<a name="VoiceResponse+record"></a>

### voiceResponse.record(options) ⇒ <code>Promise.&lt;RecordResult&gt;</code>
Records the current channel and uploads the file to the storage subsystem.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Returns**: <code>Promise.&lt;RecordResult&gt;</code> - Returns useful information such as the duration of the recording, etc.  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>RecordOptions</code> | optional parameters to alter the command's normal behavior |
| options.maxDuration | <code>number</code> | Maximum duration of the recording, in seconds. Use `0` for no limit |
| options.maxSilence | <code>number</code> | Maximum duration of silence, in seconds. Use `0` for no limit |
| options.beep | <code>boolean</code> | Play beep when recording begins |
| options.finishOnKey | <code>string</code> | DTMF input to terminate recording |

**Example**  
```js
async function handler (request, response) {
  await response.answer();;
  const result = await response.record({finishOnKey: "#"});
  console.log("recording result: " + JSON.stringify(result))     // recording result: { duration: 30 ...}
}
```
