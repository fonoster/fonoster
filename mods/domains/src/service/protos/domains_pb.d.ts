// package: fonoster.domains.v1beta1
// file: domains.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";
import * as common_pb from "./common_pb";

export class ListDomainsRequest extends jspb.Message { 
    getPageSize(): number;
    setPageSize(value: number): ListDomainsRequest;
    getPageToken(): string;
    setPageToken(value: string): ListDomainsRequest;
    getView(): common_pb.View;
    setView(value: common_pb.View): ListDomainsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListDomainsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListDomainsRequest): ListDomainsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListDomainsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListDomainsRequest;
    static deserializeBinaryFromReader(message: ListDomainsRequest, reader: jspb.BinaryReader): ListDomainsRequest;
}

export namespace ListDomainsRequest {
    export type AsObject = {
        pageSize: number,
        pageToken: string,
        view: common_pb.View,
    }
}

export class ListDomainsResponse extends jspb.Message { 
    clearDomainsList(): void;
    getDomainsList(): Array<Domain>;
    setDomainsList(value: Array<Domain>): ListDomainsResponse;
    addDomains(value?: Domain, index?: number): Domain;
    getNextPageToken(): string;
    setNextPageToken(value: string): ListDomainsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListDomainsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListDomainsResponse): ListDomainsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListDomainsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListDomainsResponse;
    static deserializeBinaryFromReader(message: ListDomainsResponse, reader: jspb.BinaryReader): ListDomainsResponse;
}

export namespace ListDomainsResponse {
    export type AsObject = {
        domainsList: Array<Domain.AsObject>,
        nextPageToken: string,
    }
}

export class CreateDomainRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateDomainRequest;
    getDomainUri(): string;
    setDomainUri(value: string): CreateDomainRequest;
    getEgressRule(): string;
    setEgressRule(value: string): CreateDomainRequest;
    getEgressNumberRef(): string;
    setEgressNumberRef(value: string): CreateDomainRequest;
    clearAccessDenyList(): void;
    getAccessDenyList(): Array<string>;
    setAccessDenyList(value: Array<string>): CreateDomainRequest;
    addAccessDeny(value: string, index?: number): string;
    clearAccessAllowList(): void;
    getAccessAllowList(): Array<string>;
    setAccessAllowList(value: Array<string>): CreateDomainRequest;
    addAccessAllow(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateDomainRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateDomainRequest): CreateDomainRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateDomainRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateDomainRequest;
    static deserializeBinaryFromReader(message: CreateDomainRequest, reader: jspb.BinaryReader): CreateDomainRequest;
}

export namespace CreateDomainRequest {
    export type AsObject = {
        name: string,
        domainUri: string,
        egressRule: string,
        egressNumberRef: string,
        accessDenyList: Array<string>,
        accessAllowList: Array<string>,
    }
}

export class UpdateDomainRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): UpdateDomainRequest;
    getName(): string;
    setName(value: string): UpdateDomainRequest;
    getEgressRule(): string;
    setEgressRule(value: string): UpdateDomainRequest;
    getEgressNumberRef(): string;
    setEgressNumberRef(value: string): UpdateDomainRequest;
    clearAccessDenyList(): void;
    getAccessDenyList(): Array<string>;
    setAccessDenyList(value: Array<string>): UpdateDomainRequest;
    addAccessDeny(value: string, index?: number): string;
    clearAccessAllowList(): void;
    getAccessAllowList(): Array<string>;
    setAccessAllowList(value: Array<string>): UpdateDomainRequest;
    addAccessAllow(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateDomainRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateDomainRequest): UpdateDomainRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateDomainRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateDomainRequest;
    static deserializeBinaryFromReader(message: UpdateDomainRequest, reader: jspb.BinaryReader): UpdateDomainRequest;
}

export namespace UpdateDomainRequest {
    export type AsObject = {
        ref: string,
        name: string,
        egressRule: string,
        egressNumberRef: string,
        accessDenyList: Array<string>,
        accessAllowList: Array<string>,
    }
}

export class GetDomainRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): GetDomainRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetDomainRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetDomainRequest): GetDomainRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetDomainRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetDomainRequest;
    static deserializeBinaryFromReader(message: GetDomainRequest, reader: jspb.BinaryReader): GetDomainRequest;
}

export namespace GetDomainRequest {
    export type AsObject = {
        ref: string,
    }
}

export class DeleteDomainRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): DeleteDomainRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteDomainRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteDomainRequest): DeleteDomainRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteDomainRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteDomainRequest;
    static deserializeBinaryFromReader(message: DeleteDomainRequest, reader: jspb.BinaryReader): DeleteDomainRequest;
}

export namespace DeleteDomainRequest {
    export type AsObject = {
        ref: string,
    }
}

export class Domain extends jspb.Message { 
    getRef(): string;
    setRef(value: string): Domain;
    getName(): string;
    setName(value: string): Domain;
    getDomainUri(): string;
    setDomainUri(value: string): Domain;
    getEgressRule(): string;
    setEgressRule(value: string): Domain;
    getEgressNumberRef(): string;
    setEgressNumberRef(value: string): Domain;
    clearAccessDenyList(): void;
    getAccessDenyList(): Array<string>;
    setAccessDenyList(value: Array<string>): Domain;
    addAccessDeny(value: string, index?: number): string;
    clearAccessAllowList(): void;
    getAccessAllowList(): Array<string>;
    setAccessAllowList(value: Array<string>): Domain;
    addAccessAllow(value: string, index?: number): string;
    getCreateTime(): string;
    setCreateTime(value: string): Domain;
    getUpdateTime(): string;
    setUpdateTime(value: string): Domain;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Domain.AsObject;
    static toObject(includeInstance: boolean, msg: Domain): Domain.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Domain, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Domain;
    static deserializeBinaryFromReader(message: Domain, reader: jspb.BinaryReader): Domain;
}

export namespace Domain {
    export type AsObject = {
        ref: string,
        name: string,
        domainUri: string,
        egressRule: string,
        egressNumberRef: string,
        accessDenyList: Array<string>,
        accessAllowList: Array<string>,
        createTime: string,
        updateTime: string,
    }
}
