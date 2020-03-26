<a name="MaryTTS"></a>

## MaryTTS ⇐ [<code>AbstractTTS</code>](#AbstractTTS)
The default TTS engine in a YAPS deployment.

**Kind**: global class  
**Extends**: [<code>AbstractTTS</code>](#AbstractTTS)  
**See**: module:tts:AbstractTTS  

* [MaryTTS](#MaryTTS) ⇐ [<code>AbstractTTS</code>](#AbstractTTS)
    * [new MaryTTS()](#new_MaryTTS_new)
    * [.synthesize()](#MaryTTS+synthesize)
    * [.synthesizeSync(text, options)](#AbstractTTS+synthesizeSync) ⇒ <code>string</code>
    * [.getEngineName()](#AbstractTTS+getEngineName)

<a name="new_MaryTTS_new"></a>

### new MaryTTS()
Constructs a new MaryTTS object.

**Example**  
```js
const MaryTTS = require('@yaps/tts/marytts')
const Storage = require('@yaps/storage')
const { transcodeSync } = require('@yaps/tts/utils')

// This is all done automatically when using the Say verb.
module.exports = chan => {
   const storage = new Storage()
   const tts = new MaryTTS()
   const pathToFile = tts.synthesizeSync('Hello World')
   const pathToTranscodedFile = transcodeSync(pathToFile)
   const url = storage.uploadFileSync('hello-world.wav', pathToTranscodedFile)
   chan.play(url)
}
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
**Returns**: <code>string</code> - - The path to the audio synthesized from the text  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | Text to convert to a audio sound |
| options | <code>Object</code> | A an object pass to the final implementation with settings for the TTS engine. |

<a name="AbstractTTS+getEngineName"></a>

### maryTTS.getEngineName()
Gets the name of the final implementating TTS engine

**Kind**: instance method of [<code>MaryTTS</code>](#MaryTTS)  
**Overrides**: [<code>getEngineName</code>](#AbstractTTS+getEngineName)  
