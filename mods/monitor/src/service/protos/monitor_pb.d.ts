// package: fonoster.monitor.v1beta1
// file: monitor.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class SearchEventsRequest extends jspb.Message { 

    hasQuery(): boolean;
    clearQuery(): void;
    getQuery(): google_protobuf_struct_pb.Struct | undefined;
    setQuery(value?: google_protobuf_struct_pb.Struct): SearchEventsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SearchEventsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SearchEventsRequest): SearchEventsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SearchEventsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SearchEventsRequest;
    static deserializeBinaryFromReader(message: SearchEventsRequest, reader: jspb.BinaryReader): SearchEventsRequest;
}

export namespace SearchEventsRequest {
    export type AsObject = {
        query?: google_protobuf_struct_pb.Struct.AsObject,
    }
}

export class Event extends jspb.Message { 
    getRef(): string;
    setRef(value: string): Event;
    getEventType(): EventType;
    setEventType(value: EventType): Event;
    getLevel(): Level;
    setLevel(value: Level): Event;
    getTimestamp(): string;
    setTimestamp(value: string): Event;
    getMessage(): string;
    setMessage(value: string): Event;

    hasBody(): boolean;
    clearBody(): void;
    getBody(): google_protobuf_struct_pb.Struct | undefined;
    setBody(value?: google_protobuf_struct_pb.Struct): Event;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Event.AsObject;
    static toObject(includeInstance: boolean, msg: Event): Event.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Event, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Event;
    static deserializeBinaryFromReader(message: Event, reader: jspb.BinaryReader): Event;
}

export namespace Event {
    export type AsObject = {
        ref: string,
        eventType: EventType,
        level: Level,
        timestamp: string,
        message: string,
        body?: google_protobuf_struct_pb.Struct.AsObject,
    }
}

export enum Level {
    INFO = 0,
    WARN = 1,
    ERROR = 2,
    VERBOSE = 3,
}

export enum EventType {
    APP = 0,
    SIP = 1,
    CALL = 2,
}
