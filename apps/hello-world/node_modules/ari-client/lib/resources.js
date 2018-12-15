/**
 *  First class object Resources found in ARI. Properties are attached to these
 *  instances to provide instance specific callable operations.
 *
 *  @module resources
 *
 *  @copyright 2014, Digium, Inc.
 *  @license Apache License, Version 2.0
 *  @author Samuel Fortier-Galarneau <sgalarneau@digium.com>
 */

'use strict';

var util = require('util');

var _ = require('underscore');
var uuid = require('uuid');
var Promise = require('bluebird');

var _utils = require('./utils.js');

// List of known resources to instantiate as first class object
var knownTypes = [
  'Application',
  'Asterisk',
  'Channel',
  'Bridge',
  'DeviceState',
  'Endpoint',
  'LiveRecording',
  'Mailbox',
  'Playback',
  'Sound',
  'StoredRecording'
];

// Used to convert lists of resources to lists of objects
var swaggerListTypeRegex = /List\[([A-Za-z]+)\]/;

/**
 * Abstract ARI Resource.
 *
 * @class
 * @constructor
 * @param {Client} client - client instance
 * @param {string} id - resource identifier
 * @param {Object} objValues - ownProperties to be copied on the instance
 * @prop {Client} _client - ARI client instance
 * @prop {string} id - resource identifier
 */
function Resource (client, id, objValues) {
  var self = this;

  self._client = client;
  // id is optional
  if (!objValues) {
    objValues = id;
  }

  _.each(_.keys(objValues), function (key) {
    self[key] = objValues[key];
  });

  // if creation did not come from swagger, generate id
  if (!objValues) {
    self.generateId();
  }

  // if second argument is a string, use it as an id
  if (_.isString(id)) {
    self._id(id);
    self._generatedId = true;
  }
}

/**
 *  Generates a unique id for the resource.
 *
 *  @method generateId
 *  @memberof module:resources~Resource
 */
Resource.prototype.generateId = function () {
  var self = this;
  var id = uuid.v4();

  self._id(id);
  self._generatedId = true;
};

/**
 *  Attaches an event to the client.
 *
 *  @method on
 *  @memberof module:resources~Resource
 *  @param {string} event - event name
 *  @param {onCallback} callback - callback invoked on event
 */
Resource.prototype.on = function (event,
    /**
     *  @callback onCallback
     *  @memberof module:resources~Resource
     *  @param {Object} event - full event object
     *  @param {Object} instance(s) - single resource instance or object of
     *  resource instances with callable operations attached
     */
    callback) {

  var self = this;
  var id = self._id() && self._id().toString();
  var listeners = self._client._instanceListeners;

  // register event for this instance
  if (!listeners[event]) {
    listeners[event] = [];
  }

  listeners[event].push({once: false, id: id, callback: callback});
  self._client.on(util.format('%s-%s', event, id), callback);
};

/**
 *  Attaches an event to the client to be emitted once (not yet implemented).
 *
 *  @method once
 *  @memberof module:resources~Resource
 *  @param {string} event - event name
 *  @param {onceCallback} callback - callback invoked on event
 */
Resource.prototype.once = function (event,
    /**
     *  @callback onceCallback
     *  @memberof module:resources~Resource
     *  @param {Object} event - full event object
     *  @param {Object} instance(s) - single resource instance or object of
     *  resource instances with callable operations attached
     */
    callback) {

  var self = this;
  var id = self._id() && self._id().toString();
  var listeners = self._client._instanceListeners;

  // register event for this instance
  if (!listeners[event]) {
    listeners[event] = [];
  }

  listeners[event].push({once: true, id: id, callback: callback});
  self._client.once(util.format('%s-%s', event, id), callback);
};

/**
 *  Alias for on.
 *
 *  @method addListener
 *  @memberof module:resources~Resource
 *  @param {string} event - event name
 *  @param {onceCallback} callback - callback invoked on event
 */
Resource.prototype.addListener = Resource.prototype.on;

