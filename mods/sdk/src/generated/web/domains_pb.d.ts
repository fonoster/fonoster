import * as jspb from 'google-protobuf'



export class Domain extends jspb.Message {
  getRef(): string;
  setRef(value: string): Domain;

  getName(): string;
  setName(value: string): Domain;

  getDomainUri(): string;
  setDomainUri(value: string): Domain;

  getCreatedAt(): number;
  setCreatedAt(value: number): Domain;

  getUpdatedAt(): number;
  setUpdatedAt(value: number): Domain;

  getAccessControlList(): Domain.Acl | undefined;
  setAccessControlList(value?: Domain.Acl): Domain;
  hasAccessControlList(): boolean;
  clearAccessControlList(): Domain;

  getEgressPoliciesList(): Array<EgressPolicy>;
  setEgressPoliciesList(value: Array<EgressPolicy>): Domain;
  clearEgressPoliciesList(): Domain;
  addEgressPolicies(value?: EgressPolicy, index?: number): EgressPolicy;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Domain.AsObject;
  static toObject(includeInstance: boolean, msg: Domain): Domain.AsObject;
  static serializeBinaryToWriter(message: Domain, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Domain;
  static deserializeBinaryFromReader(message: Domain, reader: jspb.BinaryReader): Domain;
}

export namespace Domain {
  export type AsObject = {
    ref: string,
    name: string,
    domainUri: string,
    createdAt: number,
    updatedAt: number,
    accessControlList?: Domain.Acl.AsObject,
    egressPoliciesList: Array<EgressPolicy.AsObject>,
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

}

export class EgressPolicy extends jspb.Message {
  getRule(): string;
  setRule(value: string): EgressPolicy;

  getNumberRef(): string;
  setNumberRef(value: string): EgressPolicy;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EgressPolicy.AsObject;
  static toObject(includeInstance: boolean, msg: EgressPolicy): EgressPolicy.AsObject;
  static serializeBinaryToWriter(message: EgressPolicy, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EgressPolicy;
  static deserializeBinaryFromReader(message: EgressPolicy, reader: jspb.BinaryReader): EgressPolicy;
}

export namespace EgressPolicy {
  export type AsObject = {
    rule: string,
    numberRef: string,
  }
}

export class CreateDomainRequest extends jspb.Message {
  getName(): string;
  setName(value: string): CreateDomainRequest;

  getDomainUri(): string;
  setDomainUri(value: string): CreateDomainRequest;

  getAccessControlListRef(): string;
  setAccessControlListRef(value: string): CreateDomainRequest;

  getEgressPoliciesList(): Array<EgressPolicy>;
  setEgressPoliciesList(value: Array<EgressPolicy>): CreateDomainRequest;
  clearEgressPoliciesList(): CreateDomainRequest;
  addEgressPolicies(value?: EgressPolicy, index?: number): EgressPolicy;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateDomainRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateDomainRequest): CreateDomainRequest.AsObject;
  static serializeBinaryToWriter(message: CreateDomainRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateDomainRequest;
  static deserializeBinaryFromReader(message: CreateDomainRequest, reader: jspb.BinaryReader): CreateDomainRequest;
}

export namespace CreateDomainRequest {
  export type AsObject = {
    name: string,
    domainUri: string,
    accessControlListRef: string,
    egressPoliciesList: Array<EgressPolicy.AsObject>,
  }
}

export class CreateDomainResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): CreateDomainResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateDomainResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateDomainResponse): CreateDomainResponse.AsObject;
  static serializeBinaryToWriter(message: CreateDomainResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateDomainResponse;
  static deserializeBinaryFromReader(message: CreateDomainResponse, reader: jspb.BinaryReader): CreateDomainResponse;
}

export namespace CreateDomainResponse {
  export type AsObject = {
    ref: string,
  }
}

export class UpdateDomainRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateDomainRequest;

  getName(): string;
  setName(value: string): UpdateDomainRequest;

  getAccessControlListRef(): string;
  setAccessControlListRef(value: string): UpdateDomainRequest;

  getEgressPoliciesList(): Array<EgressPolicy>;
  setEgressPoliciesList(value: Array<EgressPolicy>): UpdateDomainRequest;
  clearEgressPoliciesList(): UpdateDomainRequest;
  addEgressPolicies(value?: EgressPolicy, index?: number): EgressPolicy;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateDomainRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateDomainRequest): UpdateDomainRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateDomainRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateDomainRequest;
  static deserializeBinaryFromReader(message: UpdateDomainRequest, reader: jspb.BinaryReader): UpdateDomainRequest;
}

export namespace UpdateDomainRequest {
  export type AsObject = {
    ref: string,
    name: string,
    accessControlListRef: string,
    egressPoliciesList: Array<EgressPolicy.AsObject>,
  }
}

export class UpdateDomainResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateDomainResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateDomainResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateDomainResponse): UpdateDomainResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateDomainResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateDomainResponse;
  static deserializeBinaryFromReader(message: UpdateDomainResponse, reader: jspb.BinaryReader): UpdateDomainResponse;
}

export namespace UpdateDomainResponse {
  export type AsObject = {
    ref: string,
  }
}

export class GetDomainRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): GetDomainRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDomainRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetDomainRequest): GetDomainRequest.AsObject;
  static serializeBinaryToWriter(message: GetDomainRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDomainRequest;
  static deserializeBinaryFromReader(message: GetDomainRequest, reader: jspb.BinaryReader): GetDomainRequest;
}

export namespace GetDomainRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteDomainRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteDomainRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteDomainRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteDomainRequest): DeleteDomainRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteDomainRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteDomainRequest;
  static deserializeBinaryFromReader(message: DeleteDomainRequest, reader: jspb.BinaryReader): DeleteDomainRequest;
}

export namespace DeleteDomainRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteDomainResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteDomainResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteDomainResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteDomainResponse): DeleteDomainResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteDomainResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteDomainResponse;
  static deserializeBinaryFromReader(message: DeleteDomainResponse, reader: jspb.BinaryReader): DeleteDomainResponse;
}

export namespace DeleteDomainResponse {
  export type AsObject = {
    ref: string,
  }
}

export class ListDomainsRequest extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListDomainsRequest;

  getPageToken(): string;
  setPageToken(value: string): ListDomainsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListDomainsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListDomainsRequest): ListDomainsRequest.AsObject;
  static serializeBinaryToWriter(message: ListDomainsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListDomainsRequest;
  static deserializeBinaryFromReader(message: ListDomainsRequest, reader: jspb.BinaryReader): ListDomainsRequest;
}

export namespace ListDomainsRequest {
  export type AsObject = {
    pageSize: number,
    pageToken: string,
  }
}

export class ListDomainsResponse extends jspb.Message {
  getItemsList(): Array<Domain>;
  setItemsList(value: Array<Domain>): ListDomainsResponse;
  clearItemsList(): ListDomainsResponse;
  addItems(value?: Domain, index?: number): Domain;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListDomainsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListDomainsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListDomainsResponse): ListDomainsResponse.AsObject;
  static serializeBinaryToWriter(message: ListDomainsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListDomainsResponse;
  static deserializeBinaryFromReader(message: ListDomainsResponse, reader: jspb.BinaryReader): ListDomainsResponse;
}

export namespace ListDomainsResponse {
  export type AsObject = {
    itemsList: Array<Domain.AsObject>,
    nextPageToken: string,
  }
}

