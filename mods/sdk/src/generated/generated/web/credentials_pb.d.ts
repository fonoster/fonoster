import * as jspb from 'google-protobuf'



export class Credentials extends jspb.Message {
  getRef(): string;
  setRef(value: string): Credentials;

  getName(): string;
  setName(value: string): Credentials;

  getUsername(): string;
  setUsername(value: string): Credentials;

  getCreatedAt(): number;
  setCreatedAt(value: number): Credentials;

  getUpdatedAt(): number;
  setUpdatedAt(value: number): Credentials;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Credentials.AsObject;
  static toObject(includeInstance: boolean, msg: Credentials): Credentials.AsObject;
  static serializeBinaryToWriter(message: Credentials, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Credentials;
  static deserializeBinaryFromReader(message: Credentials, reader: jspb.BinaryReader): Credentials;
}

export namespace Credentials {
  export type AsObject = {
    ref: string,
    name: string,
    username: string,
    createdAt: number,
    updatedAt: number,
  }
}

export class CreateCredentialsRequest extends jspb.Message {
  getName(): string;
  setName(value: string): CreateCredentialsRequest;

  getUsername(): string;
  setUsername(value: string): CreateCredentialsRequest;

  getPassword(): string;
  setPassword(value: string): CreateCredentialsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateCredentialsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateCredentialsRequest): CreateCredentialsRequest.AsObject;
  static serializeBinaryToWriter(message: CreateCredentialsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateCredentialsRequest;
  static deserializeBinaryFromReader(message: CreateCredentialsRequest, reader: jspb.BinaryReader): CreateCredentialsRequest;
}

export namespace CreateCredentialsRequest {
  export type AsObject = {
    name: string,
    username: string,
    password: string,
  }
}

export class CreateCredentialsResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): CreateCredentialsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateCredentialsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateCredentialsResponse): CreateCredentialsResponse.AsObject;
  static serializeBinaryToWriter(message: CreateCredentialsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateCredentialsResponse;
  static deserializeBinaryFromReader(message: CreateCredentialsResponse, reader: jspb.BinaryReader): CreateCredentialsResponse;
}

export namespace CreateCredentialsResponse {
  export type AsObject = {
    ref: string,
  }
}

export class UpdateCredentialsRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateCredentialsRequest;

  getName(): string;
  setName(value: string): UpdateCredentialsRequest;

  getUsername(): string;
  setUsername(value: string): UpdateCredentialsRequest;

  getPassword(): string;
  setPassword(value: string): UpdateCredentialsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateCredentialsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateCredentialsRequest): UpdateCredentialsRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateCredentialsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateCredentialsRequest;
  static deserializeBinaryFromReader(message: UpdateCredentialsRequest, reader: jspb.BinaryReader): UpdateCredentialsRequest;
}

export namespace UpdateCredentialsRequest {
  export type AsObject = {
    ref: string,
    name: string,
    username: string,
    password: string,
  }
}

export class UpdateCredentialsResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateCredentialsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateCredentialsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateCredentialsResponse): UpdateCredentialsResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateCredentialsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateCredentialsResponse;
  static deserializeBinaryFromReader(message: UpdateCredentialsResponse, reader: jspb.BinaryReader): UpdateCredentialsResponse;
}

export namespace UpdateCredentialsResponse {
  export type AsObject = {
    ref: string,
  }
}

export class GetCredentialsRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): GetCredentialsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetCredentialsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetCredentialsRequest): GetCredentialsRequest.AsObject;
  static serializeBinaryToWriter(message: GetCredentialsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetCredentialsRequest;
  static deserializeBinaryFromReader(message: GetCredentialsRequest, reader: jspb.BinaryReader): GetCredentialsRequest;
}

export namespace GetCredentialsRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteCredentialsRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteCredentialsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteCredentialsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteCredentialsRequest): DeleteCredentialsRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteCredentialsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteCredentialsRequest;
  static deserializeBinaryFromReader(message: DeleteCredentialsRequest, reader: jspb.BinaryReader): DeleteCredentialsRequest;
}

export namespace DeleteCredentialsRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteCredentialsResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteCredentialsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteCredentialsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteCredentialsResponse): DeleteCredentialsResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteCredentialsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteCredentialsResponse;
  static deserializeBinaryFromReader(message: DeleteCredentialsResponse, reader: jspb.BinaryReader): DeleteCredentialsResponse;
}

export namespace DeleteCredentialsResponse {
  export type AsObject = {
    ref: string,
  }
}

export class ListCredentialsRequest extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListCredentialsRequest;

  getPageToken(): string;
  setPageToken(value: string): ListCredentialsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListCredentialsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListCredentialsRequest): ListCredentialsRequest.AsObject;
  static serializeBinaryToWriter(message: ListCredentialsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListCredentialsRequest;
  static deserializeBinaryFromReader(message: ListCredentialsRequest, reader: jspb.BinaryReader): ListCredentialsRequest;
}

export namespace ListCredentialsRequest {
  export type AsObject = {
    pageSize: number,
    pageToken: string,
  }
}

export class ListCredentialsResponse extends jspb.Message {
  getItemsList(): Array<Credentials>;
  setItemsList(value: Array<Credentials>): ListCredentialsResponse;
  clearItemsList(): ListCredentialsResponse;
  addItems(value?: Credentials, index?: number): Credentials;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListCredentialsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListCredentialsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListCredentialsResponse): ListCredentialsResponse.AsObject;
  static serializeBinaryToWriter(message: ListCredentialsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListCredentialsResponse;
  static deserializeBinaryFromReader(message: ListCredentialsResponse, reader: jspb.BinaryReader): ListCredentialsResponse;
}

export namespace ListCredentialsResponse {
  export type AsObject = {
    itemsList: Array<Credentials.AsObject>,
    nextPageToken: string,
  }
}