/**
 *  Unattached the given callback for the given event from this resource.
 *
 *  @method removeListener
 *  @memberof module:resources~Resource
 *  @param {string} event - event name
 *  @param {Function} callback - the callback to unattach
 */
Resource.prototype.removeListener = function (event, callback) {
  var self = this;
  var id = self._id() && self._id().toString();
  var listeners = self._client._instanceListeners;

  // unregister event for this instance
  if (listeners[event]) {
    var updatedListeners = _.filter(listeners[event], function(listener) {
      return listener.id !== id || listener.callback !== callback;
    });
    var instanceListeners = _.filter(listeners[event], function(listener) {
      return listener.id === id && listener.callback === callback;
    });
    // if multiple, remove the last listener registered
    if (instanceListeners.length) {
      Array.prototype.push.apply(updatedListeners, instanceListeners);
      updatedListeners.splice(-1);
    }

    self._client._instanceListeners[event] = updatedListeners;
    self._client.removeListener(util.format('%s-%s', event, id), callback);
  }
};

/**
 *  Unattached all callbacks for the given event from this resource.
 *
 *  @method removeAllListeners
 *  @memberof module:resources~Resource
 *  @param {string} event - event name
 */
Resource.prototype.removeAllListeners = function (event) {
  var self = this;
  var id = self._id() && self._id().toString();
  var listeners = self._client._instanceListeners;

  // unregister event for this instance
  if (listeners[event]) {
    var updatedListeners = _.filter(listeners[event], function(listener) {
      return listener.id !== id;
    });

    self._client._instanceListeners[event] = updatedListeners;
    self._client.removeAllListeners(util.format('%s-%s', event, id));
  }
};

/**
 *  Application object for application API responses.
 *
 *  @class Application
 *  @constructor
 *  @extends Resource
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to the instance
 */
function Application (client, id, objValues) {
  var self = this;
  Resource.call(self, client, id, objValues);
}

util.inherits(Application, Resource);

/**
 *  Get or set id for the application.
 *
 *  @method _id
 *  @memberof module:resources~Application
 *  @param {string} value - value to assign to the id property
 */
Application.prototype._id = function (value) {
  var self = this;
  if (value) {
    self.name = value;
  } else {
    return self.name;
  }
};

/**
 *  The name of the identifier field used when passing as parameter.
 *
 *  @member {string} _param
 *  @memberof module:resources~Application
 */
Application.prototype._param = 'applicationName';

/**
 *  The name of this resource.
 *
 *  @member {string} _resource
 *  @memberof module:resources~Application
 */
Application.prototype._resource = 'applications';

/**
 *  Asterisk object for asterisk API responses.
 *
 *  @class Asterisk
 *  @constructor
 *  @extends Resource
 *  @param {Client} client - ARI client instance
 *  @param {Object} objValues - ownProperties to copy to the instance
 */
function Asterisk (client, objValues) {
  var self = this;
  Resource.call(self, client, undefined, objValues);
}

util.inherits(Asterisk, Resource);

/**
 * The name of the identifier field used when passing as parameter.
 *
 * @member {string} _param
 * @memberof module:resources~Asterisk
 */
Asterisk.prototype._param = '';

/**
 *  The name of this resource.
 *
 *  @member {string} _resource
 *  @memberof module:resources~Asterisk
 */
Asterisk.prototype._resource = 'asterisk';

/**
 *  Bridge object for bridge API responses.
 *
 *  @class Bridge
 *  @constructor
 *  @extends Resource
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to the instance
 */
function Bridge (client, id, objValues) {
  var self = this;
  Resource.call(self, client, id, objValues);
}

util.inherits(Bridge, Resource);

/**
 *  Get or set id for the bridge.
 *
 *  @method _id
 *  @memberof module:resources~Bridge
 *  @param {string} value - value to assign to the id property
 */
Bridge.prototype._id = function (value) {
  var self = this;
  if (value) {
    self.id = value;
  } else {
    return self.id;
  }
};

