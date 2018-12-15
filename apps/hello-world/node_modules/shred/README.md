# Introduction

Shred is an HTTP client library for node.js and browsers.
Shred supports gzip, cookies, https, proxies, and redirects.

# Installation

## Node.js

Shred can be installed through npm.

    npm install shred

## Browsers

We use [Browserify](https://github.com/substack/node-browserify) to bundle Shred and all of its dependencies in one javascript file.
Simply include the bundled version of shred in a script tag.

    <script src="browser/shred.bundle.js" />

If you want smaller downloads, use the minified version.

    <script src="browser/shred.bundle.min.js" />

# Basic Usage

First we need to require the Shred library and instantiate a new client.

Browser:

    var Shred = require("./shred");
    var shred = new Shred();

Node.js:

    var Shred = require("shred");
    var shred = new Shred();

Then we are ready to use `shred` to make HTTP requests.

## Simple GET request

Here is a simple GET request that gets some JSON data.


```javascript
var req = shred.get({
  url: "http://api.spire.io/",
  headers: {
    Accept: "application/json"
  },
  on: {
    // You can use response codes as events
    200: function(response) {
      // Shred will automatically JSON-decode response bodies that have a
      // JSON Content-Type
      console.log(response.content.data);
    },
    // Any other response means something's wrong
    response: function(response) {
      console.log("Oh no!");
    }
  }
});
```

## Response Handling

Shred uses HTTP status codes as event names.
The above example has a handler for when the response comes back with status 200, and a catch-all "request" handler for all other cases.

You can also add listeners to the "success" event, the "error" event, and the most generic "response" event.
Shred makes sure that only the most specific event handler gets called for a response.

## JSON Decoding

Shred will automatically decode JSON bodies if the response headers' Content-Type identifies it as JSON.
Thus, we are able to get the to the decoded object with `response.content.data`.
The original string representation is still available to us, in `response.content.body`.

Here is a POST to an accounts resource.
Shred will automatically JSON-encode the POST body.
We have handlers for the 201 "Created" status, 409 "Conflict" status, and a catch-all "response" handler.

## Simple POST request

```javascript
var req = shred.post({
  url: "http://localhost:8080/accounts",
  headers: {
    Content-Type: "application/json"
  },
  // Shred will JSON-encode PUT/POST bodies
  content: { username: "fred", email: "fred@flinstone.com" },
  on: {
    // you can use response codes as events
    201: function(response) {
      console.log("User Created");
    },
    409: function (response) {
      console.log("User with that name already exists.");
    },
    response: function(response) {
      // We got a 40X that is not a 409, or a 50X
      console.log("Oh no, something went wrong!");
    }
  }
});
```

You can pass listeners directly into the shred request call, as in the above examples, or add listeners to the request with the `on` method:

```javascript
req.on({
  404: function(response) {
    console.log("Not Found");
  },
  500: function(response) {
    console.log("Server Error, please try again later.");
  }
});
```

You can also chain the events with 'on', if that's your style.

```javascript
req.on(
  404,
  function(response) {
    console.log("Not Found");
}).on(500 function(response) {
    console.log("Server Error, please try again later.");
});
```

See [the wiki](https://github.com/automatthew/shred/wiki) for more examples.

Also, we wrote [a blog post][blog] on why we wrote Shred instead of going with existing libraries.

# Interface

Shred has 4 methods: `shred.get`, `shred.put`, `shred.delete`, and `shred.post`.

## Request Options

* `url`: url to make the request to
* `headers`: hash of headers to send with the request
* `port`: port to send the request to
* `query`: hash or string to send as the query parameters
* `content`: data to send in the body of the request (also aliased to `body`)
* `timeout`: length of time in ms (or a date structure with hours/minutes/seconds/millis) to wait before killing the connection
* `proxy`: url of http proxy to use

## Even more examples!

### timeouts

```javascript
var req = shred.get({
  url: "http://api.spire.io/",
  timeout: 1000, // time out in just 1 second
  on: {
    response: function(response) {
      console.log(response.content.data);
    },
    // let's watch for a timeout
    timeout: function( request ) {
      // note: we get the request here, not the response (since there was no response, silly!)
      console.log( 'Ooops, we timed out!' );
    }
  }
});

// or we can pass an object with values like 'minutes', 'seconds' and 'milliseconds'
var req = shred.get({
  url: "http://api.spire.io/",
  timeout: { minutes: 1, seconds: 30 }, // time out in 1 minute and 30 seconds
  on: {
    response: function(response) {
      console.log(response.content.data);
    },
    // let's watch for a timeout
    timeout: function( request ) {
      console.log( 'Ooops, we timed out!' );
    }
  }
});

```

## Events

Shred will fire an event with the status code of the response, if that event has any listeners.
If the status code has no listeners, Shred will fire the "success" event or the "error" event, depending on whether the http response is a success (2XX) or error (4XX and 5XX).
If the success/error event has no listeners, Shred will fire the most generic "response" event.

Shred will also emit a "request_error" event if the request errors out before a response comes back.

## Response

The response is passed as the only argument to the event listeners.
It has the following properties.

* `response.status`: status code of the response
* `response.isError`: true iff the status code is >= 400
* `response.content.body`: string representation of the response body
* `response.content.data`: javascript object for the response body (if the Content-Type is JSON)

# Curl Logging

Shred can log all of the requests it makes as [curl][curl] commands.
You can use this to make requests from the command line with curl.

To enable this logging, set the `logCurl` option when initializing Shred.

    var shred = new Shred({ logCurl: true });

Here is sample output from a shred request:

    curl -X GET http://localhost:1337 -H "Accept: application/json" 


# Feedback

Feedback is highly encouraged in the form of [tickets][tickets] or pull requests. Thank you!

# Code

[Browse the annotated source.][docs]

We'd love your contributions - don't hesitate to send us pull requests. We'll also happily add you as a committer after we've accepted it.

# Tests

You can run the tests in node with

    cake test

There is currently no way to run the tests in the browser (coming soon...)


# License

Shred is MIT licensed.

# Authors

Shred is based on code originally written by Matthew King.
That code was adapted and converted into a separate Node.js library by Dan Yoder, Jason Campbell, Nick LaCasse, and Vicent Piquer Suria.

Current maintainers:  [Dan Yoder][yoder], [Matthew King][king]

[code]: https://github.com/automatthew/shred
[tickets]: https://github.com/automatthew/shred/issues
[license]: https://github.com/automatthew/shred/blob/master/LICENSE
[yoder]: mailto:daniel.yoder@gmail.com
[king]: mailto:automatthew@gmail.com
[curl]: http://curl.haxx.se/
[blog]: http://webcache.googleusercontent.com/search?q=cache:6RFaj1yLIZEJ:www.spire.io/posts/introducing-shred.html+http://www.spire.io/posts/introducing-shred.html&cd=1&hl=en&ct=clnk&gl=us
