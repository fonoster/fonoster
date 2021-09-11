// package: fonos.secrets.v1beta1
// file: secrets.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_pb from "./common_pb";

export class ListSecretIdRequest extends jspb.Message { 
    getPageSize(): number;
    setPageSize(value: number): ListSecretIdRequest;
    getPageToken(): string;
    setPageToken(value: string): ListSecretIdRequest;
    getView(): common_pb.View;
    setView(value: common_pb.View): ListSecretIdRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSecretIdRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListSecretIdRequest): ListSecretIdRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSecretIdRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSecretIdRequest;
    static deserializeBinaryFromReader(message: ListSecretIdRequest, reader: jspb.BinaryReader): ListSecretIdRequest;
}

export namespace ListSecretIdRequest {
    export type AsObject = {
        pageSize: number,
        pageToken: string,
        view: common_pb.View,
    }
}

export class ListSecretIdResponse extends jspb.Message { 
    clearSecretsList(): void;
    getSecretsList(): Array<SecretName>;
    setSecretsList(value: Array<SecretName>): ListSecretIdResponse;
    addSecrets(value?: SecretName, index?: number): SecretName;
    getNextPageToken(): string;
    setNextPageToken(value: string): ListSecretIdResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSecretIdResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListSecretIdResponse): ListSecretIdResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSecretIdResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSecretIdResponse;
    static deserializeBinaryFromReader(message: ListSecretIdResponse, reader: jspb.BinaryReader): ListSecretIdResponse;
}

export namespace ListSecretIdResponse {
    export type AsObject = {
        secretsList: Array<SecretName.AsObject>,
        nextPageToken: string,
    }
}

export class GetSecretRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): GetSecretRequest;
    getView(): common_pb.View;
    setView(value: common_pb.View): GetSecretRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetSecretRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetSecretRequest): GetSecretRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetSecretRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetSecretRequest;
    static deserializeBinaryFromReader(message: GetSecretRequest, reader: jspb.BinaryReader): GetSecretRequest;
}

export namespace GetSecretRequest {
    export type AsObject = {
        name: string,
        view: common_pb.View,
    }
}

export class GetSecretResponse extends jspb.Message { 
    getName(): string;
    setName(value: string): GetSecretResponse;
    getSecret(): string;
    setSecret(value: string): GetSecretResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetSecretResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetSecretResponse): GetSecretResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetSecretResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetSecretResponse;
    static deserializeBinaryFromReader(message: GetSecretResponse, reader: jspb.BinaryReader): GetSecretResponse;
}

export namespace GetSecretResponse {
    export type AsObject = {
        name: string,
        secret: string,
    }
}

export class CreateSecretRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateSecretRequest;
    getSecret(): string;
    setSecret(value: string): CreateSecretRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateSecretRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateSecretRequest): CreateSecretRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateSecretRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateSecretRequest;
    static deserializeBinaryFromReader(message: CreateSecretRequest, reader: jspb.BinaryReader): CreateSecretRequest;
}

export namespace CreateSecretRequest {
    export type AsObject = {
        name: string,
        secret: string,
    }
}

export class CreateSecretResponse extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateSecretResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateSecretResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateSecretResponse): CreateSecretResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateSecretResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateSecretResponse;
    static deserializeBinaryFromReader(message: CreateSecretResponse, reader: jspb.BinaryReader): CreateSecretResponse;
}

export namespace CreateSecretResponse {
    export type AsObject = {
        name: string,
    }
}

export class DeleteSecretRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): DeleteSecretRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteSecretRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteSecretRequest): DeleteSecretRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteSecretRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteSecretRequest;
    static deserializeBinaryFromReader(message: DeleteSecretRequest, reader: jspb.BinaryReader): DeleteSecretRequest;
}

export namespace DeleteSecretRequest {
    export type AsObject = {
        name: string,
    }
}

export class Secret extends jspb.Message { 
    getName(): string;
    setName(value: string): Secret;
    getSecret(): string;
    setSecret(value: string): Secret;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Secret.AsObject;
    static toObject(includeInstance: boolean, msg: Secret): Secret.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Secret, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Secret;
    static deserializeBinaryFromReader(message: Secret, reader: jspb.BinaryReader): Secret;
}

export namespace Secret {
    export type AsObject = {
        name: string,
        secret: string,
    }
}

export class SecretName extends jspb.Message { 
    getName(): string;
    setName(value: string): SecretName;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecretName.AsObject;
    static toObject(includeInstance: boolean, msg: SecretName): SecretName.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecretName, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecretName;
    static deserializeBinaryFromReader(message: SecretName, reader: jspb.BinaryReader): SecretName;
}

export namespace SecretName {
    export type AsObject = {
        name: string,
    }
}
