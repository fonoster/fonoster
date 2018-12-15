#!/usr/bin/env node
/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var btoa = require('../index')
    ;

  console.log(btoa(process.argv[2]));
}());