/**
 *  The name of the identifier field used when passing as parameter.
 *
 *  @member {string} _param
 *  @memberof module:resources~Bridge
 */
Bridge.prototype._param = 'bridgeId';
/**
 *  The name of this resource.
 *
 *  @member {string} _resource
 *  @memberof module:resources~Bridge
 */
Bridge.prototype._resource = 'bridges';

/**
 *  Used to pass generated ids into create methods.
 *
 *  @member {Object} _createMethods
 *  @memberof module:resources~Bridge
 *  @prop {Object} create - create method config
 *  @prop {string} create.param - parameter name to be passed in
 *  @prop {Object} play - play method config
 *  @prop {string} play.param - parameter name to be passed in
 *  @prop {boolean} play.requiresInstance - whether instance is required to be
 *    passed in
 *  @prop {Object} record - record method config
 *  @prop {string} record.param - parameter name to be passed in
 *  @prop {boolean} record.requiresInstance - whether instance is required to be
 *    passed in
 */
Bridge.prototype._createMethods = {
  create: {
    param: Bridge.prototype._param
  },
  // this is not currently supported in ARI
  play: {
    param: 'playbackId',
    requiresInstance: true
  },
  record: {
    param: 'name',
    requiresInstance: true
  }
};

/**
 *  Channel object for channel API responses.
 *
 *  @class Channel
 *  @constructor
 *  @extends Resource
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to the instance
 */
function Channel (client, id, objValues) {
  var self = this;
  Resource.call(self, client, id, objValues);
}

util.inherits(Channel, Resource);

/**
 *  Get or set id for the channel.
 *
 *  @method _id
 *  @memberof module:resources~Channel
 *  @param {string} value - value to assign to the id property
 */
Channel.prototype._id = function (value) {
  var self = this;
  if (value) {
    self.id = value;
  } else {
    return self.id;
  }
};

/**
 *  The name of the identifier field used when passing as parameter.
 *
 *  @member {string} _param
 *  @memberof module:resources~Channel
 */
Channel.prototype._param = 'channelId';
/**
 *  The name of this resource.
 *
 *  @member {string} _resource
 *  @memberof module:resources~Channel
 */
Channel.prototype._resource = 'channels';

/**
 *  Used to pass generated ids into create methods.
 *
 *  @member {Object} _createMethods
 *  @memberof module:resources~Channel
 *  @prop {Object} create - create method config
 *  @prop {string} create.param - parameter name to be passed in
 *  @prop {Object} originate - originate method config
 *  @prop {string} originate.param - parameter name to be passed in
 *  @prop {Object} snoopChannel - snoopChannel method config
 *  @prop {string} snoopChannel.param - parameter name to be passed in
 *  @prop {boolean} snoopChannel.requiresInstance - whether instance is required
 *    to be passed in
 *  @prop {Object} play - play method config
 *  @prop {string} play.param - parameter name to be passed in
 *  @prop {boolean} play.requiresInstance - whether instance is required to be
 *    passed in
 *  @prop {Object} record - record method config
 *  @prop {string} record.param - parameter name to be passed in
 *  @prop {boolean} record.requiresInstance - whether instance is required to be
 *    passed in
 */
Channel.prototype._createMethods = {
  create: {
    param: Channel.prototype._param
  },
  originate: {
    param: Channel.prototype._param
  },
  snoopChannel: {
    param: 'snoopId',
    requiresInstance: true
  },
  play: {
    param: 'playbackId',
    requiresInstance: true
  },
  record: {
    param: 'name',
    requiresInstance: true
  }
};

/**
 *  DeviceState object for deviceState API responses.
 *
 *  @class DeviceState
 *  @constructor
 *  @extends Resource
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to the instance
 */
function DeviceState (client, id, objValues) {
  var self = this;
  Resource.call(self, client, id, objValues);
}

util.inherits(DeviceState, Resource);

