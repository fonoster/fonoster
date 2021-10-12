// package: google.api
// file: google/api/httpbody.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";

export class HttpBody extends jspb.Message { 
    getContentType(): string;
    setContentType(value: string): HttpBody;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): HttpBody;
    clearExtensionsList(): void;
    getExtensionsList(): Array<google_protobuf_any_pb.Any>;
    setExtensionsList(value: Array<google_protobuf_any_pb.Any>): HttpBody;
    addExtensions(value?: google_protobuf_any_pb.Any, index?: number): google_protobuf_any_pb.Any;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HttpBody.AsObject;
    static toObject(includeInstance: boolean, msg: HttpBody): HttpBody.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HttpBody, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HttpBody;
    static deserializeBinaryFromReader(message: HttpBody, reader: jspb.BinaryReader): HttpBody;
}

export namespace HttpBody {
    export type AsObject = {
        contentType: string,
        data: Uint8Array | string,
        extensionsList: Array<google_protobuf_any_pb.Any.AsObject>,
    }
}
