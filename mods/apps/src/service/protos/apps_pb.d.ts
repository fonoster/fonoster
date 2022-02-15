// package: fonoster.apps.v1beta1
// file: apps.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as common_pb from "./common_pb";

export class ListAppsRequest extends jspb.Message { 
    getPageSize(): number;
    setPageSize(value: number): ListAppsRequest;
    getPageToken(): string;
    setPageToken(value: string): ListAppsRequest;
    getView(): common_pb.View;
    setView(value: common_pb.View): ListAppsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListAppsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListAppsRequest): ListAppsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListAppsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListAppsRequest;
    static deserializeBinaryFromReader(message: ListAppsRequest, reader: jspb.BinaryReader): ListAppsRequest;
}

export namespace ListAppsRequest {
    export type AsObject = {
        pageSize: number,
        pageToken: string,
        view: common_pb.View,
    }
}

export class ListAppsResponse extends jspb.Message { 
    clearAppsList(): void;
    getAppsList(): Array<App>;
    setAppsList(value: Array<App>): ListAppsResponse;
    addApps(value?: App, index?: number): App;
    getNextPageToken(): string;
    setNextPageToken(value: string): ListAppsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListAppsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListAppsResponse): ListAppsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListAppsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListAppsResponse;
    static deserializeBinaryFromReader(message: ListAppsResponse, reader: jspb.BinaryReader): ListAppsResponse;
}

export namespace ListAppsResponse {
    export type AsObject = {
        appsList: Array<App.AsObject>,
        nextPageToken: string,
    }
}

export class CreateAppRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateAppRequest;

    hasInitialDtmf(): boolean;
    clearInitialDtmf(): void;
    getInitialDtmf(): string | undefined;
    setInitialDtmf(value: string): CreateAppRequest;
    getActivationIntentId(): string;
    setActivationIntentId(value: string): CreateAppRequest;
    getActivationTimeout(): number;
    setActivationTimeout(value: number): CreateAppRequest;
    getInteractionTimeout(): number;
    setInteractionTimeout(value: number): CreateAppRequest;
    getEnableEvents(): boolean;
    setEnableEvents(value: boolean): CreateAppRequest;

    hasTransferConfig(): boolean;
    clearTransferConfig(): void;
    getTransferConfig(): TransferConfig | undefined;
    setTransferConfig(value?: TransferConfig): CreateAppRequest;

    hasSpeechConfig(): boolean;
    clearSpeechConfig(): void;
    getSpeechConfig(): google_protobuf_struct_pb.Struct | undefined;
    setSpeechConfig(value?: google_protobuf_struct_pb.Struct): CreateAppRequest;

    hasIntentsEngineConfig(): boolean;
    clearIntentsEngineConfig(): void;
    getIntentsEngineConfig(): google_protobuf_struct_pb.Struct | undefined;
    setIntentsEngineConfig(value?: google_protobuf_struct_pb.Struct): CreateAppRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateAppRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateAppRequest): CreateAppRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateAppRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateAppRequest;
    static deserializeBinaryFromReader(message: CreateAppRequest, reader: jspb.BinaryReader): CreateAppRequest;
}

export namespace CreateAppRequest {
    export type AsObject = {
        name: string,
        initialDtmf?: string,
        activationIntentId: string,
        activationTimeout: number,
        interactionTimeout: number,
        enableEvents: boolean,
        transferConfig?: TransferConfig.AsObject,
        speechConfig?: google_protobuf_struct_pb.Struct.AsObject,
        intentsEngineConfig?: google_protobuf_struct_pb.Struct.AsObject,
    }
}

export class UpdateAppRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): UpdateAppRequest;
    getName(): string;
    setName(value: string): UpdateAppRequest;
    getInitialDtmf(): string;
    setInitialDtmf(value: string): UpdateAppRequest;
    getActivationIntentId(): string;
    setActivationIntentId(value: string): UpdateAppRequest;
    getActivationTimeout(): number;
    setActivationTimeout(value: number): UpdateAppRequest;
    getInteractionTimeout(): number;
    setInteractionTimeout(value: number): UpdateAppRequest;
    getEnableEvents(): boolean;
    setEnableEvents(value: boolean): UpdateAppRequest;

    hasTransferConfig(): boolean;
    clearTransferConfig(): void;
    getTransferConfig(): TransferConfig | undefined;
    setTransferConfig(value?: TransferConfig): UpdateAppRequest;

    hasSpeechConfig(): boolean;
    clearSpeechConfig(): void;
    getSpeechConfig(): google_protobuf_struct_pb.Struct | undefined;
    setSpeechConfig(value?: google_protobuf_struct_pb.Struct): UpdateAppRequest;

    hasIntentsEngineConfig(): boolean;
    clearIntentsEngineConfig(): void;
    getIntentsEngineConfig(): google_protobuf_struct_pb.Struct | undefined;
    setIntentsEngineConfig(value?: google_protobuf_struct_pb.Struct): UpdateAppRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateAppRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateAppRequest): UpdateAppRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateAppRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateAppRequest;
    static deserializeBinaryFromReader(message: UpdateAppRequest, reader: jspb.BinaryReader): UpdateAppRequest;
}