/**
 *  Get or set id for the deviceState.
 *
 *  @method _id
 *  @memberof module:resources~DeviceState
 *  @param {string} value - value to assign to the id property
 */
DeviceState.prototype._id = function (value) {
  var self = this;
  if (value) {
    self.name = value;
  } else {
    return self.name;
  }
};

/**
 *  The name of the identifier field used when passing as parameter.
 *
 *  @member {string} _param
 *  @memberof module:resources~DeviceState
 */
DeviceState.prototype._param = 'deviceName';
/**
 *  The name of this resource.
 *
 *  @member {string} _resource
 *  @memberof module:resources~DeviceState
 */
DeviceState.prototype._resource = 'deviceStates';

/**
 *  Endpoint object for endpoint API responses.
 *
 *  @class Endpoint
 *  @constructor
 *  @extends Resource
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to the instance
 */
function Endpoint (client, id, objValues) {
  var self = this;
  Resource.call(self, client, id, objValues);
}

util.inherits(Endpoint, Resource);

/**
 *  Get or set id for the endpoint.
 *
 *  @method _id
 *  @memberof module:resources~Endpoint
 *  @param {string} value - value to assign to the id property
 */
Endpoint.prototype._id = function (value) {
  var self = this;
  // multi field id
  if (value) {
    self.technology = value.technology;
    self.resource = value.resource;
  } else {
    return {
      tech: self.technology,
      resource: self.resource,
      toString: function () {
        return util.format('%s/%s', self.technology, self.resource);
      }
    };
  }
};

/**
 *  The name of the identifier field used when passing as parameter.
 *
 *  @member {string} _param
 *  @memberof module:resources~Endpoint
 */
Endpoint.prototype._param = ['tech', 'resource'];
/**
 *  The name of this resource.
 *
 *  @member {string} _resource
 *  @memberof module:resources~Endpoint
 */
Endpoint.prototype._resource = 'endpoints';

/**
 *  LiveRecording object for liveRecording API responses.
 *
 *  @class LiveRecording
 *  @constructor
 *  @extends Resource
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to the instance
 */
function LiveRecording (client, id, objValues) {
  var self = this;
  Resource.call(self, client, id, objValues);
}

util.inherits(LiveRecording, Resource);

/**
 *  Get or set id for the liveRecording.
 *
 *  @method _id
 *  @memberof module:resources~LiveRecording
 *  @param {string} value - value to assign to the id property
 */
LiveRecording.prototype._id = function (value) {
  var self = this;
  if (value) {
    self.name = value;
  } else {
    return self.name;
  }
};

/**
 *  The name of the identifier field used when passing as parameter.
 *
 *  @member {string} _param
 *  @memberof module:resources~LiveRecording
 */
LiveRecording.prototype._param = 'recordingName';
/**
 *  The name of this resource.
 *
 *  @member {string} _resource
 *  @memberof module:resources~LiveRecording
 */
LiveRecording.prototype._resource = 'recordings';

/**
 *  Mailbox object for mailbox API responses.
 *
 *  @class Mailbox
 *  @constructor
 *  @extends Resource
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to the instance
 */
function Mailbox (client, id, objValues) {
  var self = this;
  Resource.call(self, client, id, objValues);
}

util.inherits(Mailbox, Resource);

/**
 *  Get or set id for the mailbox.
 *
 *  @method _id
 *  @memberof module:resources~Mailbox
 *  @param {string} value - value to assign to the id property
 */
Mailbox.prototype._id = function (value) {
  var self = this;
  if (value) {
    self.name = value;
  } else {
    return self.name;
  }
};

/**
 *  The name of the identifier field used when passing as parameter..
 *
 *  @member {string} _param
 *  @memberof module:resources~Mailbox
 */
Mailbox.prototype._param = 'mailboxName';
/**
 *  The name of this resource. .
 *
 *  @member {string} _resource
 *  @memberof module:resources~Mailbox
 */
Mailbox.prototype._resource = 'mailboxes';

/**
 *  Playback object for playback API responses.
 *
 *  @class Playback
 *  @constructor
 *  @extends Resource
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to the instance
 */
