// package: fonoster.secrets.v1beta1
// file: secrets.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as common_pb from "./common_pb";

export class ListSecretsIdRequest extends jspb.Message { 
    getPageSize(): number;
    setPageSize(value: number): ListSecretsIdRequest;
    getPageToken(): string;
    setPageToken(value: string): ListSecretsIdRequest;
    getView(): common_pb.View;
    setView(value: common_pb.View): ListSecretsIdRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSecretsIdRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListSecretsIdRequest): ListSecretsIdRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSecretsIdRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSecretsIdRequest;
    static deserializeBinaryFromReader(message: ListSecretsIdRequest, reader: jspb.BinaryReader): ListSecretsIdRequest;
}

export namespace ListSecretsIdRequest {
    export type AsObject = {
        pageSize: number,
        pageToken: string,
        view: common_pb.View,
    }
}

export class ListSecretsIdResponse extends jspb.Message { 
    clearSecretsList(): void;
    getSecretsList(): Array<string>;
    setSecretsList(value: Array<string>): ListSecretsIdResponse;
    addSecrets(value: string, index?: number): string;
    getNextPageToken(): string;
    setNextPageToken(value: string): ListSecretsIdResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSecretsIdResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListSecretsIdResponse): ListSecretsIdResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSecretsIdResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSecretsIdResponse;
    static deserializeBinaryFromReader(message: ListSecretsIdResponse, reader: jspb.BinaryReader): ListSecretsIdResponse;
}

export namespace ListSecretsIdResponse {
    export type AsObject = {
        secretsList: Array<string>,
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
