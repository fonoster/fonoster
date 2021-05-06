// package: fonos.appmanager.v1alpha1
// file: funcs.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_pb from "./common_pb";

export class ListFuncsRequest extends jspb.Message { 
    getPageSize(): number;
    setPageSize(value: number): ListFuncsRequest;
    getPageToken(): string;
    setPageToken(value: string): ListFuncsRequest;
    getView(): common_pb.View;
    setView(value: common_pb.View): ListFuncsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListFuncsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListFuncsRequest): ListFuncsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListFuncsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListFuncsRequest;
    static deserializeBinaryFromReader(message: ListFuncsRequest, reader: jspb.BinaryReader): ListFuncsRequest;
}

export namespace ListFuncsRequest {
    export type AsObject = {
        pageSize: number,
        pageToken: string,
        view: common_pb.View,
    }
}

export class ListFuncsResponse extends jspb.Message { 
    clearFuncsList(): void;
    getFuncsList(): Array<Func>;
    setFuncsList(value: Array<Func>): ListFuncsResponse;
    addFuncs(value?: Func, index?: number): Func;
    getNextPageToken(): string;
    setNextPageToken(value: string): ListFuncsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListFuncsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListFuncsResponse): ListFuncsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListFuncsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListFuncsResponse;
    static deserializeBinaryFromReader(message: ListFuncsResponse, reader: jspb.BinaryReader): ListFuncsResponse;
}

export namespace ListFuncsResponse {
    export type AsObject = {
        funcsList: Array<Func.AsObject>,
        nextPageToken: string,
    }
}

export class GetFuncLogsRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): GetFuncLogsRequest;
    getSince(): string;
    setSince(value: string): GetFuncLogsRequest;
    getTail(): number;
    setTail(value: number): GetFuncLogsRequest;
    getFollow(): boolean;
    setFollow(value: boolean): GetFuncLogsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetFuncLogsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetFuncLogsRequest): GetFuncLogsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetFuncLogsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetFuncLogsRequest;
    static deserializeBinaryFromReader(message: GetFuncLogsRequest, reader: jspb.BinaryReader): GetFuncLogsRequest;
}

export namespace GetFuncLogsRequest {
    export type AsObject = {
        name: string,
        since: string,
        tail: number,
        follow: boolean,
    }
}

export class GetFuncRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): GetFuncRequest;
    getView(): common_pb.View;
    setView(value: common_pb.View): GetFuncRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetFuncRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetFuncRequest): GetFuncRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetFuncRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetFuncRequest;
    static deserializeBinaryFromReader(message: GetFuncRequest, reader: jspb.BinaryReader): GetFuncRequest;
}

export namespace GetFuncRequest {
    export type AsObject = {
        ref: string,
        view: common_pb.View,
    }
}

export class CreateFuncRequest extends jspb.Message { 

    hasFunc(): boolean;
    clearFunc(): void;
    getFunc(): Func | undefined;
    setFunc(value?: Func): CreateFuncRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateFuncRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateFuncRequest): CreateFuncRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateFuncRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateFuncRequest;
    static deserializeBinaryFromReader(message: CreateFuncRequest, reader: jspb.BinaryReader): CreateFuncRequest;
}

export namespace CreateFuncRequest {
    export type AsObject = {
        func?: Func.AsObject,
    }
}

export class DeleteFuncRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): DeleteFuncRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteFuncRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteFuncRequest): DeleteFuncRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteFuncRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteFuncRequest;
    static deserializeBinaryFromReader(message: DeleteFuncRequest, reader: jspb.BinaryReader): DeleteFuncRequest;
}

export namespace DeleteFuncRequest {
    export type AsObject = {
        ref: string,
    }
}

export class Func extends jspb.Message { 
    getName(): string;
    setName(value: string): Func;
    getImage(): string;
    setImage(value: string): Func;
    getInvocationCount(): number;
    setInvocationCount(value: number): Func;
    getReplicas(): number;
    setReplicas(value: number): Func;
    getAvailableReplicas(): number;
    setAvailableReplicas(value: number): Func;

    hasLimits(): boolean;
    clearLimits(): void;
    getLimits(): Resource | undefined;
    setLimits(value?: Resource): Func;

    hasRequests(): boolean;
    clearRequests(): void;
    getRequests(): Resource | undefined;
    setRequests(value?: Resource): Func;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Func.AsObject;
    static toObject(includeInstance: boolean, msg: Func): Func.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Func, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Func;
    static deserializeBinaryFromReader(message: Func, reader: jspb.BinaryReader): Func;
}

export namespace Func {
    export type AsObject = {
        name: string,
        image: string,
        invocationCount: number,
        replicas: number,
        availableReplicas: number,
        limits?: Resource.AsObject,
        requests?: Resource.AsObject,
    }
}

export class Resource extends jspb.Message { 
    getMemory(): string;
    setMemory(value: string): Resource;
    getCpu(): string;
    setCpu(value: string): Resource;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Resource.AsObject;
    static toObject(includeInstance: boolean, msg: Resource): Resource.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Resource, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Resource;
    static deserializeBinaryFromReader(message: Resource, reader: jspb.BinaryReader): Resource;
}

export namespace Resource {
    export type AsObject = {
        memory: string,
        cpu: string,
    }
}

export class FuncLog extends jspb.Message { 
    getName(): string;
    setName(value: string): FuncLog;
    getInstance(): string;
    setInstance(value: string): FuncLog;
    getTimestamp(): string;
    setTimestamp(value: string): FuncLog;
    getText(): string;
    setText(value: string): FuncLog;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FuncLog.AsObject;
    static toObject(includeInstance: boolean, msg: FuncLog): FuncLog.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FuncLog, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FuncLog;
    static deserializeBinaryFromReader(message: FuncLog, reader: jspb.BinaryReader): FuncLog;
}

export namespace FuncLog {
    export type AsObject = {
        name: string,
        instance: string,
        timestamp: string,
        text: string,
    }
}
