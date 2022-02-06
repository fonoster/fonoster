// package: fonoster.callmanager.v1beta1
// file: callmanager.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";

export class CallRequest extends jspb.Message { 
    getFrom(): string;
    setFrom(value: string): CallRequest;
    getTo(): string;
    setTo(value: string): CallRequest;
    getWebhook(): string;
    setWebhook(value: string): CallRequest;
    getIgnoreE164Validation(): boolean;
    setIgnoreE164Validation(value: boolean): CallRequest;
    getMetadata(): string;
    setMetadata(value: string): CallRequest;
    getAppRef(): string;
    setAppRef(value: string): CallRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CallRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CallRequest): CallRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CallRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CallRequest;
    static deserializeBinaryFromReader(message: CallRequest, reader: jspb.BinaryReader): CallRequest;
}

export namespace CallRequest {
    export type AsObject = {
        from: string,
        to: string,
        webhook: string,
        ignoreE164Validation: boolean,
        metadata: string,
        appRef: string,
    }
}

export class CallResponse extends jspb.Message { 
    getRef(): string;
    setRef(value: string): CallResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CallResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CallResponse): CallResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CallResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CallResponse;
    static deserializeBinaryFromReader(message: CallResponse, reader: jspb.BinaryReader): CallResponse;
}

export namespace CallResponse {
    export type AsObject = {
        ref: string,
    }
}
