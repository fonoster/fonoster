// package: fonoster.users.v1beta1
// file: users.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";
import * as common_pb from "./common_pb";

export class ListUsersRequest extends jspb.Message { 

    getFiltersMap(): jspb.Map<string, string>;
    clearFiltersMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListUsersRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListUsersRequest): ListUsersRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListUsersRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListUsersRequest;
    static deserializeBinaryFromReader(message: ListUsersRequest, reader: jspb.BinaryReader): ListUsersRequest;
}

export namespace ListUsersRequest {
    export type AsObject = {

        filtersMap: Array<[string, string]>,
    }
}

export class ListUsersResponse extends jspb.Message { 
    clearUsersList(): void;
    getUsersList(): Array<User>;
    setUsersList(value: Array<User>): ListUsersResponse;
    addUsers(value?: User, index?: number): User;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListUsersResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListUsersResponse): ListUsersResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListUsersResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListUsersResponse;
    static deserializeBinaryFromReader(message: ListUsersResponse, reader: jspb.BinaryReader): ListUsersResponse;
}

export namespace ListUsersResponse {
    export type AsObject = {
        usersList: Array<User.AsObject>,
    }
}

export class CreateUserCredentialsRequest extends jspb.Message { 
    getEmail(): string;
    setEmail(value: string): CreateUserCredentialsRequest;
    getSecret(): string;
    setSecret(value: string): CreateUserCredentialsRequest;
    getExpiration(): string;
    setExpiration(value: string): CreateUserCredentialsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateUserCredentialsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateUserCredentialsRequest): CreateUserCredentialsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateUserCredentialsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateUserCredentialsRequest;
    static deserializeBinaryFromReader(message: CreateUserCredentialsRequest, reader: jspb.BinaryReader): CreateUserCredentialsRequest;
}

export namespace CreateUserCredentialsRequest {
    export type AsObject = {
        email: string,
        secret: string,
        expiration: string,
    }
}

export class CreateUserCredentialsResponse extends jspb.Message { 
    getAccessKeyId(): string;
    setAccessKeyId(value: string): CreateUserCredentialsResponse;
    getAccessKeySecret(): string;
    setAccessKeySecret(value: string): CreateUserCredentialsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateUserCredentialsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateUserCredentialsResponse): CreateUserCredentialsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateUserCredentialsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateUserCredentialsResponse;
    static deserializeBinaryFromReader(message: CreateUserCredentialsResponse, reader: jspb.BinaryReader): CreateUserCredentialsResponse;
}

export namespace CreateUserCredentialsResponse {
    export type AsObject = {
        accessKeyId: string,
        accessKeySecret: string,
    }
}

export class CreateUserRequest extends jspb.Message { 
    getEmail(): string;
    setEmail(value: string): CreateUserRequest;
    getName(): string;
    setName(value: string): CreateUserRequest;
    getSecret(): string;
    setSecret(value: string): CreateUserRequest;
    getAvatar(): string;
    setAvatar(value: string): CreateUserRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateUserRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateUserRequest): CreateUserRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateUserRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateUserRequest;
    static deserializeBinaryFromReader(message: CreateUserRequest, reader: jspb.BinaryReader): CreateUserRequest;
}

export namespace CreateUserRequest {
    export type AsObject = {
        email: string,
        name: string,
        secret: string,
        avatar: string,
    }
}

export class UpdateUserRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): UpdateUserRequest;
    getName(): string;
    setName(value: string): UpdateUserRequest;
    getSecret(): string;
    setSecret(value: string): UpdateUserRequest;
    getAvatar(): string;
    setAvatar(value: string): UpdateUserRequest;
    getStatus(): string;
    setStatus(value: string): UpdateUserRequest;
    getLimiter(): string;
    setLimiter(value: string): UpdateUserRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateUserRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateUserRequest): UpdateUserRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateUserRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateUserRequest;
    static deserializeBinaryFromReader(message: UpdateUserRequest, reader: jspb.BinaryReader): UpdateUserRequest;
}

export namespace UpdateUserRequest {
    export type AsObject = {
        ref: string,
        name: string,
        secret: string,
        avatar: string,
        status: string,
        limiter: string,
    }
}

export class GetUserRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): GetUserRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetUserRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetUserRequest): GetUserRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetUserRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetUserRequest;
    static deserializeBinaryFromReader(message: GetUserRequest, reader: jspb.BinaryReader): GetUserRequest;
}

export namespace GetUserRequest {
    export type AsObject = {
        ref: string,
    }
}

export class DeleteUserRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): DeleteUserRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteUserRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteUserRequest): DeleteUserRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteUserRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteUserRequest;
    static deserializeBinaryFromReader(message: DeleteUserRequest, reader: jspb.BinaryReader): DeleteUserRequest;
}

export namespace DeleteUserRequest {
    export type AsObject = {
        ref: string,
    }
}

export class User extends jspb.Message { 
    getRef(): string;
    setRef(value: string): User;
    getAccessKeyId(): string;
    setAccessKeyId(value: string): User;
    getEmail(): string;
    setEmail(value: string): User;
    getName(): string;
    setName(value: string): User;
    getAvatar(): string;
    setAvatar(value: string): User;
    getCreateTime(): string;
    setCreateTime(value: string): User;
    getUpdateTime(): string;
    setUpdateTime(value: string): User;
    getStatus(): string;
    setStatus(value: string): User;
    getLimiter(): string;
    setLimiter(value: string): User;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): User.AsObject;
    static toObject(includeInstance: boolean, msg: User): User.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: User, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): User;
    static deserializeBinaryFromReader(message: User, reader: jspb.BinaryReader): User;
}

export namespace User {
    export type AsObject = {
        ref: string,
        accessKeyId: string,
        email: string,
        name: string,
        avatar: string,
        createTime: string,
        updateTime: string,
        status: string,
        limiter: string,
    }
}
