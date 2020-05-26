<a name="AbstractTTS"></a>

## AbstractTTS
A building block for new TTS engines. You might use this class
to create integration with ANY TTS by providing the abstracted functions, and
with help of the `tts/utils.`

**Kind**: global class  
**See**: module:tts:MaryTTS  

* [AbstractTTS](#AbstractTTS)
    * [new AbstractTTS(name)](#new_AbstractTTS_new)
    * [.synthesizeSync(text, options)](#AbstractTTS+synthesizeSync) ⇒ <code>string</code>
    * [.getName()](#AbstractTTS+getName)

<a name="new_AbstractTTS_new"></a>

### new AbstractTTS(name)
Constructs a new AbstractTTS object.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | friendly name for the TTS engine |

<a name="AbstractTTS+synthesizeSync"></a>

### abstractTTS.synthesizeSync(text, options) ⇒ <code>string</code>
Converts a text to audio.

**Kind**: instance method of [<code>AbstractTTS</code>](#AbstractTTS)  
**Returns**: <code>string</code> - The path to the synthesized audio  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | Text to convert to a audio sound |
| options | <code>Object</code> | An object pass to the final implementation with settings for the TTS engine |

<a name="AbstractTTS+getName"></a>

### abstractTTS.getName()
Gets the name of the TTS engine

**Kind**: instance method of [<code>AbstractTTS</code>](#AbstractTTS)  
