<a name="AbstractTTS"></a>

## AbstractTTS
A building block for new TTS engines. You might use this class
to create integration with ANY TTS by providing he abstracted functions, and
with help of the `tts/utils.`

**Kind**: global class  
**See**: module:tts:MaryTTS  

* [AbstractTTS](#AbstractTTS)
    * [new AbstractTTS()](#new_AbstractTTS_new)
    * [.synthesizeSync(text, options)](#AbstractTTS+synthesizeSync) ⇒ <code>string</code>
    * [.getEngineName()](#AbstractTTS+getEngineName)

<a name="new_AbstractTTS_new"></a>

### new AbstractTTS()
Constructs a new AbstractTTS object.

<a name="AbstractTTS+synthesizeSync"></a>

### abstractTTS.synthesizeSync(text, options) ⇒ <code>string</code>
Converts a text to audio.

**Kind**: instance method of [<code>AbstractTTS</code>](#AbstractTTS)  
**Returns**: <code>string</code> - - The path to the audio synthesized from the text  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | Text to convert to a audio sound |
| options | <code>Object</code> | A an object pass to the final implementation with settings for the TTS engine. |

<a name="AbstractTTS+getEngineName"></a>

### abstractTTS.getEngineName()
Gets the name of the final implementating TTS engine

**Kind**: instance method of [<code>AbstractTTS</code>](#AbstractTTS)  
