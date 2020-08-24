# Call Control

> <h3 class='toc-ignore'>App Example</h3>

```javascript
loadJS("fn:http.js");

// Get fruits from json resource
$http.get('https://someurl.com/fruits.json').then(function(result) {
	var fruits = JSON.parse(result.body);
});

fruits.forEach(function(fruit) {
	say(fruit.name);
});
```

Use any combination of the _Voice Verbs_ to obtain call control. This "Verbs" were created with a principle in mind, 
that a simple problem should have an easy solution.

The following six verbs are provided for easy use:
 
* Answer
* Hangup
* Play
* Say
* Gather
* Record
* Stash

Fonoster also provides an *Http Object*, inspired in [Unirest](http://unirest.io/nodejs.html), to enable I/O via HTTP/S. A
description of the verbs and the Http Object follows.

<aside class="notice">
To see full examples go to https://github.com/fonoster/apps-examples.
</aside>

## Answer

> <h3 class="toc-ignore">Example</h3>

```javascript
wait(5); answer(); say('You waited for 5 seconds');
```

Use *Answer* to answer to a call. This verb is optional and must be use in conjunction with [autoanwser](#make-a-call)
to work properly.

This is useful in situations when you want to execute and action prior to beginning the call, for instance pre-load data 
using the [Http Object](#http).

## Hangup

> <h3 class="toc-ignore">Example</h3>

```javascript
say('Hello world');
var cnt = 3;

while(true) {
    say('The counter is equal to: ' + cnt);
    if (cnt == 0) hangup();
    cnt--;
}
```

Calls will be terminated when all instructions are completed. With the *Hangup* verb you can terminate the call anytime 
you need. 


Attribute      | Description    | Optional
-------------- | -------------- | --------------
timeout        | Time in seconds to auto-hangup| Yes

<aside class="notice">
Use timeout to establish the maximum allowed time for the call
</aside>

## Play

The *Play* verb is used to stream a pre-recorded audio.

> <h3 class="toc-ignore">Example</h3>

```javascript
// The file must be previously uploaded using the REST API.
play('tt-monkeys');
```

Attribute      | Description    | Optional
-------------- | -------------- | --------------
file           | The file must be uploaded prior to use this verb. | No
timeout        | Time in seconds to wait for the user to press the keypad. If no key is pressed an empty character will be returned. | Yes

## Say

> <h3 class="toc-ignore">Example</h3>

```javascript
// Setup the call's voice
voice('sofia');
say('Hello, I am Sofia!');

// Or pass the desired voice as parameter
say('Hola, enhorabuena!', {voice:'enrique'}); // Spanish male voice
```

The verb *Say* uses a powerful _text2speech engine_, that transform your text into beautiful voices. There are many voices 
and languages that you can choose.

The maximum text size is 4kb. Commas and periods will cause pauses, and may speak things such as abbreviations or times
differently than you expect so be sure to double check for correct pronunciation.

<aside class="notice">
The first time you call the verb Say with a given text the TTS Engine will transform it into voice. Subsequent calls 
with the verb with the same text will use a cached file, therefore, a faster result will be provided.
</aside>

*Available Voices:*

* Dieter (DE)
* Girgit (DE)
* Allison (EN)
* Lisa (EN)
* Enrique (ES)
* Laura (ES)
* Sofia (ES)
* Renee (FR)
* Kate (GB)
* Francesca (IT)

## Gather

> <h3 class="toc-ignore">Example</h3>

```javascript
var config = {timeout: 10, numDigits: 1};
var key = gather(say('Choose a number from your keypad'), config);
say('The key pressed was, ' + key);
```

Gather collects data from the user's keypad. This verb must be used in combination with _Wait_, _Say_ or _Play_. 
The possible parameters are:

Attribute      | Description    | Optional
-------------- | -------------- | --------------
function       | The function Wait, Say or Play or a character (0-9, *, #) | No
config         | Modifiers to change the verbs behavior. Default is {timeout: 4, finishOnKey: '#', numDigits: 0}. The parameter *numDigits* indicate the maximum number of digits allow for the entry. | Yes

## Record

> <h3 class="toc-ignore">Example</h3>

```javascript
var config = {
    beep: false,
    maxDuration: 3600, 
    timeout: 5,
    finishOnKey: '#'
};
var result = record(config);
stash('recordingUri', result.recordingUri);
```

The Record verb records the caller's voice. Like the other verbs, it has a default behavior that can changed using the 
modifiers. 


Attribute      | Description    | Optional
-------------- | -------------- | --------------
config         | Modifiers to change the verbs behavior. Default is {beep: true; timeout: 5, finishOnKey: '1234567890*#', maxDuration: 3600}. The parameter *maxDuration* indicate the maximum time for the record. | No

## Stash

> <h3 class="toc-ignore">Example</h3>

```javascript
var t = new Date();
stash('time', t);
say('Adios!', {voice: 'enrique'});
```

Use stash to store variables as metadata with the call-record. Stashed data can later be retrieved as part of the CDR. This feature is particularly interesting for analytics. 

Attribute      | Description          | Optional
-------------- | -------------------- | --------------
name           | Name of the variable | No
value          | Value to store | No

## Wait

> <h3 class="toc-ignore">Example</h3>

```javascript
say('Please wait')
wait(10)
say('Thanks for waiting');
```

Plays silence for the given time.

Attribute      | Description    | Optional
-------------- | -------------- | --------------
duration       |Time in second for the duration of the silence | No

## Http

> <h3 class='toc-ignore'>Basic Example</h3>

```javascript
loadJS("fn:http.js");

$http.get('https://someurl.com/some.json')
then(function(result) {
    var list = result.body
})
```

> <h3 class='toc-ignore'>Change the content type to text. (default is JSON)</h3>

```javascript
loadJS("fn:http.js");

$http.get('https://someurl.com/some.txt')
.header('content', 'text') 
.then(function(result) {
    var txt = result.body
})
```

> <h3 class='toc-ignore'>Example using POST</h3>

```javascript
loadJS("fn:http.js");

$http.post('https://someurl.com/users')
.field('id', '1234') 
.field('name', 'Enrique Ricardo') 
.then(function(result) {
    stash('code', result.code);
})
```

> <h3 class='toc-ignore'>BasicAuthentication Example</h3>

```javascript
loadJS("fn:http.js");

$http.post('https://someurl.com/users')
.basicAuth('username', 'pass')
.queryString('gender', 'MALE')
.then(function(result) {
    var users = result.body;
    users.forEach(function(user) {
        say(user.firstName);
    });
})
```

The *Http Object* is inspired in [Unirest](http://unirest.io/nodejs.html) and is available for you to send and retrieve data 
via HTTP/S. 

Initiate the call by invoking the appropriate method(_get_, _put_, _post_, _delete_, _head_), use a modifier if need, then call _.then()_ to send the request. 
Results will be provided via a Callback.

*The available HTTP methods are:*

* GET 
* POST
* PUT
* DELETE
* HEAD

You may stack as many modifiers as needed just keep in mind  that a method, whichever you choose, must be call before any 
modifier. Also, every call will produce a result in the form of {code:'Some HTTP Code', body: 'Some content'}.
