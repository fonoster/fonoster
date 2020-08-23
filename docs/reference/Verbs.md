<a name="Verbs"></a>

## Verbs
**Kind**: global class  
**Params**: <code>Channel</code> channel - Channel object pass from AGI-Node  
**Params**: <code>Object</code> config - This parameter is required for proper operation
of some verbs, such as `Say`.  
**Params**: [<code>Storage</code>](#Storage) config.storage - An instance of the Storage object  
**Params**: <code>TTS</code> config.tts - An instance of a TTS engine implementation  

* [Verbs](#Verbs)
    * [new Verbs()](#new_Verbs_new)
    * [.overrideTTS(tts)](#Verbs+overrideTTS)
    * [.answer()](#Verbs+answer)
    * [.hangup()](#Verbs+hangup)
    * [.setAutoHangup()](#Verbs+setAutoHangup)
    * [.play(file, options)](#Verbs+play) ⇒ <code>string</code>
    * [.say(text, options)](#Verbs+say) ⇒ <code>string</code>
    * [.wait()](#Verbs+wait)
    * [.gather(text, options)](#Verbs+gather) ⇒ <code>string</code>
    * [.record(text, options)](#Verbs+record) ⇒ <code>string</code>
    * [.stash()](#Verbs+stash)

<a name="new_Verbs_new"></a>

### new Verbs()
Constructs a new Verbs object.

<a name="Verbs+overrideTTS"></a>

### verbs.overrideTTS(tts)
/**
Replaces default TTS engine with a new implementation.

**Kind**: instance method of [<code>Verbs</code>](#Verbs)  

| Param |
| --- |
| tts | 

<a name="Verbs+answer"></a>

### verbs.answer()
Answer a call if not already answered.

**Kind**: instance method of [<code>Verbs</code>](#Verbs)  
<a name="Verbs+hangup"></a>

### verbs.hangup()
Terminates a call if not already terminated.

**Kind**: instance method of [<code>Verbs</code>](#Verbs)  
<a name="Verbs+setAutoHangup"></a>

### verbs.setAutoHangup()
Terminates at `timeout`

**Kind**: instance method of [<code>Verbs</code>](#Verbs)  
<a name="Verbs+play"></a>

### verbs.play(file, options) ⇒ <code>string</code>
Plays an audio in the calls channel.

**Kind**: instance method of [<code>Verbs</code>](#Verbs)  
**Returns**: <code>string</code> - Pressed key or undefined if no key was pressed before
timeout  

| Param | Type | Description |
| --- | --- | --- |
| file | <code>string</code> | Is a file that has been previously uploaded or is available by default in the applications bucket. |
| options | <code>Object</code> | Optional parameters to alter the command's normal behavior |
| options.finishOnKey | <code>string</code> | Key to terminate the playing |

**Example**  
```js
const options {
  finishOnKey: '#'',
}

const result = chan.play('tts-monkeys', options)
```
<a name="Verbs+say"></a>

### verbs.say(text, options) ⇒ <code>string</code>
Sythentizes a text and streams the resulting audio.

**Kind**: instance method of [<code>Verbs</code>](#Verbs)  
**Returns**: <code>string</code> - Pressed key or undefined if no key was pressed before
timeout  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | Will be convert into a file and put in a cache for future use. |
| options | <code>Object</code> | Optional parameters to alter the command's normal behavior. |
| options.finishOnKey | <code>string</code> | Key to terminate the playing |

**Example**  
```js
const options {
  finishOnKey: '#'',
}

const result = chan.say('hello, this is an audio sample', options)
```
<a name="Verbs+wait"></a>

### verbs.wait()
Plays a silence for `time` seconds.

**Kind**: instance method of [<code>Verbs</code>](#Verbs)  
**Params**: <code>number</code> time - A time seconds to wait for  
<a name="Verbs+gather"></a>

### verbs.gather(text, options) ⇒ <code>string</code>
The Gather verb is used in combination with Play, Say, Wait.

**Kind**: instance method of [<code>Verbs</code>](#Verbs)  
**Returns**: <code>string</code> - Pressed digits or undefined if no keys were pressed before
timeout  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | Will be convert into a file and put in a cache for future use. |
| options | <code>Object</code> | Optional parameters to alter the command's normal behavior. |
| options.timeout | <code>string</code> | Time to finish if no key is pressed |
| options.finishOnKey | <code>string</code> | Key to terminate the playing |
| options.maxDigits | <code>string</code> | Max number of digits accepted |

**Example**  
```js
const options {
  finishOnKey: '#'',
  maxDigits: 4
}

const result = chan.gather(chan.say('this is an audio sample'), options)
```
<a name="Verbs+record"></a>

### verbs.record(text, options) ⇒ <code>string</code>
Record creates a file with the sound send by receiving device

**Kind**: instance method of [<code>Verbs</code>](#Verbs)  
**Returns**: <code>string</code> - Metadata with information about the recordings  
**Todo**

- [ ] Add constrains for the file's format


| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | Will be convert into a file and put in a cache for future use. |
| options | <code>Object</code> | Optional parameters to alter the command's normal behavior. |
| options.timeout | <code>string</code> | Time to finish if no key is pressed |
| options.finishOnKey | <code>string</code> | Key to terminate the playing |
| options.beep | <code>string</code> | Wether to beep or not before beginig the recordings. Defaults to 'false' |
| options.silenceSeconds | <code>string</code> | Causes the recording to first seek to the specified offset before recording begins |
| options.maxDuration | <code>string</code> | Maximum duration of the recording. Defaults to `1 hour.` |

**Example**  
```js
const options = {
    timeout: 4,         // Default
    finishOnKey: #,     // Characters used to finish the recording
    beep: true,
    silenceSeconds: 0,
    maxDuration: 3600   // Maximum duration in seconds
}

const result = chan.record(options)
```
<a name="Verbs+stash"></a>

### verbs.stash()
Saves a set of key,value in the Call Detail Record.

**Kind**: instance method of [<code>Verbs</code>](#Verbs)  
**Example**  
```js
chan.stash('choice', chan.say('enter your option'))
```
