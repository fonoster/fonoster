// source: google/api/field_behavior.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

var google_protobuf_descriptor_pb = require('google-protobuf/google/protobuf/descriptor_pb.js');
goog.object.extend(proto, google_protobuf_descriptor_pb);
goog.exportSymbol('proto.google.api.FieldBehavior', null, global);
goog.exportSymbol('proto.google.api.fieldBehaviorList', null, global);
/**
 * @enum {number}
 */
proto.google.api.FieldBehavior = {
  FIELD_BEHAVIOR_UNSPECIFIED: 0,
  OPTIONAL: 1,
  REQUIRED: 2,
  OUTPUT_ONLY: 3,
  INPUT_ONLY: 4,
  IMMUTABLE: 5,
  UNORDERED_LIST: 6,
  NON_EMPTY_DEFAULT: 7
};


/**
 * A tuple of {field number, class constructor} for the extension
 * field named `fieldBehaviorList`.
 * @type {!jspb.ExtensionFieldInfo<!Array<!proto.google.api.FieldBehavior>>}
 */
proto.google.api.fieldBehaviorList = new jspb.ExtensionFieldInfo(
    1052,
    {fieldBehaviorList: 0},
    null,
     /** @type {?function((boolean|undefined),!jspb.Message=): !Object} */ (
         null),
    1);

google_protobuf_descriptor_pb.FieldOptions.extensionsBinary[1052] = new jspb.ExtensionFieldBinaryInfo(
    proto.google.api.fieldBehaviorList,
    jspb.BinaryReader.prototype.readPackedEnum,
    jspb.BinaryWriter.prototype.writePackedEnum,
    undefined,
    undefined,
    true);
// This registers the extension field with the extended class, so that
// toObject() will function correctly.
google_protobuf_descriptor_pb.FieldOptions.extensions[1052] = proto.google.api.fieldBehaviorList;

goog.object.extend(exports, proto.google.api);
