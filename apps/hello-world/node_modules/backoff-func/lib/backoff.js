'use strict';

/**
 *  Given options, returns a function can that be used to eventually call a
 *  function with an exponential backoff.
 *
 *  @param {object} opts - options to configure the backoff function
 *  @param {number} opts.delay - the initial delay
 *  @param {number} opts.maxDelay - the maximum delay
 *  @param {number} opts.maxRetries - the maximum retries
 *
 *  @returns {function} func - func that accepts a function to be called
 *                             eventually
 */
module.exports.create = function(opts) {

  opts = opts || {};
  var delay = opts.delay || 10;
  var maxDelay = opts.maxDelay || 10000;
  var maxRetries = opts.maxRetries || 10;
  var retries = 0;

  /**
   *  Calls the provided function after delay and increments retries and
   *  returns true.
   *
   *  If max retries has been reached, returns false and does
   *  not schedule the provided function to be called after delay.
   *
   *  @param {function} fn - the function to call after delay
   *  @returns {boolean} scheduled - true if fn was scheduled, false otherwise
   */
  return function (fn) {
    retries += 1;

    if (retries > maxRetries) {
      return false;
    }

    setTimeout(fn, delay);

    // calculate next delay
    delay = Math.min(delay * 2, maxDelay);

    return true;
  };
};
