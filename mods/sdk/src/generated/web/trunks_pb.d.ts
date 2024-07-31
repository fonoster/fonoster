import * as jspb from 'google-protobuf'



export class TrunkURI extends jspb.Message {
  getHost(): string;
  setHost(value: string): TrunkURI;

  getPort(): number;
  setPort(value: number): TrunkURI;

  getTransport(): string;
  setTransport(value: string): TrunkURI;

  getUser(): string;
  setUser(value: string): TrunkURI;

  getWeight(): number;
  setWeight(value: number): TrunkURI;

  getPriority(): number;
  setPriority(value: number): TrunkURI;

  getEnabled(): boolean;
  setEnabled(value: boolean): TrunkURI;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrunkURI.AsObject;
  static toObject(includeInstance: boolean, msg: TrunkURI): TrunkURI.AsObject;
  static serializeBinaryToWriter(message: TrunkURI, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TrunkURI;
  static deserializeBinaryFromReader(message: TrunkURI, reader: jspb.BinaryReader): TrunkURI;
}

export namespace TrunkURI {
  export type AsObject = {
    host: string,
    port: number,
    transport: string,
    user: string,
    weight: number,
    priority: number,
    enabled: boolean,
  }
}

export class Trunk extends jspb.Message {
  getRef(): string;
  setRef(value: string): Trunk;

  getName(): string;
  setName(value: string): Trunk;

  getSendRegister(): boolean;
  setSendRegister(value: boolean): Trunk;

  getInboundUri(): string;
  setInboundUri(value: string): Trunk;

  getCreatedAt(): number;
  setCreatedAt(value: number): Trunk;

  getUpdatedAt(): number;
  setUpdatedAt(value: number): Trunk;

  getAccessControlList(): Trunk.Acl | undefined;
  setAccessControlList(value?: Trunk.Acl): Trunk;
  hasAccessControlList(): boolean;
  clearAccessControlList(): Trunk;

  getInboundCredentials(): Trunk.Credentials | undefined;
  setInboundCredentials(value?: Trunk.Credentials): Trunk;
  hasInboundCredentials(): boolean;
  clearInboundCredentials(): Trunk;

  getOutboundCredentials(): Trunk.Credentials | undefined;
  setOutboundCredentials(value?: Trunk.Credentials): Trunk;
  hasOutboundCredentials(): boolean;
  clearOutboundCredentials(): Trunk;

  getUrisList(): Array<TrunkURI>;
  setUrisList(value: Array<TrunkURI>): Trunk;
  clearUrisList(): Trunk;
  addUris(value?: TrunkURI, index?: number): TrunkURI;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Trunk.AsObject;
  static toObject(includeInstance: boolean, msg: Trunk): Trunk.AsObject;
  static serializeBinaryToWriter(message: Trunk, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Trunk;
  static deserializeBinaryFromReader(message: Trunk, reader: jspb.BinaryReader): Trunk;
}

export namespace Trunk {
  export type AsObject = {
    ref: string,
    name: string,
    sendRegister: boolean,
    inboundUri: string,
    createdAt: number,
    updatedAt: number,
    accessControlList?: Trunk.Acl.AsObject,
    inboundCredentials?: Trunk.Credentials.AsObject,
    outboundCredentials?: Trunk.Credentials.AsObject,
    urisList: Array<TrunkURI.AsObject>,
  }

  export class Acl extends jspb.Message {
    getRef(): string;
    setRef(value: string): Acl;

    getName(): string;
    setName(value: string): Acl;

    getAllowList(): Array<string>;
    setAllowList(value: Array<string>): Acl;
    clearAllowList(): Acl;
    addAllow(value: string, index?: number): Acl;

    getDenyList(): Array<string>;
    setDenyList(value: Array<string>): Acl;
    clearDenyList(): Acl;
    addDeny(value: string, index?: number): Acl;

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
      denyList: Array<string>,
    }
  }


  export class Credentials extends jspb.Message {
    getRef(): string;
    setRef(value: string): Credentials;

    getName(): string;
    setName(value: string): Credentials;

    getUsername(): string;
    setUsername(value: string): Credentials;

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
    }
  }

}

export class CreateTrunkRequest extends jspb.Message {
  getName(): string;
  setName(value: string): CreateTrunkRequest;

  getSendRegister(): boolean;
  setSendRegister(value: boolean): CreateTrunkRequest;

  getInboundUri(): string;
  setInboundUri(value: string): CreateTrunkRequest;

  getAccessControlListRef(): string;
  setAccessControlListRef(value: string): CreateTrunkRequest;

  getInboundCredentialsRef(): string;
  setInboundCredentialsRef(value: string): CreateTrunkRequest;

  getOutboundCredentialsRef(): string;
  setOutboundCredentialsRef(value: string): CreateTrunkRequest;

  getUrisList(): Array<TrunkURI>;
  setUrisList(value: Array<TrunkURI>): CreateTrunkRequest;
  clearUrisList(): CreateTrunkRequest;
  addUris(value?: TrunkURI, index?: number): TrunkURI;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateTrunkRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateTrunkRequest): CreateTrunkRequest.AsObject;
  static serializeBinaryToWriter(message: CreateTrunkRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateTrunkRequest;
  static deserializeBinaryFromReader(message: CreateTrunkRequest, reader: jspb.BinaryReader): CreateTrunkRequest;
}

