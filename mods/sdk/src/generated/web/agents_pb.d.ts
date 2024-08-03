import * as jspb from 'google-protobuf'



export class Agent extends jspb.Message {
  getRef(): string;
  setRef(value: string): Agent;

  getName(): string;
  setName(value: string): Agent;

  getUsername(): string;
  setUsername(value: string): Agent;

  getPrivacy(): Privacy;
  setPrivacy(value: Privacy): Agent;

  getEnabled(): boolean;
  setEnabled(value: boolean): Agent;

  getCreatedAt(): number;
  setCreatedAt(value: number): Agent;

  getUpdatedAt(): number;
  setUpdatedAt(value: number): Agent;

  getMaxContacts(): number;
  setMaxContacts(value: number): Agent;

  getExpires(): number;
  setExpires(value: number): Agent;

  getDomain(): Agent.Domain | undefined;
  setDomain(value?: Agent.Domain): Agent;
  hasDomain(): boolean;
  clearDomain(): Agent;

  getCredentials(): Agent.Credentials | undefined;
  setCredentials(value?: Agent.Credentials): Agent;
  hasCredentials(): boolean;
  clearCredentials(): Agent;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Agent.AsObject;
  static toObject(includeInstance: boolean, msg: Agent): Agent.AsObject;
  static serializeBinaryToWriter(message: Agent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Agent;
  static deserializeBinaryFromReader(message: Agent, reader: jspb.BinaryReader): Agent;
}

export namespace Agent {
  export type AsObject = {
    ref: string,
    name: string,
    username: string,
    privacy: Privacy,
    enabled: boolean,
    createdAt: number,
    updatedAt: number,
    maxContacts: number,
    expires: number,
    domain?: Agent.Domain.AsObject,
    credentials?: Agent.Credentials.AsObject,
  }

  export class Domain extends jspb.Message {
    getRef(): string;
    setRef(value: string): Domain;

    getName(): string;
    setName(value: string): Domain;

    getDomainUri(): string;
    setDomainUri(value: string): Domain;

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

export class CreateAgentRequest extends jspb.Message {
  getName(): string;
  setName(value: string): CreateAgentRequest;

  getUsername(): string;
  setUsername(value: string): CreateAgentRequest;

  getPrivacy(): Privacy;
  setPrivacy(value: Privacy): CreateAgentRequest;

  getEnabled(): boolean;
  setEnabled(value: boolean): CreateAgentRequest;

  getDomainRef(): string;
  setDomainRef(value: string): CreateAgentRequest;

  getCredentialsRef(): string;
  setCredentialsRef(value: string): CreateAgentRequest;

  getMaxContacts(): number;
  setMaxContacts(value: number): CreateAgentRequest;

  getExpires(): number;
  setExpires(value: number): CreateAgentRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateAgentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateAgentRequest): CreateAgentRequest.AsObject;
  static serializeBinaryToWriter(message: CreateAgentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateAgentRequest;
  static deserializeBinaryFromReader(message: CreateAgentRequest, reader: jspb.BinaryReader): CreateAgentRequest;
}

export namespace CreateAgentRequest {
  export type AsObject = {
    name: string,
    username: string,
    privacy: Privacy,
    enabled: boolean,
    domainRef: string,
    credentialsRef: string,
    maxContacts: number,
    expires: number,
  }
}

export class CreateAgentResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): CreateAgentResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateAgentResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateAgentResponse): CreateAgentResponse.AsObject;
  static serializeBinaryToWriter(message: CreateAgentResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateAgentResponse;
  static deserializeBinaryFromReader(message: CreateAgentResponse, reader: jspb.BinaryReader): CreateAgentResponse;
}

export namespace CreateAgentResponse {
  export type AsObject = {
    ref: string,
  }
}

export class UpdateAgentRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateAgentRequest;

  getName(): string;
  setName(value: string): UpdateAgentRequest;

  getPrivacy(): Privacy;
  setPrivacy(value: Privacy): UpdateAgentRequest;

  getEnabled(): boolean;
  setEnabled(value: boolean): UpdateAgentRequest;

  getDomainRef(): string;
  setDomainRef(value: string): UpdateAgentRequest;

  getCredentialsRef(): string;
  setCredentialsRef(value: string): UpdateAgentRequest;

  getMaxContacts(): number;
  setMaxContacts(value: number): UpdateAgentRequest;

  getExpires(): number;
  setExpires(value: number): UpdateAgentRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateAgentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateAgentRequest): UpdateAgentRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateAgentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateAgentRequest;
  static deserializeBinaryFromReader(message: UpdateAgentRequest, reader: jspb.BinaryReader): UpdateAgentRequest;
}

export namespace UpdateAgentRequest {
  export type AsObject = {
    ref: string,
    name: string,
    privacy: Privacy,
    enabled: boolean,
    domainRef: string,
    credentialsRef: string,
    maxContacts: number,
    expires: number,
  }
}

export class UpdateAgentResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateAgentResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateAgentResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateAgentResponse): UpdateAgentResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateAgentResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateAgentResponse;
  static deserializeBinaryFromReader(message: UpdateAgentResponse, reader: jspb.BinaryReader): UpdateAgentResponse;
}

export namespace UpdateAgentResponse {
  export type AsObject = {
    ref: string,
  }
}

export class GetAgentRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): GetAgentRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAgentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetAgentRequest): GetAgentRequest.AsObject;
  static serializeBinaryToWriter(message: GetAgentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetAgentRequest;
  static deserializeBinaryFromReader(message: GetAgentRequest, reader: jspb.BinaryReader): GetAgentRequest;
}

export namespace GetAgentRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteAgentRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteAgentRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteAgentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteAgentRequest): DeleteAgentRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteAgentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteAgentRequest;
  static deserializeBinaryFromReader(message: DeleteAgentRequest, reader: jspb.BinaryReader): DeleteAgentRequest;
}

export namespace DeleteAgentRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteAgentResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteAgentResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteAgentResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteAgentResponse): DeleteAgentResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteAgentResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteAgentResponse;
  static deserializeBinaryFromReader(message: DeleteAgentResponse, reader: jspb.BinaryReader): DeleteAgentResponse;
}

export namespace DeleteAgentResponse {
  export type AsObject = {
    ref: string,
  }
}

export class ListAgentsRequest extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListAgentsRequest;

  getPageToken(): string;
  setPageToken(value: string): ListAgentsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListAgentsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListAgentsRequest): ListAgentsRequest.AsObject;
  static serializeBinaryToWriter(message: ListAgentsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListAgentsRequest;
  static deserializeBinaryFromReader(message: ListAgentsRequest, reader: jspb.BinaryReader): ListAgentsRequest;
}

export namespace ListAgentsRequest {
  export type AsObject = {
    pageSize: number,
    pageToken: string,
  }
}

export class ListAgentsResponse extends jspb.Message {
  getItemsList(): Array<Agent>;
  setItemsList(value: Array<Agent>): ListAgentsResponse;
  clearItemsList(): ListAgentsResponse;
  addItems(value?: Agent, index?: number): Agent;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListAgentsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListAgentsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListAgentsResponse): ListAgentsResponse.AsObject;
  static serializeBinaryToWriter(message: ListAgentsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListAgentsResponse;
  static deserializeBinaryFromReader(message: ListAgentsResponse, reader: jspb.BinaryReader): ListAgentsResponse;
}

export namespace ListAgentsResponse {
  export type AsObject = {
    itemsList: Array<Agent.AsObject>,
    nextPageToken: string,
  }
}

export enum Privacy { 
  NONE = 0,
  PRIVATE = 1,
}
