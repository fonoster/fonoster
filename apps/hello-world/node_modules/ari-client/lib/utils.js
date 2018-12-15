/**
 *  Utility functions for ari-client.
 *
 *  @module utils
 *
 *  @copyright 2014, Digium, Inc.
 *  @license Apache License, Version 2.0
 *  @author Samuel Fortier-Galarneau <sgalarneau@digium.com>
 */

'use strict';

var _ = require('underscore');

/**
 *  Modifies options to swagger as body params as appropriate using the given
 *  defined operation parameters.
 *
 *  @memberof module:utils
 *  @method parseBodyParams
 *  @param {Object[]} params - defined operation parameters
 *  @param {Object} swaggerOptions - options that will be sent to a swagger
 *    operation
 *  @returns {Object} modified options
 */
function parseBodyParams(params, swaggerOptions) {
  var options = _.clone(swaggerOptions);
  var bodyParams = params.filter(function(param) {
    return param.paramType === 'body';
  });

  bodyParams.forEach(function(bodyParam) {
    var jsonBody = options[bodyParam.name];
    if (jsonBody) {
      // variables behaves differently in that it expects a variables key to
      // wrap the key/value pairs
      if (bodyParam.name === 'variables' && !options.variables.variables) {
        jsonBody = {variables: jsonBody};
      } else if (bodyParam.name === 'fields' && !options.fields.fields) {
        jsonBody = {fields: jsonBody};
      }
      options.body = JSON.stringify(jsonBody);
      delete options[bodyParam.name];
    }
  });

  return options;
}

module.exports.parseBodyParams = parseBodyParams;
