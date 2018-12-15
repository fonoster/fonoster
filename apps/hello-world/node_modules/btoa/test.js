/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var btoa = require('./index')
    , encoded = "SGVsbG8sIBZM"
    , unencoded = "Hello, 世界"
    ;

  if (encoded !== btoa(unencoded)) {
    console.error('[FAIL]', encoded, btoa(unencoded));
    return;
  }

  console.log('[PASS] all tests pass');
}());
