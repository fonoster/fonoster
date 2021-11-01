// package: fonoster.common.v1beta1
// file: common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";

export class Empty extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Empty.AsObject;
    static toObject(includeInstance: boolean, msg: Empty): Empty.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Empty, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Empty;
    static deserializeBinaryFromReader(message: Empty, reader: jspb.BinaryReader): Empty;
}

export namespace Empty {
    export type AsObject = {
    }
}

export class ErrorResponse extends jspb.Message { 
    getStatus(): number;
    setStatus(value: number): ErrorResponse;
    getMessage(): string;
    setMessage(value: string): ErrorResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ErrorResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ErrorResponse): ErrorResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ErrorResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ErrorResponse;
    static deserializeBinaryFromReader(message: ErrorResponse, reader: jspb.BinaryReader): ErrorResponse;
}

export namespace ErrorResponse {
    export type AsObject = {
        status: number,
        message: string,
    }
}

export enum View {
    BASIC = 0,
    STANDARD = 1,
    FULL = 2,
}
