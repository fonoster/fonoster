// source: protoc-gen-openapiv2/options/annotations.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

var google_protobuf_descriptor_pb = require('google-protobuf/google/protobuf/descriptor_pb.js');
goog.object.extend(proto, google_protobuf_descriptor_pb);
var protoc$gen$openapiv2_options_openapiv2_pb = require('../../protoc-gen-openapiv2/options/openapiv2_pb.js');
goog.object.extend(proto, protoc$gen$openapiv2_options_openapiv2_pb);
goog.exportSymbol('proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Field', null, global);
goog.exportSymbol('proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Operation', null, global);
goog.exportSymbol('proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Schema', null, global);
goog.exportSymbol('proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Swagger', null, global);
goog.exportSymbol('proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Tag', null, global);

/**
 * A tuple of {field number, class constructor} for the extension
 * field named `openapiv2Swagger`.
 * @type {!jspb.ExtensionFieldInfo<!proto.grpc.gateway.protoc_gen_openapiv2.options.Swagger>}
 */
proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Swagger = new jspb.ExtensionFieldInfo(
    1042,
    {openapiv2Swagger: 0},
    protoc$gen$openapiv2_options_openapiv2_pb.Swagger,
     /** @type {?function((boolean|undefined),!jspb.Message=): !Object} */ (
         protoc$gen$openapiv2_options_openapiv2_pb.Swagger.toObject),
    0);

google_protobuf_descriptor_pb.FileOptions.extensionsBinary[1042] = new jspb.ExtensionFieldBinaryInfo(
    proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Swagger,
    jspb.BinaryReader.prototype.readMessage,
    jspb.BinaryWriter.prototype.writeMessage,
    protoc$gen$openapiv2_options_openapiv2_pb.Swagger.serializeBinaryToWriter,
    protoc$gen$openapiv2_options_openapiv2_pb.Swagger.deserializeBinaryFromReader,
    false);
// This registers the extension field with the extended class, so that
// toObject() will function correctly.
google_protobuf_descriptor_pb.FileOptions.extensions[1042] = proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Swagger;


/**
 * A tuple of {field number, class constructor} for the extension
 * field named `openapiv2Operation`.
 * @type {!jspb.ExtensionFieldInfo<!proto.grpc.gateway.protoc_gen_openapiv2.options.Operation>}
 */
proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Operation = new jspb.ExtensionFieldInfo(
    1042,
    {openapiv2Operation: 0},
    protoc$gen$openapiv2_options_openapiv2_pb.Operation,
     /** @type {?function((boolean|undefined),!jspb.Message=): !Object} */ (
         protoc$gen$openapiv2_options_openapiv2_pb.Operation.toObject),
    0);

google_protobuf_descriptor_pb.MethodOptions.extensionsBinary[1042] = new jspb.ExtensionFieldBinaryInfo(
    proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Operation,
    jspb.BinaryReader.prototype.readMessage,
    jspb.BinaryWriter.prototype.writeMessage,
    protoc$gen$openapiv2_options_openapiv2_pb.Operation.serializeBinaryToWriter,
    protoc$gen$openapiv2_options_openapiv2_pb.Operation.deserializeBinaryFromReader,
    false);
// This registers the extension field with the extended class, so that
// toObject() will function correctly.
google_protobuf_descriptor_pb.MethodOptions.extensions[1042] = proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Operation;


/**
 * A tuple of {field number, class constructor} for the extension
 * field named `openapiv2Schema`.
 * @type {!jspb.ExtensionFieldInfo<!proto.grpc.gateway.protoc_gen_openapiv2.options.Schema>}
 */
proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Schema = new jspb.ExtensionFieldInfo(
    1042,
    {openapiv2Schema: 0},
    protoc$gen$openapiv2_options_openapiv2_pb.Schema,
     /** @type {?function((boolean|undefined),!jspb.Message=): !Object} */ (
         protoc$gen$openapiv2_options_openapiv2_pb.Schema.toObject),
    0);

google_protobuf_descriptor_pb.MessageOptions.extensionsBinary[1042] = new jspb.ExtensionFieldBinaryInfo(
    proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Schema,
    jspb.BinaryReader.prototype.readMessage,
    jspb.BinaryWriter.prototype.writeMessage,
    protoc$gen$openapiv2_options_openapiv2_pb.Schema.serializeBinaryToWriter,
    protoc$gen$openapiv2_options_openapiv2_pb.Schema.deserializeBinaryFromReader,
    false);
// This registers the extension field with the extended class, so that
// toObject() will function correctly.
google_protobuf_descriptor_pb.MessageOptions.extensions[1042] = proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Schema;


/**
 * A tuple of {field number, class constructor} for the extension
 * field named `openapiv2Tag`.
 * @type {!jspb.ExtensionFieldInfo<!proto.grpc.gateway.protoc_gen_openapiv2.options.Tag>}
 */
proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Tag = new jspb.ExtensionFieldInfo(
    1042,
    {openapiv2Tag: 0},
    protoc$gen$openapiv2_options_openapiv2_pb.Tag,
     /** @type {?function((boolean|undefined),!jspb.Message=): !Object} */ (
         protoc$gen$openapiv2_options_openapiv2_pb.Tag.toObject),
    0);

google_protobuf_descriptor_pb.ServiceOptions.extensionsBinary[1042] = new jspb.ExtensionFieldBinaryInfo(
    proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Tag,
    jspb.BinaryReader.prototype.readMessage,
    jspb.BinaryWriter.prototype.writeMessage,
    protoc$gen$openapiv2_options_openapiv2_pb.Tag.serializeBinaryToWriter,
    protoc$gen$openapiv2_options_openapiv2_pb.Tag.deserializeBinaryFromReader,
    false);
// This registers the extension field with the extended class, so that
// toObject() will function correctly.
google_protobuf_descriptor_pb.ServiceOptions.extensions[1042] = proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Tag;


/**
 * A tuple of {field number, class constructor} for the extension
 * field named `openapiv2Field`.
 * @type {!jspb.ExtensionFieldInfo<!proto.grpc.gateway.protoc_gen_openapiv2.options.JSONSchema>}
 */
proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Field = new jspb.ExtensionFieldInfo(
    1042,
    {openapiv2Field: 0},
    protoc$gen$openapiv2_options_openapiv2_pb.JSONSchema,
     /** @type {?function((boolean|undefined),!jspb.Message=): !Object} */ (
         protoc$gen$openapiv2_options_openapiv2_pb.JSONSchema.toObject),
    0);

google_protobuf_descriptor_pb.FieldOptions.extensionsBinary[1042] = new jspb.ExtensionFieldBinaryInfo(
    proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Field,
    jspb.BinaryReader.prototype.readMessage,
    jspb.BinaryWriter.prototype.writeMessage,
    protoc$gen$openapiv2_options_openapiv2_pb.JSONSchema.serializeBinaryToWriter,
    protoc$gen$openapiv2_options_openapiv2_pb.JSONSchema.deserializeBinaryFromReader,
    false);
// This registers the extension field with the extended class, so that
// toObject() will function correctly.
google_protobuf_descriptor_pb.FieldOptions.extensions[1042] = proto.grpc.gateway.protoc_gen_openapiv2.options.openapiv2Field;

goog.object.extend(exports, proto.grpc.gateway.protoc_gen_openapiv2.options);
