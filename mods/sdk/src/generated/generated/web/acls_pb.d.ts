import * as jspb from 'google-protobuf'



export class Acl extends jspb.Message {
  getRef(): string;
  setRef(value: string): Acl;

  getName(): string;
  setName(value: string): Acl;

  getAllowList(): Array<string>;
  setAllowList(value: Array<string>): Acl;
  clearAllowList(): Acl;
  addAllow(value: string, index?: number): Acl;

  getCreatedAt(): number;
  setCreatedAt(value: number): Acl;

  getUpdatedAt(): number;
  setUpdatedAt(value: number): Acl;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Acl.AsObject;
  static toObject(includeInstance: boolean, msg: Acl): Acl.AsObject;
  static serializeBinaryToWriter(message: Acl, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Acl;
  static deserializeBinaryFromReader(message: Acl, reader: jspb.BinaryReader): Acl;
}

export namespace Acl {
  export type AsObject = {
    ref: string,
    name: string,
    allowList: Array<string>,
    createdAt: number,
    updatedAt: number,
  }
}

export class CreateAclRequest extends jspb.Message {
  getName(): string;
  setName(value: string): CreateAclRequest;

  getAllowList(): Array<string>;
  setAllowList(value: Array<string>): CreateAclRequest;
  clearAllowList(): CreateAclRequest;
  addAllow(value: string, index?: number): CreateAclRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateAclRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateAclRequest): CreateAclRequest.AsObject;
  static serializeBinaryToWriter(message: CreateAclRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateAclRequest;
  static deserializeBinaryFromReader(message: CreateAclRequest, reader: jspb.BinaryReader): CreateAclRequest;
}

export namespace CreateAclRequest {
  export type AsObject = {
    name: string,
    allowList: Array<string>,
  }
}

export class CreateAclResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): CreateAclResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateAclResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateAclResponse): CreateAclResponse.AsObject;
  static serializeBinaryToWriter(message: CreateAclResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateAclResponse;
  static deserializeBinaryFromReader(message: CreateAclResponse, reader: jspb.BinaryReader): CreateAclResponse;
}

export namespace CreateAclResponse {
  export type AsObject = {
    ref: string,
  }
}

export class UpdateAclRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateAclRequest;

  getName(): string;
  setName(value: string): UpdateAclRequest;

  getAllowList(): Array<string>;
  setAllowList(value: Array<string>): UpdateAclRequest;
  clearAllowList(): UpdateAclRequest;
  addAllow(value: string, index?: number): UpdateAclRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateAclRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateAclRequest): UpdateAclRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateAclRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateAclRequest;
  static deserializeBinaryFromReader(message: UpdateAclRequest, reader: jspb.BinaryReader): UpdateAclRequest;
}

export namespace UpdateAclRequest {
  export type AsObject = {
    ref: string,
    name: string,
    allowList: Array<string>,
  }
}

export class UpdateAclResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateAclResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateAclResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateAclResponse): UpdateAclResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateAclResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateAclResponse;
  static deserializeBinaryFromReader(message: UpdateAclResponse, reader: jspb.BinaryReader): UpdateAclResponse;
}

export namespace UpdateAclResponse {
  export type AsObject = {
    ref: string,
  }
}

export class GetAclRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): GetAclRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAclRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetAclRequest): GetAclRequest.AsObject;
  static serializeBinaryToWriter(message: GetAclRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetAclRequest;
  static deserializeBinaryFromReader(message: GetAclRequest, reader: jspb.BinaryReader): GetAclRequest;
}

export namespace GetAclRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteAclRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteAclRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteAclRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteAclRequest): DeleteAclRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteAclRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteAclRequest;
  static deserializeBinaryFromReader(message: DeleteAclRequest, reader: jspb.BinaryReader): DeleteAclRequest;
}

export namespace DeleteAclRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteAclResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteAclResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteAclResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteAclResponse): DeleteAclResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteAclResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteAclResponse;
  static deserializeBinaryFromReader(message: DeleteAclResponse, reader: jspb.BinaryReader): DeleteAclResponse;
}

export namespace DeleteAclResponse {
  export type AsObject = {
    ref: string,
  }
}

export class ListAclsRequest extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListAclsRequest;

  getPageToken(): string;
  setPageToken(value: string): ListAclsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListAclsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListAclsRequest): ListAclsRequest.AsObject;
  static serializeBinaryToWriter(message: ListAclsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListAclsRequest;
  static deserializeBinaryFromReader(message: ListAclsRequest, reader: jspb.BinaryReader): ListAclsRequest;
}

export namespace ListAclsRequest {
  export type AsObject = {
    pageSize: number,
    pageToken: string,
  }
}

export class ListAclsResponse extends jspb.Message {
  getItemsList(): Array<Acl>;
  setItemsList(value: Array<Acl>): ListAclsResponse;
  clearItemsList(): ListAclsResponse;
  addItems(value?: Acl, index?: number): Acl;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListAclsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListAclsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListAclsResponse): ListAclsResponse.AsObject;
  static serializeBinaryToWriter(message: ListAclsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListAclsResponse;
  static deserializeBinaryFromReader(message: ListAclsResponse, reader: jspb.BinaryReader): ListAclsResponse;
}

export namespace ListAclsResponse {
  export type AsObject = {
    itemsList: Array<Acl.AsObject>,
    nextPageToken: string,
  }
}