export namespace CreateTrunkRequest {
  export type AsObject = {
    name: string,
    sendRegister: boolean,
    inboundUri: string,
    accessControlListRef: string,
    inboundCredentialsRef: string,
    outboundCredentialsRef: string,
    urisList: Array<TrunkURI.AsObject>,
  }
}

export class CreateTrunkResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): CreateTrunkResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateTrunkResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateTrunkResponse): CreateTrunkResponse.AsObject;
  static serializeBinaryToWriter(message: CreateTrunkResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateTrunkResponse;
  static deserializeBinaryFromReader(message: CreateTrunkResponse, reader: jspb.BinaryReader): CreateTrunkResponse;
}

export namespace CreateTrunkResponse {
  export type AsObject = {
    ref: string,
  }
}

export class UpdateTrunkRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateTrunkRequest;

  getName(): string;
  setName(value: string): UpdateTrunkRequest;

  getSendRegister(): boolean;
  setSendRegister(value: boolean): UpdateTrunkRequest;

  getInboundUri(): string;
  setInboundUri(value: string): UpdateTrunkRequest;

  getAccessControlListRef(): string;
  setAccessControlListRef(value: string): UpdateTrunkRequest;

  getInboundCredentialsRef(): string;
  setInboundCredentialsRef(value: string): UpdateTrunkRequest;

  getOutboundCredentialsRef(): string;
  setOutboundCredentialsRef(value: string): UpdateTrunkRequest;

  getUrisList(): Array<TrunkURI>;
  setUrisList(value: Array<TrunkURI>): UpdateTrunkRequest;
  clearUrisList(): UpdateTrunkRequest;
  addUris(value?: TrunkURI, index?: number): TrunkURI;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateTrunkRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateTrunkRequest): UpdateTrunkRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateTrunkRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateTrunkRequest;
  static deserializeBinaryFromReader(message: UpdateTrunkRequest, reader: jspb.BinaryReader): UpdateTrunkRequest;
}

export namespace UpdateTrunkRequest {
  export type AsObject = {
    ref: string,
    name: string,
    sendRegister: boolean,
    inboundUri: string,
    accessControlListRef: string,
    inboundCredentialsRef: string,
    outboundCredentialsRef: string,
    urisList: Array<TrunkURI.AsObject>,
  }
}

export class UpdateTrunkResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateTrunkResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateTrunkResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateTrunkResponse): UpdateTrunkResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateTrunkResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateTrunkResponse;
  static deserializeBinaryFromReader(message: UpdateTrunkResponse, reader: jspb.BinaryReader): UpdateTrunkResponse;
}

export namespace UpdateTrunkResponse {
  export type AsObject = {
    ref: string,
  }
}

export class GetTrunkRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): GetTrunkRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTrunkRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetTrunkRequest): GetTrunkRequest.AsObject;
  static serializeBinaryToWriter(message: GetTrunkRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTrunkRequest;
  static deserializeBinaryFromReader(message: GetTrunkRequest, reader: jspb.BinaryReader): GetTrunkRequest;
}

export namespace GetTrunkRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteTrunkRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteTrunkRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteTrunkRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteTrunkRequest): DeleteTrunkRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteTrunkRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteTrunkRequest;
  static deserializeBinaryFromReader(message: DeleteTrunkRequest, reader: jspb.BinaryReader): DeleteTrunkRequest;
}

export namespace DeleteTrunkRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteTrunkResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteTrunkResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteTrunkResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteTrunkResponse): DeleteTrunkResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteTrunkResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteTrunkResponse;
  static deserializeBinaryFromReader(message: DeleteTrunkResponse, reader: jspb.BinaryReader): DeleteTrunkResponse;
}

export namespace DeleteTrunkResponse {
  export type AsObject = {
    ref: string,
  }
}

export class ListTrunksRequest extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListTrunksRequest;

  getPageToken(): string;
  setPageToken(value: string): ListTrunksRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListTrunksRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListTrunksRequest): ListTrunksRequest.AsObject;
  static serializeBinaryToWriter(message: ListTrunksRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListTrunksRequest;
  static deserializeBinaryFromReader(message: ListTrunksRequest, reader: jspb.BinaryReader): ListTrunksRequest;
}

export namespace ListTrunksRequest {
  export type AsObject = {
    pageSize: number,
    pageToken: string,
  }
}

export class ListTrunksResponse extends jspb.Message {
  getItemsList(): Array<Trunk>;
  setItemsList(value: Array<Trunk>): ListTrunksResponse;
  clearItemsList(): ListTrunksResponse;
  addItems(value?: Trunk, index?: number): Trunk;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListTrunksResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListTrunksResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListTrunksResponse): ListTrunksResponse.AsObject;
  static serializeBinaryToWriter(message: ListTrunksResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListTrunksResponse;
  static deserializeBinaryFromReader(message: ListTrunksResponse, reader: jspb.BinaryReader): ListTrunksResponse;
}

export namespace ListTrunksResponse {
  export type AsObject = {
    itemsList: Array<Trunk.AsObject>,
    nextPageToken: string,
  }
}

