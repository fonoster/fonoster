// package: fonos.auth.v1alpha1
// file: auth.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class GetRoleRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): GetRoleRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetRoleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetRoleRequest): GetRoleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetRoleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetRoleRequest;
    static deserializeBinaryFromReader(message: GetRoleRequest, reader: jspb.BinaryReader): GetRoleRequest;
}

export namespace GetRoleRequest {
    export type AsObject = {
        name: string,
    }
}

export class Role extends jspb.Message { 
    getName(): string;
    setName(value: string): Role;
    getDescription(): string;
    setDescription(value: string): Role;
    clearAccessList(): void;
    getAccessList(): Array<string>;
    setAccessList(value: Array<string>): Role;
    addAccess(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Role.AsObject;
    static toObject(includeInstance: boolean, msg: Role): Role.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Role, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Role;
    static deserializeBinaryFromReader(message: Role, reader: jspb.BinaryReader): Role;
}

export namespace Role {
    export type AsObject = {
        name: string,
        description: string,
        accessList: Array<string>,
    }
}

export class ValidateTokenRequest extends jspb.Message { 
    getToken(): string;
    setToken(value: string): ValidateTokenRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ValidateTokenRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ValidateTokenRequest): ValidateTokenRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ValidateTokenRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ValidateTokenRequest;
    static deserializeBinaryFromReader(message: ValidateTokenRequest, reader: jspb.BinaryReader): ValidateTokenRequest;
}

export namespace ValidateTokenRequest {
    export type AsObject = {
        token: string,
    }
}

export class ValidateTokenResponse extends jspb.Message { 
    getValid(): boolean;
    setValid(value: boolean): ValidateTokenResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ValidateTokenResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ValidateTokenResponse): ValidateTokenResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ValidateTokenResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ValidateTokenResponse;
    static deserializeBinaryFromReader(message: ValidateTokenResponse, reader: jspb.BinaryReader): ValidateTokenResponse;
}

export namespace ValidateTokenResponse {
    export type AsObject = {
        valid: boolean,
    }
}

export class CreateTokenRequest extends jspb.Message { 
    getRoleName(): string;
    setRoleName(value: string): CreateTokenRequest;
    getAccessKeyId(): string;
    setAccessKeyId(value: string): CreateTokenRequest;
    getExpiration(): number;
    setExpiration(value: number): CreateTokenRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateTokenRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateTokenRequest): CreateTokenRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateTokenRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateTokenRequest;
    static deserializeBinaryFromReader(message: CreateTokenRequest, reader: jspb.BinaryReader): CreateTokenRequest;
}

export namespace CreateTokenRequest {
    export type AsObject = {
        roleName: string,
        accessKeyId: string,
        expiration: number,
    }
}

export class CreateTokenResponse extends jspb.Message { 
    getToken(): string;
    setToken(value: string): CreateTokenResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateTokenResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateTokenResponse): CreateTokenResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateTokenResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateTokenResponse;
    static deserializeBinaryFromReader(message: CreateTokenResponse, reader: jspb.BinaryReader): CreateTokenResponse;
}

export namespace CreateTokenResponse {
    export type AsObject = {
        token: string,
    }
}
