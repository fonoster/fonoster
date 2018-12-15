## Ax: Simple Logging Servce

Ax provides a very simple multi-level logging interface.

    var Ax = require("ax");
    var logger = new Ax({level: "debug" });

    logger.info("Greetings, Professor Falken.");
    logger.warn("Warning, Will Robinson!");
    logger.error("If I may say so, sir, I noticed earlier the hyperdrive" +
      " motivator has been damaged. It's impossible to go to lightspeed.");
    logger.debug("Instruments register only those things they're designed to" +
      " register. Space still contains infinite unknowns.");

You can also pass a `file` option to log to a file instead of `stdout` and `stderr`.

# License

(The MIT License)

Copyright (c) 2012 Dan Yoder
Portions Copyright (c) 2011 Border Stylo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
