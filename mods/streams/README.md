streams
=================

[![Streams](https://img.shields.io/badge/streams-api-brightgreen.svg)](https://fonoster.com)
[![Version](https://img.shields.io/npm/v/@fonoster/streams.svg)](https://npmjs.org/package/@fonoster/streams)
[![Downloads/week](https://img.shields.io/npm/dw/@fonoster/streams.svg)](https://npmjs.org/package/@fonoster/streams)
[![License](https://img.shields.io/npm/l/@fonoster/streams.svg)](https://github.com/fonoster/fonoster/blob/main/package.json)

This is a NodeJS implementation of the AudioSocket protocol, which is a simple protocol for accessing bidirectional audio streams from Asterisk.

* [Installation](#installation)
* [Example](#example)
* [APIs](#apis)

## Installation

```sh-session
$ npm install --save @fonoster/streams
```

## Example

While the AudioSocket is a utility for Fonoster Streams, it can be used as a standalone module. To use this library with Asterisk, you must configure your dialplan to use the `AudioSocket` application. Here is an example of how to use the AudioSocket with Asterisk:

```
exten = 100,1,Verbose("Call to AudioSocket via Dialplan Application")
 same = n,Answer()
 same = n,AudioSocket(40325ec2-5efd-4bd3-805f-53576e581d13,server.example.com:9092)
 same = n,Hangup()
```

Or with the `Dial` application:

```
exten = 100,1,Verbose("Call to AudioSocket via Dialplan Application")
 same = n,Answer()
 same = n,Dial(SIP/100,30,A(AudioSocket(40325ec2-5efd-4bd3-805f-53576e581d13,server.example.com:9092)))
 same = n,Hangup()
```

Connecting to the AudioSocket server using ARI with the `externalMedia` endpoint is also possible. You must ensure you set the transport to `TCP` the UUID in the data field. 

> Currently, the payload towards Asterisk is limited to signed linear, 16-bit, 8kHz, mono PCM (little-endian). However, the payload from Asterisk can be changed with the `format` parameter when using ARI. Please see the [AudioSocket Server](https://github.com/silentindark/audiosocket_server) implementation, for interesting notes about AudioSocket.

Once Asterisk is configured, you can use the `AudioSocket` class to create a server that listens for connections. Here is an example of how to use the `AudioSocket` class:

```js
const { AudioSocket } = require("@fonoster/streams");

const audioSocket = new AudioSocket();

audioSocket.onConnection(async (req, res) => {
  console.log("new connection from:", req.ref);

  res.on("data", (data) => {
     // Do something with the audio data
  );

  res.on("end", () => {
     // Do something when the stream ends
  });

  res.on("error", (err) => {
     // Do something when an error occurs
  });

  // Utility for playing audio files
  await res.play("/path/to/audio/file");
});

audioSocket.listen(9092, () => {
  console.log("server listening on port 9092");
});
```

## APIs

* [`AudioSocket`](#AudioSocket)
* [`AudioStream`](#AudioStream)


<a name="AudioSocket"></a>

## AudioSocket
A NodeJS implementation of the AudioSocket protocol. The AudioSocket protocol is
a simple protocol for streaming audio from Asterisk to a NodeJS application. The protocol is
based on the I/O multiplexing model and uses

**Kind**: global class  
**See**: AudioStream  

* [AudioSocket](#AudioSocket)
    * [new AudioSocket()](#new_AudioSocket_new)
    * [.onConnection(handler)](#AudioSocket+onConnection)
    * [.close()](#AudioSocket+close)

<a name="new_AudioSocket_new"></a>

### new AudioSocket()
Constructs a new AudioSocket instance.

**Example**  
```js
const { AudioSocket } = require("@fonoster/streams");

const audioSocket = new AudioSocket();

audioSocket.onConnection(async (req, res) => {
  console.log("new connection from:", req.ref);

  res.on("data", (data) => {
     // Do something with the audio data
  );

  res.on("end", () => {
     // Do something when the stream ends
  });

  res.on("error", (err) => {
     // Do something when an error occurs
  });

  // Utility for playing audio files
  await res.play("/path/to/audio/file");
});

audioSocket.listen(9092, () => {
  console.log("server listening on port 9092");
});
```
<a name="AudioSocket+onConnection"></a>

### audioSocket.onConnection(handler)
Sets the handler to be called when a new connection is established.

**Kind**: instance method of [<code>AudioSocket</code>](#AudioSocket)  

| Param | Type | Description |
| --- | --- | --- |
| handler | <code>function</code> | The handler to call when a new connection is established |

**Example**  
```js
audioSocket.onConnection(async (req, res) => {
  console.log("new connection from:", req.ref);

  await res.play("/path/to/audio/file");
});
```
<a name="AudioSocket+close"></a>

### audioSocket.close()
Closes the server and stops listening for connections.

**Kind**: instance method of [<code>AudioSocket</code>](#AudioSocket)  

<a name="AudioStream"></a>

## AudioStream
Object representing a stream of bidirectional audio data and control messages.

**Kind**: global class  

* [AudioStream](#AudioStream)
    * [new AudioStream(stream, socket)](#new_AudioStream_new)
    * [.write(data)](#AudioStream+write)
    * [.hangup()](#AudioStream+hangup)
    * [.play(filePath)](#AudioStream+play) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.onData(callback)](#AudioStream+onData) ⇒ [<code>AudioStream</code>](#AudioStream)
    * [.onClose(callback)](#AudioStream+onClose) ⇒ [<code>AudioStream</code>](#AudioStream)
    * [.onError(callback)](#AudioStream+onError) ⇒ [<code>AudioStream</code>](#AudioStream)

<a name="new_AudioStream_new"></a>

### new AudioStream(stream, socket)
Creates a new AudioStream.


| Param | Type | Description |
| --- | --- | --- |
| stream | <code>Readable</code> | A readable stream |
| socket | <code>net.Socket</code> | A TCP socket |

<a name="AudioStream+write"></a>

### audioStream.write(data)
Writes media data to the stream.

**Kind**: instance method of [<code>AudioStream</code>](#AudioStream)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Buffer</code> | The data to write |

<a name="AudioStream+hangup"></a>

### audioStream.hangup()
Sends a hangup message to the stream and closes the connection.

**Kind**: instance method of [<code>AudioStream</code>](#AudioStream)  
<a name="AudioStream+play"></a>

### audioStream.play(filePath) ⇒ <code>Promise.&lt;void&gt;</code>
Utility for playing audio files.

**Kind**: instance method of [<code>AudioStream</code>](#AudioStream)  

| Param | Type | Description |
| --- | --- | --- |
| filePath | <code>string</code> | The path to the audio file |

<a name="AudioStream+onData"></a>

### audioStream.onData(callback) ⇒ [<code>AudioStream</code>](#AudioStream)
Adds a listener for the data event.

**Kind**: instance method of [<code>AudioStream</code>](#AudioStream)  
**Returns**: [<code>AudioStream</code>](#AudioStream) - The AudioStream instance  
**See**: EventType.DATA  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | The callback to be executed |

<a name="AudioStream+onClose"></a>

### audioStream.onClose(callback) ⇒ [<code>AudioStream</code>](#AudioStream)
Adds a listener for the end event.

**Kind**: instance method of [<code>AudioStream</code>](#AudioStream)  
**Returns**: [<code>AudioStream</code>](#AudioStream) - The AudioStream instance  
**See**: EventType.END  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | The callback to be executed |

<a name="AudioStream+onError"></a>

### audioStream.onError(callback) ⇒ [<code>AudioStream</code>](#AudioStream)
Adds a listener for the error event.

**Kind**: instance method of [<code>AudioStream</code>](#AudioStream)  
**Returns**: [<code>AudioStream</code>](#AudioStream) - The AudioStream instance  
**See**: EventType.ERROR  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | The callback to be executed |


