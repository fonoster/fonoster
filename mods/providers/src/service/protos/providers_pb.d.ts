// package: fonoster.providers.v1beta1
// file: providers.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";
import * as common_pb from "./common_pb";

export class ListProvidersRequest extends jspb.Message { 
    getPageSize(): number;
    setPageSize(value: number): ListProvidersRequest;
    getPageToken(): string;
    setPageToken(value: string): ListProvidersRequest;
    getView(): common_pb.View;
    setView(value: common_pb.View): ListProvidersRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListProvidersRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListProvidersRequest): ListProvidersRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListProvidersRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListProvidersRequest;
    static deserializeBinaryFromReader(message: ListProvidersRequest, reader: jspb.BinaryReader): ListProvidersRequest;
}

export namespace ListProvidersRequest {
    export type AsObject = {
        pageSize: number,
        pageToken: string,
        view: common_pb.View,
    }
}

export class ListProvidersResponse extends jspb.Message { 
    clearProvidersList(): void;
    getProvidersList(): Array<Provider>;
    setProvidersList(value: Array<Provider>): ListProvidersResponse;
    addProviders(value?: Provider, index?: number): Provider;
    getNextPageToken(): string;
    setNextPageToken(value: string): ListProvidersResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListProvidersResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListProvidersResponse): ListProvidersResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListProvidersResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListProvidersResponse;
    static deserializeBinaryFromReader(message: ListProvidersResponse, reader: jspb.BinaryReader): ListProvidersResponse;
}

export namespace ListProvidersResponse {
    export type AsObject = {
        providersList: Array<Provider.AsObject>,
        nextPageToken: string,
    }
}

export class CreateProviderRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateProviderRequest;
    getUsername(): string;
    setUsername(value: string): CreateProviderRequest;
    getSecret(): string;
    setSecret(value: string): CreateProviderRequest;
    getHost(): string;
    setHost(value: string): CreateProviderRequest;
    getTransport(): string;
    setTransport(value: string): CreateProviderRequest;
    getExpires(): number;
    setExpires(value: number): CreateProviderRequest;
    getRegister(): boolean;
    setRegister(value: boolean): CreateProviderRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateProviderRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateProviderRequest): CreateProviderRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateProviderRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateProviderRequest;
    static deserializeBinaryFromReader(message: CreateProviderRequest, reader: jspb.BinaryReader): CreateProviderRequest;
}

export namespace CreateProviderRequest {
    export type AsObject = {
        name: string,
        username: string,
        secret: string,
        host: string,
        transport: string,
        expires: number,
        register: boolean,
    }
}

export class UpdateProviderRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): UpdateProviderRequest;
    getName(): string;
    setName(value: string): UpdateProviderRequest;
    getUsername(): string;
    setUsername(value: string): UpdateProviderRequest;
    getSecret(): string;
    setSecret(value: string): UpdateProviderRequest;
    getHost(): string;
    setHost(value: string): UpdateProviderRequest;
    getTransport(): string;
    setTransport(value: string): UpdateProviderRequest;
    getExpires(): number;
    setExpires(value: number): UpdateProviderRequest;
    getRegister(): boolean;
    setRegister(value: boolean): UpdateProviderRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateProviderRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateProviderRequest): UpdateProviderRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateProviderRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateProviderRequest;
    static deserializeBinaryFromReader(message: UpdateProviderRequest, reader: jspb.BinaryReader): UpdateProviderRequest;
}

export namespace UpdateProviderRequest {
    export type AsObject = {
        ref: string,
        name: string,
        username: string,
        secret: string,
        host: string,
        transport: string,
        expires: number,
        register: boolean,
    }
}

export class GetProviderRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): GetProviderRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetProviderRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetProviderRequest): GetProviderRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetProviderRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetProviderRequest;
    static deserializeBinaryFromReader(message: GetProviderRequest, reader: jspb.BinaryReader): GetProviderRequest;
}

export namespace GetProviderRequest {
    export type AsObject = {
        ref: string,
    }
}

export class DeleteProviderRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): DeleteProviderRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteProviderRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteProviderRequest): DeleteProviderRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteProviderRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteProviderRequest;
    static deserializeBinaryFromReader(message: DeleteProviderRequest, reader: jspb.BinaryReader): DeleteProviderRequest;
}

export namespace DeleteProviderRequest {
    export type AsObject = {
        ref: string,
    }
}

export class Provider extends jspb.Message { 
    getRef(): string;
    setRef(value: string): Provider;
    getName(): string;
    setName(value: string): Provider;
    getUsername(): string;
    setUsername(value: string): Provider;
    getSecret(): string;
    setSecret(value: string): Provider;
    getHost(): string;
    setHost(value: string): Provider;
    getTransport(): string;
    setTransport(value: string): Provider;
    getExpires(): number;
    setExpires(value: number): Provider;
    getCreateTime(): string;
    setCreateTime(value: string): Provider;
    getUpdateTime(): string;
    setUpdateTime(value: string): Provider;
    getRegister(): boolean;
    setRegister(value: boolean): Provider;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Provider.AsObject;
    static toObject(includeInstance: boolean, msg: Provider): Provider.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Provider, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Provider;
    static deserializeBinaryFromReader(message: Provider, reader: jspb.BinaryReader): Provider;
}

export namespace Provider {
    export type AsObject = {
        ref: string,
        name: string,
        username: string,
        secret: string,
        host: string,
        transport: string,
        expires: number,
        createTime: string,
        updateTime: string,
        register: boolean,
    }
}