function Playback (client, id, objValues) {
  var self = this;
  Resource.call(self, client, id, objValues);
}

util.inherits(Playback, Resource);

/**
 *  Get or set id for the playback.
 *
 *  @method _id
 *  @memberof module:resources~Playback
 *  @param {string} value - value to assign to the id property
 */
Playback.prototype._id = function (value) {
  var self = this;
  if (value) {
    self.id = value;
  } else {
    return self.id;
  }
};

/**
 *  The name of the identifier field used when passing as parameter..
 *
 *  @member {string} _param
 *  @memberof module:resources~Playback
 */
Playback.prototype._param = 'playbackId';
/**
 *  The name of this resource.
 *
 *  @member {string} _resource
 *  @memberof module:resources~Playback
 */
Playback.prototype._resource = 'playbacks';

/**
 *  Sound object for sound API responses.
 *
 *  @class Sound
 *  @constructor
 *  @extends Resource
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to the instance
 */
function Sound (client, id, objValues) {
  var self = this;
  Resource.call(self, client, id, objValues);
}

util.inherits(Sound, Resource);

/**
 *  Get or set id for the sound.
 *
 *  @method _id
 *  @memberof module:resources~Sound
 *  @param {string} value - value to assign to the id property
 */
Sound.prototype._id = function (value) {
  var self = this;
  if (value) {
    self.id = value;
  } else {
    return self.id;
  }
};

/**
 *  The name of the identifier field used when passing as parameter.
 *
 *  @member {string} _param
 *  @memberof module:resources~Sound
 */
Sound.prototype._param = 'soundId';
/**
 *  The name of this resource.
 *
 *  @member {string} _resource
 *  @memberof module:resources~Sound
 */
Sound.prototype._resource = 'sounds';

/**
 *  StoredRecording object for storedRecording API responses.
 *
 *  @class StoredRecording
 *  @constructor
 *  @extends Resource
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to the instance
 */
function StoredRecording (client, id, objValues) {
  var self = this;
  Resource.call(self, client, id, objValues);
}

util.inherits(StoredRecording, Resource);

/**
 *  Get or set id for the storedRecording.
 *
 *  @method _id
 *  @memberof module:resources~StoredRecording
 *  @param {string} value - value to assign to the id property
 */
StoredRecording.prototype._id = function (value) {
  var self = this;
  if (value) {
    self.name = value;
  } else {
    return self.name;
  }
};

/**
 *  The name of the identifier field used when passing as parameter.
 *
 *  @member {string} _param
 *  @memberof module:resources~StoredRecording
 */
StoredRecording.prototype._param = 'recordingName';
/**
 *  The name of this resource.
 *
 *  @member {string} _resource
 *  @memberof module:resources~StoredRecording
 */
StoredRecording.prototype._resource = 'recordings';

/**
 *  Attach operations to the resource instance bound to this.
 *
 *  @method attachOperations
 *  @memberof module:resources
 *  @this module:resources~Resource
 *  @private
 */
