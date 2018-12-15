btoa
===

Uses `Buffer` to emulate the exact functionality of the browser's btoa (except that it supports unicode and the browser may not).

It turns **b**inary data **to** base64-encoded **a**scii.

    (function () {
      "use strict";
      
      var btoa = require('btoa')
        , bin = "Hello, 世界"
        , b64 = btoa(bin)
        ;

      console.log(b64); // "SGVsbG8sIBZM"
    }());

Note: Unicode may or may not be handled incorrectly.
