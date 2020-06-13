// package: fonos.numbers.v1alpha1
// file: numbers.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf'
import * as common_pb from './common_pb'
import * as appmanager_pb from './appmanager_pb'

export class ListNumbersRequest extends jspb.Message {
  getPageSize (): number
  setPageSize (value: number): ListNumbersRequest

  getPageToken (): string
  setPageToken (value: string): ListNumbersRequest

  getView (): common_pb.View
  setView (value: common_pb.View): ListNumbersRequest

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): ListNumbersRequest.AsObject
  static toObject (
    includeInstance: boolean,
    msg: ListNumbersRequest
  ): ListNumbersRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: ListNumbersRequest,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): ListNumbersRequest
  static deserializeBinaryFromReader (
    message: ListNumbersRequest,
    reader: jspb.BinaryReader
  ): ListNumbersRequest
}

export namespace ListNumbersRequest {
  export type AsObject = {
    pageSize: number
    pageToken: string
    view: common_pb.View
  }
}

export class ListNumbersResponse extends jspb.Message {
  clearNumbersList (): void
  getNumbersList (): Array<Number>
  setNumbersList (value: Array<Number>): ListNumbersResponse
  addNumbers (value?: Number, index?: number): Number

  getNextPageToken (): string
  setNextPageToken (value: string): ListNumbersResponse

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): ListNumbersResponse.AsObject
  static toObject (
    includeInstance: boolean,
    msg: ListNumbersResponse
  ): ListNumbersResponse.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: ListNumbersResponse,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): ListNumbersResponse
  static deserializeBinaryFromReader (
    message: ListNumbersResponse,
    reader: jspb.BinaryReader
  ): ListNumbersResponse
}

export namespace ListNumbersResponse {
  export type AsObject = {
    numbersList: Array<Number.AsObject>
    nextPageToken: string
  }
}

export class CreateNumberRequest extends jspb.Message {
  hasNumber (): boolean
  clearNumber (): void
  getNumber (): Number | undefined
  setNumber (value?: Number): CreateNumberRequest

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): CreateNumberRequest.AsObject
  static toObject (
    includeInstance: boolean,
    msg: CreateNumberRequest
  ): CreateNumberRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: CreateNumberRequest,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): CreateNumberRequest
  static deserializeBinaryFromReader (
    message: CreateNumberRequest,
    reader: jspb.BinaryReader
  ): CreateNumberRequest
}

export namespace CreateNumberRequest {
  export type AsObject = {
    number?: Number.AsObject
  }
}

export class UpdateNumberRequest extends jspb.Message {
  hasNumber (): boolean
  clearNumber (): void
  getNumber (): Number | undefined
  setNumber (value?: Number): UpdateNumberRequest

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): UpdateNumberRequest.AsObject
  static toObject (
    includeInstance: boolean,
    msg: UpdateNumberRequest
  ): UpdateNumberRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: UpdateNumberRequest,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): UpdateNumberRequest
  static deserializeBinaryFromReader (
    message: UpdateNumberRequest,
    reader: jspb.BinaryReader
  ): UpdateNumberRequest
}

export namespace UpdateNumberRequest {
  export type AsObject = {
    number?: Number.AsObject
  }
}

export class GetNumberRequest extends jspb.Message {
  getRef (): string
  setRef (value: string): GetNumberRequest

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): GetNumberRequest.AsObject
  static toObject (
    includeInstance: boolean,
    msg: GetNumberRequest
  ): GetNumberRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: GetNumberRequest,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): GetNumberRequest
  static deserializeBinaryFromReader (
    message: GetNumberRequest,
    reader: jspb.BinaryReader
  ): GetNumberRequest
}

export namespace GetNumberRequest {
  export type AsObject = {
    ref: string
  }
}

export class GetIngressAppRequest extends jspb.Message {
  getE164Number (): string
  setE164Number (value: string): GetIngressAppRequest

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): GetIngressAppRequest.AsObject
  static toObject (
    includeInstance: boolean,
    msg: GetIngressAppRequest
  ): GetIngressAppRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: GetIngressAppRequest,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): GetIngressAppRequest
  static deserializeBinaryFromReader (
    message: GetIngressAppRequest,
    reader: jspb.BinaryReader
  ): GetIngressAppRequest
}

export namespace GetIngressAppRequest {
  export type AsObject = {
    e164Number: string
  }
}

export class DeleteNumberRequest extends jspb.Message {
  getRef (): string
  setRef (value: string): DeleteNumberRequest

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): DeleteNumberRequest.AsObject
  static toObject (
    includeInstance: boolean,
    msg: DeleteNumberRequest
  ): DeleteNumberRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: DeleteNumberRequest,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): DeleteNumberRequest
  static deserializeBinaryFromReader (
    message: DeleteNumberRequest,
    reader: jspb.BinaryReader
  ): DeleteNumberRequest
}

export namespace DeleteNumberRequest {
  export type AsObject = {
    ref: string
  }
}

export class Number extends jspb.Message {
  getRef (): string
  setRef (value: string): Number

  getProviderRef (): string
  setProviderRef (value: string): Number

  getE164Number (): string
  setE164Number (value: string): Number

  getAorLink (): string
  setAorLink (value: string): Number

  getIngressApp (): string
  setIngressApp (value: string): Number

  getCreateTime (): string
  setCreateTime (value: string): Number

  getUpdateTime (): string
  setUpdateTime (value: string): Number

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): Number.AsObject
  static toObject (includeInstance: boolean, msg: Number): Number.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: Number,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): Number
  static deserializeBinaryFromReader (
    message: Number,
    reader: jspb.BinaryReader
  ): Number
}

export namespace Number {
  export type AsObject = {
    ref: string
    providerRef: string
    e164Number: string
    aorLink: string
    ingressApp: string
    createTime: string
    updateTime: string
  }
}
