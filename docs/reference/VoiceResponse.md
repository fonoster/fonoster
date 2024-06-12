<a name="VoiceResponse"></a>

## VoiceResponse ⇐ <code>Verb</code>
Use the VoiceResponse object, to construct advance Interactive
Voice Response (IVR) applications.

**Kind**: global class  
**Extends**: <code>Verb</code>  
**See**: module:core:APIClient  

* [VoiceResponse](#VoiceResponse) ⇐ <code>Verb</code>
    * [new VoiceResponse(request, voice)](#new_VoiceResponse_new)
    * [.answer()](#VoiceResponse+answer)
    * [.hangup()](#VoiceResponse+hangup)
    * [.play(url, options)](#VoiceResponse+play)
    * [.playDtmf(digits)](#VoiceResponse+playDtmf)
    * [.playbackControl(playbackRef, action)](#VoiceResponse+playbackControl)
    * [.gather(options)](#VoiceResponse+gather)
    * [.say(text, options)](#VoiceResponse+say)
    * [.streamGather(options)](#VoiceResponse+streamGather) ⇒ <code>StreamGatherStream</code>
    * [.record(options)](#VoiceResponse+record) ⇒ <code>RecordResponse</code>
    * [.dial(destination, options)](#VoiceResponse+dial) ⇒ <code>Promise.&lt;DialStatusStream&gt;</code>
    * [.stream(options)](#VoiceResponse+stream) ⇒ <code>Promise.&lt;Stream&gt;</code>
    * [.mute(options)](#VoiceResponse+mute)
    * [.unmute(options)](#VoiceResponse+unmute)

<a name="new_VoiceResponse_new"></a>

### new VoiceResponse(request, voice)
Constructs a new VoiceResponse object.


| Param | Type | Description |
| --- | --- | --- |
| request | <code>VoiceRequest</code> | Options to indicate the objects endpoint |
| voice | <code>VoiceSessionStream</code> | The voice session stream |

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
<a name="VoiceResponse+answer"></a>

### voiceResponse.answer()
Answer the call. Before running any other verb you
must run the anwer command.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Example**  
```js
async function handler (request, response) {
  await response.answer();
}
```
<a name="VoiceResponse+hangup"></a>

### voiceResponse.hangup()
Hangup the call.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Example**  
```js
async function handler (request, response) {
 await response.hangup();
}
```
<a name="VoiceResponse+play"></a>

### voiceResponse.play(url, options)
Play an audio in the call.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**See**: Playback  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | The URL of the media to play |
| options | <code>PlayOptions</code> | Options to control the playback |
| options.playbackRef | <code>string</code> | Playback identifier to use in Playback operations |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  await response.play("https://soundsserver:9000/sounds/hello-world.wav");
}
```
<a name="VoiceResponse+playDtmf"></a>

### voiceResponse.playDtmf(digits)
Play a series of DTMF digits in a call.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  

| Param | Type | Description |
| --- | --- | --- |
| digits | <code>string</code> | The DTMF digits to play (0-9, #, or *) |

**Example**  
```js
async function handler (request, response) {
 await response.answer();
 await response.playDtmf("1234");
}
```
<a name="VoiceResponse+playbackControl"></a>

### voiceResponse.playbackControl(playbackRef, action)
Control the playback of the currently playing media.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**See**: play  

| Param | Type | Description |
| --- | --- | --- |
| playbackRef | <code>string</code> | The playback identifier |
| action | <code>PlaybackControlAction</code> | The action to perform (STOP, RESTART, PAUSE, UNPAUSE, FORWARD) |

**Example**  
```js
async function handler (request, response) {
   await response.answer();
   await response.play("https://s3.fonoster.io/uuid/hello-world.wav", { playbackRef: "playback-01" });

   // Pause the media
   await response.playbackControl("playback-01", PlaybackControlAction.PAUSE);
}
```
<a name="VoiceResponse+gather"></a>

### voiceResponse.gather(options)
Waits for data entry from the user's keypad or from a speech provider.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Note**: When including `SPEECH` the default timeout is 10000 (10s).  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>GatherOptions</code> | Options to select the maximum number of digits, final character, and timeout |
| options.maxDigits | <code>number</code> | Maximum number of digits to collect. Defaults to 1 |
| options.timeout | <code>number</code> | Milliseconds to wait before timeout. Defaults to 4000. Use zero for no timeout. |
| options.finishOnKey | <code>string</code> | Optional last character to wait for. Defaults to '#'. It will not be included in the returned digits |
| options.source | <code>GatherSource</code> | Where to listen as input source. This option accepts `DTMF` and `SPEECH`. A speech provider must be configure when including the `SPEECH` source. You might inclue both with `SPEECH_AND_DTMF`. Defaults to `SPEECH_AND_DTMF` |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  const speech = await response.gather({ source: GatherSource.SPEECH, numDigits: 3 });
  console.log("speech: " + speech);
  await response.hangup();
}
```
<a name="VoiceResponse+say"></a>

### voiceResponse.say(text, options)
Send a text for a TTS engine to convert to speech.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**See**: Say  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | The text to convert to speech |
| options | <code>SayOptions</code> | Options to control the TTS engine |
| options.playbackRef | <code>string</code> | Playback identifier to use in Playback operations |
| options.ttsOptions | <code>TTSOptions</code> | Options to control the TTS engine (specific to the TTS engine) |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  const playbackRef = await response.say("Hello World");

  // Like the play verb, you can control the playback
  await response.playbackControl(playbackRef, PlaybackControlAction.STOP);
}
```
<a name="VoiceResponse+streamGather"></a>

### voiceResponse.streamGather(options) ⇒ <code>StreamGatherStream</code>
Waits for data entry from the user's keypad or from a stream speech provider. This command is different from `gather`
in that it returns a stream of results instead of a single result. You can think of it as active listening.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Returns**: <code>StreamGatherStream</code> - The StreamGatherStream fires events via the `on` method for `speech` and `digits`. And the stream can be close
with the `close` function.  
**See**: StreamSpeechProvider  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>GatherOptions</code> | Options object for the StreamGather verb |
| options.source | <code>string</code> | Where to listen as input source. This option accepts `DTMF` and `SPEECH`. A speech provider must be configure |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  const stream = await response.streamGather({ source: GatherSource.SPEECH_AND_DTMF });

  stream.on("speech", (speech: string) => {
     console.log("speech: %s", speech);
  })

  stream.on("digits", (digits: string) => {
    console.log("digits: " + digits);

    if (digits.includes("#")) {
      stream.close();
    }
  })
}
```
<a name="VoiceResponse+record"></a>

### voiceResponse.record(options) ⇒ <code>RecordResponse</code>
Record the audio of the call.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Returns**: <code>RecordResponse</code> - The record response  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>RecordOptions</code> | Options to control the record operation |
| options.maxDuration | <code>number</code> | The maximum duration of the recording in seconds. Default is 60 |
| options.maxSilence | <code>number</code> | The maximum duration of silence in seconds. Default is 5 |
| options.beep | <code>boolean</code> | Play a beep before recording. Default is true |
| options.finishOnKey | <code>string</code> | Stop recording when a DTMF digit is received. Default is '#' |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  const record = await response.record();
  console.log("Recording: %s", record.name);
}
```
<a name="VoiceResponse+dial"></a>

### voiceResponse.dial(destination, options) ⇒ <code>Promise.&lt;DialStatusStream&gt;</code>
Dials a destination and returns a stream of status.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Returns**: <code>Promise.&lt;DialStatusStream&gt;</code> - The dial status stream  

| Param | Type | Description |
| --- | --- | --- |
| destination | <code>string</code> | The destination to dial |
| options | <code>DialOptions</code> | Options to control the dial operation |
| options.timeout | <code>number</code> | The timeout in seconds. Default is 60 |
| options.recordDirection | <code>RecordDirection</code> | The direction to record the call (IN, OUT, BOTH). Default is BOTH |

<a name="VoiceResponse+stream"></a>

### voiceResponse.stream(options) ⇒ <code>Promise.&lt;Stream&gt;</code>
Starts a bidirectional audio stream between the call and the application.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**Returns**: <code>Promise.&lt;Stream&gt;</code> - The stream object  
**See**: Stream  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>StreamOptions</code> | Options to control the stream operation |
| options.direction | <code>StreamDirection</code> | The direction to stream the audio (IN, OUT, BOTH). Default is BOTH |
| options.format | <code>StreamAudioFormat</code> | The audio format to stream (WAV). Default is WAV |
| options.enableVad | <code>boolean</code> | Enable voice activity detection. Default is false |

**Example**  
```js
async function handler (request, response) {
  await response.answer();

  const stream = await response.stream({
    direction: StreamDirection.BOTH,
    format: StreamAudioFormat.WAV,
    enableVad: true
  });

  stream.onPayload((payload) => {
    // Use the payload
  });

  // Or write to the stream
  // stream.write({ type: StreamMessageType.AUDIO_OUT, payload: "\x00\x01\x02" });
}
```
<a name="VoiceResponse+mute"></a>

### voiceResponse.mute(options)
Mutes a call.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**See**: unmute  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>MuteOptions</code> | Options to control the mute operation |
| options.direction | <code>MuteDirection</code> | The direction to mute the channel (IN, OUT, BOTH). Default is BOTH |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  await response.mute();       // Will mute both directions
}
```
<a name="VoiceResponse+unmute"></a>

### voiceResponse.unmute(options)
Unmutes a call.

**Kind**: instance method of [<code>VoiceResponse</code>](#VoiceResponse)  
**See**: mute  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>MuteOptions</code> | Options to control the unmute operation |
| options.direction | <code>MuteDirection</code> | The direction to unmute the call (IN, OUT, BOTH). Default is BOTH |

**Example**  
```js
async function handler (request, response) {
  await response.answer();
  await response.unmute();     // Will unmute both directions
}
```
