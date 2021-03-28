// package: fonos.common.v1alpha1
// file: common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class Response extends jspb.Message {
  getStatus(): Response.Status;
  setStatus(value: Response.Status): Response;

  getMessage(): string;
  setMessage(value: string): Response;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Response.AsObject;
  static toObject(includeInstance: boolean, msg: Response): Response.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Response,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Response;
  static deserializeBinaryFromReader(
    message: Response,
    reader: jspb.BinaryReader
  ): Response;
}

export namespace Response {
  export type AsObject = {
    status: Response.Status;
    message: string;
  };

  export enum Status {
    OK = 0,
    CREATED = 1,
    BAD_REQUEST = 2,
    UNAUTHORIZED = 3,
    NOT_FOUND = 4,
    NOT_SUPPORTED = 5,
    UNPROCESSABLE_ENTITY = 6,
    UNFULFILLED_DEPENDENCY_RESPONSE = 7,
    FOUND_DEPENDENT_OBJECTS_RESPONSE = 8,
    ENTITY_ALREADY_EXIST_RESPONSE = 9,
    INTERNAL_SERVER_ERROR = 10
  }
}

export class Error extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Error.AsObject;
  static toObject(includeInstance: boolean, msg: Error): Error.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Error,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Error;
  static deserializeBinaryFromReader(
    message: Error,
    reader: jspb.BinaryReader
  ): Error;
}

export namespace Error {
  export type AsObject = {};
}

export class Empty extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Empty.AsObject;
  static toObject(includeInstance: boolean, msg: Empty): Empty.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Empty,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Empty;
  static deserializeBinaryFromReader(
    message: Empty,
    reader: jspb.BinaryReader
  ): Empty;
}

export namespace Empty {
  export type AsObject = {};
}

export enum View {
  BASIC = 0,
  STANDARD = 1,
  FULL = 2
}