export namespace UpdateAppRequest {
    export type AsObject = {
        ref: string,
        name: string,
        initialDtmf: string,
        activationIntentId: string,
        activationTimeout: number,
        interactionTimeout: number,
        enableEvents: boolean,
        transferConfig?: TransferConfig.AsObject,
        speechConfig?: google_protobuf_struct_pb.Struct.AsObject,
        intentsEngineConfig?: google_protobuf_struct_pb.Struct.AsObject,
    }
}

export class GetAppRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): GetAppRequest;
    getView(): common_pb.View;
    setView(value: common_pb.View): GetAppRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetAppRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetAppRequest): GetAppRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetAppRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetAppRequest;
    static deserializeBinaryFromReader(message: GetAppRequest, reader: jspb.BinaryReader): GetAppRequest;
}

export namespace GetAppRequest {
    export type AsObject = {
        ref: string,
        view: common_pb.View,
    }
}

export class DeleteAppRequest extends jspb.Message { 
    getRef(): string;
    setRef(value: string): DeleteAppRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteAppRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteAppRequest): DeleteAppRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteAppRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteAppRequest;
    static deserializeBinaryFromReader(message: DeleteAppRequest, reader: jspb.BinaryReader): DeleteAppRequest;
}

export namespace DeleteAppRequest {
    export type AsObject = {
        ref: string,
    }
}

export class TransferConfig extends jspb.Message { 
    getMedia(): string;
    setMedia(value: string): TransferConfig;
    getMediaBusy(): string;
    setMediaBusy(value: string): TransferConfig;
    getMediaNoAnswer(): string;
    setMediaNoAnswer(value: string): TransferConfig;
    getMessage(): string;
    setMessage(value: string): TransferConfig;
    getMessageBusy(): string;
    setMessageBusy(value: string): TransferConfig;
    getMessageNoAnswer(): string;
    setMessageNoAnswer(value: string): TransferConfig;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TransferConfig.AsObject;
    static toObject(includeInstance: boolean, msg: TransferConfig): TransferConfig.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TransferConfig, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TransferConfig;
    static deserializeBinaryFromReader(message: TransferConfig, reader: jspb.BinaryReader): TransferConfig;
}

export namespace TransferConfig {
    export type AsObject = {
        media: string,
        mediaBusy: string,
        mediaNoAnswer: string,
        message: string,
        messageBusy: string,
        messageNoAnswer: string,
    }
}

export class App extends jspb.Message { 
    getRef(): string;
    setRef(value: string): App;
    getAccessKeyId(): string;
    setAccessKeyId(value: string): App;
    getName(): string;
    setName(value: string): App;
    getInitialDtmf(): string;
    setInitialDtmf(value: string): App;
    getActivationIntentId(): string;
    setActivationIntentId(value: string): App;
    getCreateTime(): string;
    setCreateTime(value: string): App;
    getUpdateTime(): string;
    setUpdateTime(value: string): App;
    getActivationTimeout(): number;
    setActivationTimeout(value: number): App;
    getInteractionTimeout(): number;
    setInteractionTimeout(value: number): App;
    getEnableEvents(): boolean;
    setEnableEvents(value: boolean): App;

    hasTransferConfig(): boolean;
    clearTransferConfig(): void;
    getTransferConfig(): TransferConfig | undefined;
    setTransferConfig(value?: TransferConfig): App;

    hasSpeechConfig(): boolean;
    clearSpeechConfig(): void;
    getSpeechConfig(): google_protobuf_struct_pb.Struct | undefined;
    setSpeechConfig(value?: google_protobuf_struct_pb.Struct): App;

    hasIntentsEngineConfig(): boolean;
    clearIntentsEngineConfig(): void;
    getIntentsEngineConfig(): google_protobuf_struct_pb.Struct | undefined;
    setIntentsEngineConfig(value?: google_protobuf_struct_pb.Struct): App;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): App.AsObject;
    static toObject(includeInstance: boolean, msg: App): App.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: App, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): App;
    static deserializeBinaryFromReader(message: App, reader: jspb.BinaryReader): App;
}

export namespace App {
    export type AsObject = {
        ref: string,
        accessKeyId: string,
        name: string,
        initialDtmf: string,
        activationIntentId: string,
        createTime: string,
        updateTime: string,
        activationTimeout: number,
        interactionTimeout: number,
        enableEvents: boolean,
        transferConfig?: TransferConfig.AsObject,
        speechConfig?: google_protobuf_struct_pb.Struct.AsObject,
        intentsEngineConfig?: google_protobuf_struct_pb.Struct.AsObject,
    }
}