function attachOperations () {
  /*jshint validthis:true*/
  var self = this;
  var operations = self._client._swagger.apis[self._resource].operations;

  _.each(_.keys(operations), attachOperation);

  /**
   *  Attach operation to resource instance.
   *
   *  @callback attachOperationsCallback
   *  @memberof module:resources~attachOperations
   *  @method attachOperation
   *  @private
   *  @param {string} operation - the operation to attach
   */
  function attachOperation (operation) {
    self[operation] = callSwagger;

    var oper = self._client._swagger.apis[self._resource].operations[operation];
    var respType = oper.type;
    var multi = false;
    var regexArr = swaggerListTypeRegex.exec(respType);
    if (regexArr !== null) {
      respType = regexArr[1];
      multi = true;
    }
    var params = oper.parameters;

    /**
     *  Responsible for calling API through Swagger.
     *
     *  @callback attachOperationCallback
     *  @memberof module:resources~attachOperations~attachOperation
     *  @method callSwagger
     *  @private
     *  @param {Object} parameters - parameters to swagger
     *  @param {Resource} [createInstance] - instance to get identifier from for
     *    purposes of creating the resource through ARI
     *  @param {Function} callback - callback invoked with swagger response
     */
    function callSwagger (/* args..., callback */) {

      // Separate user callback from other args and inject object id(s)
      // if appropriate
      var args = _.toArray(arguments);
      var options = _.first(args);
      var createInstance = args[1];
      var userCallback = (_.isFunction(_.last(args))) ? _.last(args)
                                                        : undefined;

      return new Promise(function(resolve, reject) {

        args = [];

        if (options === undefined || options === null ||
            _.isFunction(options) || _.isArray(options)) {
          options = {};
        } else {
          // Swagger can alter options passed in
          options = _.clone(options);
          // convert body params for swagger
          options = _utils.parseBodyParams(params, options);
        }

        _.each(params, function (param) {
          var expectedParam = param.name;
          var actualParam = self._param;

          if (_.isArray(actualParam)) {
            actualParam = _.find(actualParam, function (candidate) {
              return candidate === expectedParam;
            });
          }

          // Inject parameter using instance value
          if (expectedParam === actualParam && param.required) {
            var identifier = self._id() || '';
            // In case of multi ids
            options[expectedParam] =
              identifier[expectedParam] || identifier;
          }
        });

        // Inject create method parameters if instance has client
        // generated id.
        if (_.contains(_.keys(self._createMethods), operation)) {
          var createMethod = self._createMethods[operation];
          if (createMethod.requiresInstance) {
            // Extract parameter from instance parameter
            if (createInstance instanceof Resource &&
                createInstance._generatedId) {

              options[createMethod.param] = createInstance._id();
            }
          } else if (self._generatedId) {
            options[createMethod.param] = self._id();
          }
        }

        args.push(options);
        // Inject response processing callback
        args.push(processResponse);
        // Inject error handling callback
        args.push(swaggerError);

        // Run operation against swagger
        self._client._swagger.apis[self._resource][operation].apply(
          null,
          args
        );

        /**
         *  Handle error from Swagger.
         *
         *  @callback callSwaggerErrorCallback
         *  @method swaggerError
         *  @memberof
         *    module:resources~attachOperations~attachOperation~callSwagger
         *  @private
         *  @param {Error} err - error object
         */
        function swaggerError (err) {
          if (err && err.data) {
            err = new Error(err.data.toString('utf-8'));
          }

          reject(err);
        }

        /**
         *  Process response from Swagger.
         *
         *  @callback callSwaggerSuccessCallback
         *  @method processResponse
         *  @memberof
         *    module:resources~attachOperations~attachOperation~callSwagger
         *  @private
         *  @param {Object} response - response from swagger
         */
        function processResponse (response) {
          var result = response.data.toString('utf-8');
          if (respType !== null && result) {
            result = JSON.parse(result);
          }

          if (_.contains(knownTypes, respType) &&
              module.exports[respType] !== undefined) {

            if (multi) {
              result = _.map(result, function (obj) {
                return module.exports[respType](
                  self._client,
                  obj
                );
              });
            } else {
              result = module.exports[respType](
                self._client,
                result
              );
            }
          }

          resolve(result);
        }
      }).asCallback(userCallback);
    }
  }
}

/**
 *  The known resource types.
 *
 *  @member {string[]} knownTypes
 *  @memberof module:resources
 */
module.exports.knownTypes = knownTypes;

/**
 *  Regex used to determine if return type is a list of a known resource type.
 *
 *  @member {Regex} swaggerListTypeRegex
 *  @memberof module:resources
 */
module.exports.swaggerListTypeRegex = swaggerListTypeRegex;

/**
 *  Creates a new Application instance.
 *
 *  @memberof module:resources
 *  @method Application
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to instance
 *  @returns {module:resources~Application} application
 */
