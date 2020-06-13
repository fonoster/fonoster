// package: fonos.appmanager.v1alpha1
// file: appmanager.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf'
import * as common_pb from './common_pb'

export class ListAppsRequest extends jspb.Message {
  getPageSize (): number
  setPageSize (value: number): ListAppsRequest

  getPageToken (): string
  setPageToken (value: string): ListAppsRequest

  getView (): common_pb.View
  setView (value: common_pb.View): ListAppsRequest

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): ListAppsRequest.AsObject
  static toObject (
    includeInstance: boolean,
    msg: ListAppsRequest
  ): ListAppsRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: ListAppsRequest,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): ListAppsRequest
  static deserializeBinaryFromReader (
    message: ListAppsRequest,
    reader: jspb.BinaryReader
  ): ListAppsRequest
}

export namespace ListAppsRequest {
  export type AsObject = {
    pageSize: number
    pageToken: string
    view: common_pb.View
  }
}

export class ListAppsResponse extends jspb.Message {
  clearAppsList (): void
  getAppsList (): Array<App>
  setAppsList (value: Array<App>): ListAppsResponse
  addApps (value?: App, index?: number): App

  getNextPageToken (): string
  setNextPageToken (value: string): ListAppsResponse

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): ListAppsResponse.AsObject
  static toObject (
    includeInstance: boolean,
    msg: ListAppsResponse
  ): ListAppsResponse.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: ListAppsResponse,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): ListAppsResponse
  static deserializeBinaryFromReader (
    message: ListAppsResponse,
    reader: jspb.BinaryReader
  ): ListAppsResponse
}

export namespace ListAppsResponse {
  export type AsObject = {
    appsList: Array<App.AsObject>
    nextPageToken: string
  }
}

export class GetAppRequest extends jspb.Message {
  getName (): string
  setName (value: string): GetAppRequest

  getView (): common_pb.View
  setView (value: common_pb.View): GetAppRequest

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): GetAppRequest.AsObject
  static toObject (
    includeInstance: boolean,
    msg: GetAppRequest
  ): GetAppRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: GetAppRequest,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): GetAppRequest
  static deserializeBinaryFromReader (
    message: GetAppRequest,
    reader: jspb.BinaryReader
  ): GetAppRequest
}

export namespace GetAppRequest {
  export type AsObject = {
    name: string
    view: common_pb.View
  }
}

export class CreateAppRequest extends jspb.Message {
  hasApp (): boolean
  clearApp (): void
  getApp (): App | undefined
  setApp (value?: App): CreateAppRequest

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): CreateAppRequest.AsObject
  static toObject (
    includeInstance: boolean,
    msg: CreateAppRequest
  ): CreateAppRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: CreateAppRequest,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): CreateAppRequest
  static deserializeBinaryFromReader (
    message: CreateAppRequest,
    reader: jspb.BinaryReader
  ): CreateAppRequest
}

export namespace CreateAppRequest {
  export type AsObject = {
    app?: App.AsObject
  }
}

export class UpdateAppRequest extends jspb.Message {
  hasApp (): boolean
  clearApp (): void
  getApp (): App | undefined
  setApp (value?: App): UpdateAppRequest

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): UpdateAppRequest.AsObject
  static toObject (
    includeInstance: boolean,
    msg: UpdateAppRequest
  ): UpdateAppRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: UpdateAppRequest,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): UpdateAppRequest
  static deserializeBinaryFromReader (
    message: UpdateAppRequest,
    reader: jspb.BinaryReader
  ): UpdateAppRequest
}

export namespace UpdateAppRequest {
  export type AsObject = {
    app?: App.AsObject
  }
}

export class DeleteAppRequest extends jspb.Message {
  getName (): string
  setName (value: string): DeleteAppRequest

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): DeleteAppRequest.AsObject
  static toObject (
    includeInstance: boolean,
    msg: DeleteAppRequest
  ): DeleteAppRequest.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (
    message: DeleteAppRequest,
    writer: jspb.BinaryWriter
  ): void
  static deserializeBinary (bytes: Uint8Array): DeleteAppRequest
  static deserializeBinaryFromReader (
    message: DeleteAppRequest,
    reader: jspb.BinaryReader
  ): DeleteAppRequest
}

export namespace DeleteAppRequest {
  export type AsObject = {
    name: string
  }
}

export class App extends jspb.Message {
  getName (): string
  setName (value: string): App

  getDescription (): string
  setDescription (value: string): App

  getCreateTime (): string
  setCreateTime (value: string): App

  getUpdateTime (): string
  setUpdateTime (value: string): App

  getStatus (): App.Status
  setStatus (value: App.Status): App

  getBucket (): string
  setBucket (value: string): App

  getLabelsMap (): jspb.Map<string, string>
  clearLabelsMap (): void

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): App.AsObject
  static toObject (includeInstance: boolean, msg: App): App.AsObject
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
  }
  static serializeBinaryToWriter (message: App, writer: jspb.BinaryWriter): void
  static deserializeBinary (bytes: Uint8Array): App
  static deserializeBinaryFromReader (
    message: App,
    reader: jspb.BinaryReader
  ): App
}

export namespace App {
  export type AsObject = {
    name: string
    description: string
    createTime: string
    updateTime: string
    status: App.Status
    bucket: string

    labelsMap: Array<[string, string]>
  }

  export enum Status {
    UNKNOWN = 0,
    CREATING = 1,
    RUNNING = 2,
    STOPPED = 3
  }
}
