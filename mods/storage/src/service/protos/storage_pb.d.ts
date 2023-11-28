// package: fonoster.storage.v1beta1
// file: storage.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class UploadObjectRequest extends jspb.Message { 
    getBucket(): UploadObjectRequest.Bucket;
    setBucket(value: UploadObjectRequest.Bucket): UploadObjectRequest;
    getFilename(): string;
    setFilename(value: string): UploadObjectRequest;
    getChunks(): Uint8Array | string;
    getChunks_asU8(): Uint8Array;
    getChunks_asB64(): string;
    setChunks(value: Uint8Array | string): UploadObjectRequest;
    getAccessKeyId(): string;
    setAccessKeyId(value: string): UploadObjectRequest;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UploadObjectRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UploadObjectRequest): UploadObjectRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UploadObjectRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UploadObjectRequest;
    static deserializeBinaryFromReader(message: UploadObjectRequest, reader: jspb.BinaryReader): UploadObjectRequest;
}

export namespace UploadObjectRequest {
    export type AsObject = {
        bucket: UploadObjectRequest.Bucket,
        filename: string,
        chunks: Uint8Array | string,
        accessKeyId: string,

        metadataMap: Array<[string, string]>,
    }

    export enum Bucket {
    APPS = 0,
    RECORDINGS = 1,
    PUBLIC = 2,
    }

}

export class UploadObjectResponse extends jspb.Message { 
    getSize(): number;
    setSize(value: number): UploadObjectResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UploadObjectResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UploadObjectResponse): UploadObjectResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UploadObjectResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UploadObjectResponse;
    static deserializeBinaryFromReader(message: UploadObjectResponse, reader: jspb.BinaryReader): UploadObjectResponse;
}

export namespace UploadObjectResponse {
    export type AsObject = {
        size: number,
    }
}

export class GetObjectURLRequest extends jspb.Message { 
    getBucket(): GetObjectURLRequest.Bucket;
    setBucket(value: GetObjectURLRequest.Bucket): GetObjectURLRequest;
    getFilename(): string;
    setFilename(value: string): GetObjectURLRequest;
    getAccessKeyId(): string;
    setAccessKeyId(value: string): GetObjectURLRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetObjectURLRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetObjectURLRequest): GetObjectURLRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetObjectURLRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetObjectURLRequest;
    static deserializeBinaryFromReader(message: GetObjectURLRequest, reader: jspb.BinaryReader): GetObjectURLRequest;
}

export namespace GetObjectURLRequest {
    export type AsObject = {
        bucket: GetObjectURLRequest.Bucket,
        filename: string,
        accessKeyId: string,
    }

    export enum Bucket {
    APPS = 0,
    RECORDINGS = 1,
    PUBLIC = 2,
    }

}

export class GetObjectURLResponse extends jspb.Message { 
    getUrl(): string;
    setUrl(value: string): GetObjectURLResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetObjectURLResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetObjectURLResponse): GetObjectURLResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetObjectURLResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetObjectURLResponse;
    static deserializeBinaryFromReader(message: GetObjectURLResponse, reader: jspb.BinaryReader): GetObjectURLResponse;
}

export namespace GetObjectURLResponse {
    export type AsObject = {
        url: string,
    }
}
