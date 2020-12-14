<a name="MaryTTS"></a>

## MaryTTS ⇐ [<code>AbstractTTS</code>](#AbstractTTS)
The default TTS engine in a Fonos deployment.

**Kind**: global class  
**Extends**: [<code>AbstractTTS</code>](#AbstractTTS)  
**See**: module:tts:AbstractTTS  

* [MaryTTS](#MaryTTS) ⇐ [<code>AbstractTTS</code>](#AbstractTTS)
    * [new MaryTTS()](#new_MaryTTS_new)
    * [.synthesize()](#MaryTTS+synthesize)
    * [.synthesizeSync(text, options)](#AbstractTTS+synthesizeSync) ⇒ <code>string</code>
    * [.getName()](#AbstractTTS+getName)

<a name="new_MaryTTS_new"></a>

### new MaryTTS()
Constructs a new MaryTTS object.

**Example**  
```js
const MaryTTS = require('@fonos/tts/marytts')const Storage = require('@fonos/storage')const { transcodeSync } = require('@fonos/tts/utils')// This is all done automatically when using the Say verb.module.exports = chan => {   const storage = new Storage()   const tts = new MaryTTS()   const pathToFile = tts.synthesizeSync('Hello World')   const pathToTranscodedFile = transcodeSync(pathToFile)   const url = storage.uploadFileSync('hello-world.wav', pathToTranscodedFile)   chan.play(url)}
```
<a name="MaryTTS+synthesize"></a>

### maryTTS.synthesize()
**Kind**: instance method of [<code>MaryTTS</code>](#MaryTTS)  
**Inherit**:   
<a name="AbstractTTS+synthesizeSync"></a>

### maryTTS.synthesizeSync(text, options) ⇒ <code>string</code>
Converts a text to audio.

**Kind**: instance method of [<code>MaryTTS</code>](#MaryTTS)  
**Overrides**: [<code>synthesizeSync</code>](#AbstractTTS+synthesizeSync)  
**Returns**: <code>string</code> - The path to the synthesized audio  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | Text to convert to a audio sound |
| options | <code>Object</code> | An object pass to the final implementation with settings for the TTS engine |

<a name="AbstractTTS+getName"></a>

### maryTTS.getName()
Gets the name of the TTS engine

**Kind**: instance method of [<code>MaryTTS</code>](#MaryTTS)  
**Overrides**: [<code>getName</code>](#AbstractTTS+getName)  
