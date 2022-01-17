// package: fonoster.agents.v1beta1
// file: agents.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";
import * as common_pb from "./common_pb";

export class ListAgentsRequest extends jspb.Message { 
    getPageSize(): number;
    setPageSize(value: number): ListAgentsRequest;
    getPageToken(): string;
    setPageToken(value: string): ListAgentsRequest;
    getView(): common_pb.View;
    setView(value: common_pb.View): ListAgentsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListAgentsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListAgentsRequest): ListAgentsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListAgentsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListAgentsRequest;
    static deserializeBinaryFromReader(message: ListAgentsRequest, reader: jspb.BinaryReader): ListAgentsRequest;
}

export namespace ListAgentsRequest {
    export type AsObject = {
        pageSize: number,
        pageToken: string,
        view: common_pb.View,
    }
}

export class ListAgentsResponse extends jspb.Message { 
    clearAgentsList(): void;
    getAgentsList(): Array<Agent>;
    setAgentsList(value: Array<Agent>): ListAgentsResponse;
    addAgents(value?: Agent, index?: number): Agent;
    getNextPageToken(): string;
    setNextPageToken(value: string): ListAgentsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListAgentsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListAgentsResponse): ListAgentsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListAgentsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListAgentsResponse;
    static deserializeBinaryFromReader(message: ListAgentsResponse, reader: jspb.BinaryReader): ListAgentsResponse;
}

export namespace ListAgentsResponse {
    export type AsObject = {
        agentsList: Array<Agent.AsObject>,
        nextPageToken: string,
    }
}

export class CreateAgentRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateAgentRequest;
    getUsername(): string;
    setUsername(value: string): CreateAgentRequest;
    getSecret(): string;
    setSecret(value: string): CreateAgentRequest;
    clearDomainsList(): void;
    getDomainsList(): Array<string>;
    setDomainsList(value: Array<string>): CreateAgentRequest;
    addDomains(value: string, index?: number): string;
    getPrivacy(): string;
    setPrivacy(value: string): CreateAgentRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateAgentRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateAgentRequest): CreateAgentRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateAgentRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateAgentRequest;
    static deserializeBinaryFromReader(message: CreateAgentRequest, reader: jspb.BinaryReader): CreateAgentRequest;
}

export namespace CreateAgentRequest {
    export type AsObject = {
        name: string,
        username: string,
        secret: string,
        domainsList: Array<string>,
        privacy: string,
    }
}

export class UpdateAgentRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): UpdateAgentRequest;
    getName(): string;
    setName(value: string): UpdateAgentRequest;
    getSecret(): string;
    setSecret(value: string): UpdateAgentRequest;
    clearDomainsList(): void;
    getDomainsList(): Array<string>;
    setDomainsList(value: Array<string>): UpdateAgentRequest;
    addDomains(value: string, index?: number): string;
    getPrivacy(): string;
    setPrivacy(value: string): UpdateAgentRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateAgentRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateAgentRequest): UpdateAgentRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateAgentRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateAgentRequest;
    static deserializeBinaryFromReader(message: UpdateAgentRequest, reader: jspb.BinaryReader): UpdateAgentRequest;
}

export namespace UpdateAgentRequest {
    export type AsObject = {
        ref: string,
        name: string,
        secret: string,
        domainsList: Array<string>,
        privacy: string,
    }
}

export class GetAgentRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): GetAgentRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetAgentRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetAgentRequest): GetAgentRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetAgentRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetAgentRequest;
    static deserializeBinaryFromReader(message: GetAgentRequest, reader: jspb.BinaryReader): GetAgentRequest;
}

export namespace GetAgentRequest {
    export type AsObject = {
        ref: string,
    }
}

export class DeleteAgentRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): DeleteAgentRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteAgentRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteAgentRequest): DeleteAgentRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteAgentRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteAgentRequest;
    static deserializeBinaryFromReader(message: DeleteAgentRequest, reader: jspb.BinaryReader): DeleteAgentRequest;
}

export namespace DeleteAgentRequest {
    export type AsObject = {
        ref: string,
    }
}

export class Agent extends jspb.Message { 
    getRef(): string;
    setRef(value: string): Agent;
    getName(): string;
    setName(value: string): Agent;
    getUsername(): string;
    setUsername(value: string): Agent;
    getSecret(): string;
    setSecret(value: string): Agent;
    clearDomainsList(): void;
    getDomainsList(): Array<string>;
    setDomainsList(value: Array<string>): Agent;
    addDomains(value: string, index?: number): string;
    getPrivacy(): string;
    setPrivacy(value: string): Agent;
    getCreateTime(): string;
    setCreateTime(value: string): Agent;
    getUpdateTime(): string;
    setUpdateTime(value: string): Agent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Agent.AsObject;
    static toObject(includeInstance: boolean, msg: Agent): Agent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Agent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Agent;
    static deserializeBinaryFromReader(message: Agent, reader: jspb.BinaryReader): Agent;
}

export namespace Agent {
    export type AsObject = {
        ref: string,
        name: string,
        username: string,
        secret: string,
        domainsList: Array<string>,
        privacy: string,
        createTime: string,
        updateTime: string,
    }
}
