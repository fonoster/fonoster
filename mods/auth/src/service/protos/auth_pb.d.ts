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
