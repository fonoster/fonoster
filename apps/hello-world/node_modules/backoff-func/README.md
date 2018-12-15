# About

A simple functional exponential backoff function invoker.

Once configured, provides a function that will eventually call the provided function using an exponential backoff algorithm.

# Usage

```JavaScript
var backoff = require('backoff-func').create({
  delay: 10, // default value
  maxDelay: 10000, // default value
  maxRetries: 10, // default value
});

var scheduled = backoff(function() {
  // your code here
});

if (!scheduled) {
  // maxRetries reached
}
```

# License

MIT

Copyright (c) 2015 Samuel Fortier-Galarneau <samuel.galarneau@gmail.com>
