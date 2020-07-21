<a name="GoogleTTS"></a>

## GoogleTTS ⇐ [<code>AbstractTTS</code>](#AbstractTTS)
Optional TTS engine for Fonos.

**Kind**: global class  
**Extends**: [<code>AbstractTTS</code>](#AbstractTTS)  
**See**: module:tts:AbstractTTS  

* [GoogleTTS](#GoogleTTS) ⇐ [<code>AbstractTTS</code>](#AbstractTTS)
    * [new GoogleTTS()](#new_GoogleTTS_new)
    * [.synthesize()](#GoogleTTS+synthesize)
    * [.synthesizeSync(text, options)](#AbstractTTS+synthesizeSync) ⇒ <code>string</code>
    * [.getName()](#AbstractTTS+getName)

<a name="new_GoogleTTS_new"></a>

### new GoogleTTS()
Constructs a new GoogleTTS object.

**Example**  
```js
const GoogleTTS = require('@fonos/tts/googletts')
const Storage = require('@fonos/storage')
const { transcodeSync } = require('@fonos/tts/utils')

// This is all done automatically when using the Say verb.
module.exports = chan => {
   const storage = new Storage()
   const tts = new GoogleTTS()
   const pathToFile = tts.synthesizeSync('Hello World')
   const pathToTranscodedFile = transcodeSync(pathToFile)
   const url = storage.uploadFileSync('hello-world.wav', pathToTranscodedFile)
   chan.play(url)
}
```
<a name="GoogleTTS+synthesize"></a>

### googleTTS.synthesize()
**Kind**: instance method of [<code>GoogleTTS</code>](#GoogleTTS)  
**Inherit**: options  {
}  
<a name="AbstractTTS+synthesizeSync"></a>

### googleTTS.synthesizeSync(text, options) ⇒ <code>string</code>
Converts a text to audio.

**Kind**: instance method of [<code>GoogleTTS</code>](#GoogleTTS)  
**Overrides**: [<code>synthesizeSync</code>](#AbstractTTS+synthesizeSync)  
**Returns**: <code>string</code> - The path to the synthesized audio  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | Text to convert to a audio sound |
| options | <code>Object</code> | An object pass to the final implementation with settings for the TTS engine |

<a name="AbstractTTS+getName"></a>

### googleTTS.getName()
Gets the name of the TTS engine

**Kind**: instance method of [<code>GoogleTTS</code>](#GoogleTTS)  
**Overrides**: [<code>getName</code>](#AbstractTTS+getName)  
