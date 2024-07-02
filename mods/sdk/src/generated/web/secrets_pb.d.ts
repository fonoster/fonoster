import * as jspb from 'google-protobuf'



export class Secret extends jspb.Message {
  getRef(): string;
  setRef(value: string): Secret;

  getName(): string;
  setName(value: string): Secret;

  getSecret(): string;
  setSecret(value: string): Secret;

  getCreatedAt(): number;
  setCreatedAt(value: number): Secret;

  getUpdatedAt(): number;
  setUpdatedAt(value: number): Secret;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Secret.AsObject;
  static toObject(includeInstance: boolean, msg: Secret): Secret.AsObject;
  static serializeBinaryToWriter(message: Secret, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Secret;
  static deserializeBinaryFromReader(message: Secret, reader: jspb.BinaryReader): Secret;
}

export namespace Secret {
  export type AsObject = {
    ref: string,
    name: string,
    secret: string,
    createdAt: number,
    updatedAt: number,
  }
}

export class CreateSecretRequest extends jspb.Message {
  getName(): string;
  setName(value: string): CreateSecretRequest;

  getSecret(): string;
  setSecret(value: string): CreateSecretRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateSecretRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateSecretRequest): CreateSecretRequest.AsObject;
  static serializeBinaryToWriter(message: CreateSecretRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateSecretRequest;
  static deserializeBinaryFromReader(message: CreateSecretRequest, reader: jspb.BinaryReader): CreateSecretRequest;
}

export namespace CreateSecretRequest {
  export type AsObject = {
    name: string,
    secret: string,
  }
}

export class CreateSecretResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): CreateSecretResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateSecretResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateSecretResponse): CreateSecretResponse.AsObject;
  static serializeBinaryToWriter(message: CreateSecretResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateSecretResponse;
  static deserializeBinaryFromReader(message: CreateSecretResponse, reader: jspb.BinaryReader): CreateSecretResponse;
}

export namespace CreateSecretResponse {
  export type AsObject = {
    ref: string,
  }
}

export class UpdateSecretRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateSecretRequest;

  getName(): string;
  setName(value: string): UpdateSecretRequest;

  getSecret(): string;
  setSecret(value: string): UpdateSecretRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateSecretRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateSecretRequest): UpdateSecretRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateSecretRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateSecretRequest;
  static deserializeBinaryFromReader(message: UpdateSecretRequest, reader: jspb.BinaryReader): UpdateSecretRequest;
}

export namespace UpdateSecretRequest {
  export type AsObject = {
    ref: string,
    name: string,
    secret: string,
  }
}

export class UpdateSecretResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateSecretResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateSecretResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateSecretResponse): UpdateSecretResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateSecretResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateSecretResponse;
  static deserializeBinaryFromReader(message: UpdateSecretResponse, reader: jspb.BinaryReader): UpdateSecretResponse;
}

export namespace UpdateSecretResponse {
  export type AsObject = {
    ref: string,
  }
}

export class GetSecretRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): GetSecretRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetSecretRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetSecretRequest): GetSecretRequest.AsObject;
  static serializeBinaryToWriter(message: GetSecretRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetSecretRequest;
  static deserializeBinaryFromReader(message: GetSecretRequest, reader: jspb.BinaryReader): GetSecretRequest;
}

export namespace GetSecretRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteSecretRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteSecretRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteSecretRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteSecretRequest): DeleteSecretRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteSecretRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteSecretRequest;
  static deserializeBinaryFromReader(message: DeleteSecretRequest, reader: jspb.BinaryReader): DeleteSecretRequest;
}

export namespace DeleteSecretRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteSecretResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteSecretResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteSecretResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteSecretResponse): DeleteSecretResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteSecretResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteSecretResponse;
  static deserializeBinaryFromReader(message: DeleteSecretResponse, reader: jspb.BinaryReader): DeleteSecretResponse;
}

export namespace DeleteSecretResponse {
  export type AsObject = {
    ref: string,
  }
}

export class ListSecretsRequest extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListSecretsRequest;

  getPageToken(): string;
  setPageToken(value: string): ListSecretsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListSecretsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListSecretsRequest): ListSecretsRequest.AsObject;
  static serializeBinaryToWriter(message: ListSecretsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListSecretsRequest;
  static deserializeBinaryFromReader(message: ListSecretsRequest, reader: jspb.BinaryReader): ListSecretsRequest;
}

export namespace ListSecretsRequest {
  export type AsObject = {
    pageSize: number,
    pageToken: string,
  }
}

export class ListSecretsResponse extends jspb.Message {
  getItemsList(): Array<Secret>;
  setItemsList(value: Array<Secret>): ListSecretsResponse;
  clearItemsList(): ListSecretsResponse;
  addItems(value?: Secret, index?: number): Secret;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListSecretsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListSecretsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListSecretsResponse): ListSecretsResponse.AsObject;
  static serializeBinaryToWriter(message: ListSecretsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListSecretsResponse;
  static deserializeBinaryFromReader(message: ListSecretsResponse, reader: jspb.BinaryReader): ListSecretsResponse;
}

export namespace ListSecretsResponse {
  export type AsObject = {
    itemsList: Array<Secret.AsObject>,
    nextPageToken: string,
  }
}

