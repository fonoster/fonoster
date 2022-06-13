// package: fonoster.limiter.v1beta1
// file: limiter.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class CheckAuthorizedRequest extends jspb.Message { 
    getEndpoint(): string;
    setEndpoint(value: string): CheckAuthorizedRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckAuthorizedRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CheckAuthorizedRequest): CheckAuthorizedRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckAuthorizedRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckAuthorizedRequest;
    static deserializeBinaryFromReader(message: CheckAuthorizedRequest, reader: jspb.BinaryReader): CheckAuthorizedRequest;
}

export namespace CheckAuthorizedRequest {
    export type AsObject = {
        endpoint: string,
    }
}

export class CheckAuthorizedResponse extends jspb.Message { 
    getAuthorized(): boolean;
    setAuthorized(value: boolean): CheckAuthorizedResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckAuthorizedResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CheckAuthorizedResponse): CheckAuthorizedResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckAuthorizedResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckAuthorizedResponse;
    static deserializeBinaryFromReader(message: CheckAuthorizedResponse, reader: jspb.BinaryReader): CheckAuthorizedResponse;
}

export namespace CheckAuthorizedResponse {
    export type AsObject = {
        authorized: boolean,
    }
}