module.exports.Application = function (client, id, objValues) {
  var application = new Application(client, id, objValues);
  attachOperations.call(application);
  return application;
};

/**
 * Creates a new Asterisk resource.
 *
 * @memberof module:resources
 * @method Asterisk
 * @param {Client} client - ARI client instance
 * @param {Object} objValues - ownProperties to copy to instance
 * @returns {module:resources~Asterisk} asterisk resource
 */
module.exports.Asterisk = function (client, objValues) {
  var asterisk = new Asterisk(client, objValues);
  attachOperations.call(asterisk);
  return asterisk;
};

/**
 *  Creates a new Bridge instance.
 *
 *  @memberof module:resources
 *  @method Bridge
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to instance
 *  @returns {module:resources~Bridge} bridge
 */
module.exports.Bridge = function (client, id, objValues) {
  var bridge = new Bridge(client, id, objValues);
  attachOperations.call(bridge);
  return bridge;
};

/**
 *  Creates a new Channel instance.
 *
 *  @memberof module:resources
 *  @method Channel
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to instance
 *  @returns {module:resources~Channel} channel
 */
module.exports.Channel = function (client, id, objValues) {
  var channel = new Channel(client, id, objValues);
  attachOperations.call(channel);
  return channel;
};

/**
 *  Creates a new DeviceState instance.
 *
 *  @memberof module:resources
 *  @method DeviceState
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to instance
 *  @returns {module:resources~DeviceState} deviceState
 */
module.exports.DeviceState = function (client, id, objValues) {
  var deviceState = new DeviceState(client, id, objValues);
  attachOperations.call(deviceState);
  return deviceState;
};

/**
 *  Creates a new Endpoint instance.
 *
 *  @memberof module:resources
 *  @method Endpoint
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to instance
 *  @returns {module:resources~Endpoint} endpoint
 */
module.exports.Endpoint = function (client, id, objValues) {
  var endpoint = new Endpoint(client, id, objValues);
  attachOperations.call(endpoint);
  return endpoint;
};

/**
 *  Creates a new LiveRecording instance.
 *
 *  @memberof module:resources
 *  @method LiveRecording
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to instance
 *  @returns {module:resources~LiveRecording} liveRecording
 */
module.exports.LiveRecording = function (client, id, objValues) {
  var liveRecording = new LiveRecording(client, id, objValues);
  attachOperations.call(liveRecording);
  return liveRecording;
};

/**
 *  Creates a new Mailbox instance.
 *
 *  @memberof module:resources
 *  @method Mailbox
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to instance
 *  @returns {module:resources~Mailbox} mailbox
 */
module.exports.Mailbox = function (client, id, objValues) {
  var mailbox = new Mailbox(client, id, objValues);
  attachOperations.call(mailbox);
  return mailbox;
};

/**
 *  Creates a new Playback instance.
 *
 *  @memberof module:resources
 *  @method Playback
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to instance
 *  @returns {module:resources~Playback} playback
 */
module.exports.Playback = function (client, id, objValues) {
  var playback = new Playback(client, id, objValues);
  attachOperations.call(playback);
  return playback;
};

/**
 *  Creates a new Sound instance.
 *
 *  @memberof module:resources
 *  @method Sound
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to instance
 *  @returns {module:resources~Sound} sound
 */
module.exports.Sound = function (client, id, objValues) {
  var sound = new Sound(client, id, objValues);
  attachOperations.call(sound);
  return sound;
};

/**
 *  Creates a new StoredRecording instance.
 *
 *  @memberof module:resources
 *  @method StoredRecording
 *  @param {Client} client - ARI client instance
 *  @param {string} id - Application identifier
 *  @param {Object} objValues - ownProperties to copy to instance
 *  @returns {module:resources~StoredRecording} storedRecording
 */
module.exports.StoredRecording = function (client, id, objValues) {
  var storedRecording = new StoredRecording(client, id, objValues);
  attachOperations.call(storedRecording);
  return storedRecording;
};
