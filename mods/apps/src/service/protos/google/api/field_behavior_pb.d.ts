// package: google.api
// file: google/api/field_behavior.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_descriptor_pb from "google-protobuf/google/protobuf/descriptor_pb";

export const fieldBehavior: jspb.ExtensionFieldInfo<FieldBehavior>;

export enum FieldBehavior {
    FIELD_BEHAVIOR_UNSPECIFIED = 0,
    OPTIONAL = 1,
    REQUIRED = 2,
    OUTPUT_ONLY = 3,
    INPUT_ONLY = 4,
    IMMUTABLE = 5,
    UNORDERED_LIST = 6,
    NON_EMPTY_DEFAULT = 7,
}
