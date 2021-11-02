// package: fonoster.projects.v1beta1
// file: projects.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";
import * as common_pb from "./common_pb";

export class ListProjectsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListProjectsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListProjectsRequest): ListProjectsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListProjectsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListProjectsRequest;
    static deserializeBinaryFromReader(message: ListProjectsRequest, reader: jspb.BinaryReader): ListProjectsRequest;
}

export namespace ListProjectsRequest {
    export type AsObject = {
    }
}

export class ListProjectsResponse extends jspb.Message { 
    clearProjectsList(): void;
    getProjectsList(): Array<Project>;
    setProjectsList(value: Array<Project>): ListProjectsResponse;
    addProjects(value?: Project, index?: number): Project;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListProjectsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListProjectsResponse): ListProjectsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListProjectsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListProjectsResponse;
    static deserializeBinaryFromReader(message: ListProjectsResponse, reader: jspb.BinaryReader): ListProjectsResponse;
}

export namespace ListProjectsResponse {
    export type AsObject = {
        projectsList: Array<Project.AsObject>,
    }
}

export class CreateProjectRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateProjectRequest;
    getAllowExperiments(): boolean;
    setAllowExperiments(value: boolean): CreateProjectRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateProjectRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateProjectRequest): CreateProjectRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateProjectRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateProjectRequest;
    static deserializeBinaryFromReader(message: CreateProjectRequest, reader: jspb.BinaryReader): CreateProjectRequest;
}

export namespace CreateProjectRequest {
    export type AsObject = {
        name: string,
        allowExperiments: boolean,
    }
}

export class UpdateProjectRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): UpdateProjectRequest;
    getName(): string;
    setName(value: string): UpdateProjectRequest;
    getAllowExperiments(): boolean;
    setAllowExperiments(value: boolean): UpdateProjectRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateProjectRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateProjectRequest): UpdateProjectRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateProjectRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateProjectRequest;
    static deserializeBinaryFromReader(message: UpdateProjectRequest, reader: jspb.BinaryReader): UpdateProjectRequest;
}

export namespace UpdateProjectRequest {
    export type AsObject = {
        ref: string,
        name: string,
        allowExperiments: boolean,
    }
}

export class GetProjectRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): GetProjectRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetProjectRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetProjectRequest): GetProjectRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetProjectRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetProjectRequest;
    static deserializeBinaryFromReader(message: GetProjectRequest, reader: jspb.BinaryReader): GetProjectRequest;
}

export namespace GetProjectRequest {
    export type AsObject = {
        ref: string,
    }
}

export class DeleteProjectRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): DeleteProjectRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteProjectRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteProjectRequest): DeleteProjectRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteProjectRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteProjectRequest;
    static deserializeBinaryFromReader(message: DeleteProjectRequest, reader: jspb.BinaryReader): DeleteProjectRequest;
}

export namespace DeleteProjectRequest {
    export type AsObject = {
        ref: string,
    }
}

export class RenewAccessKeySecretRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): RenewAccessKeySecretRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RenewAccessKeySecretRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RenewAccessKeySecretRequest): RenewAccessKeySecretRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RenewAccessKeySecretRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RenewAccessKeySecretRequest;
    static deserializeBinaryFromReader(message: RenewAccessKeySecretRequest, reader: jspb.BinaryReader): RenewAccessKeySecretRequest;
}

export namespace RenewAccessKeySecretRequest {
    export type AsObject = {
        ref: string,
    }
}

export class RenewAccessKeySecretResponse extends jspb.Message { 
    getAccessKeySecret(): string;
    setAccessKeySecret(value: string): RenewAccessKeySecretResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RenewAccessKeySecretResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RenewAccessKeySecretResponse): RenewAccessKeySecretResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RenewAccessKeySecretResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RenewAccessKeySecretResponse;
    static deserializeBinaryFromReader(message: RenewAccessKeySecretResponse, reader: jspb.BinaryReader): RenewAccessKeySecretResponse;
}

export namespace RenewAccessKeySecretResponse {
    export type AsObject = {
        accessKeySecret: string,
    }
}

export class Project extends jspb.Message { 
    getName(): string;
    setName(value: string): Project;
    getRef(): string;
    setRef(value: string): Project;
    getUserRef(): string;
    setUserRef(value: string): Project;
    getAccessKeyId(): string;
    setAccessKeyId(value: string): Project;
    getAccessKeySecret(): string;
    setAccessKeySecret(value: string): Project;
    getAllowExperiments(): boolean;
    setAllowExperiments(value: boolean): Project;
    getCreateTime(): string;
    setCreateTime(value: string): Project;
    getUpdateTime(): string;
    setUpdateTime(value: string): Project;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Project.AsObject;
    static toObject(includeInstance: boolean, msg: Project): Project.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Project, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Project;
    static deserializeBinaryFromReader(message: Project, reader: jspb.BinaryReader): Project;
}

export namespace Project {
    export type AsObject = {
        name: string,
        ref: string,
        userRef: string,
        accessKeyId: string,
        accessKeySecret: string,
        allowExperiments: boolean,
        createTime: string,
        updateTime: string,
    }
}
