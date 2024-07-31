import * as jspb from 'google-protobuf'



export class Number extends jspb.Message {
  getRef(): string;
  setRef(value: string): Number;

  getName(): string;
  setName(value: string): Number;

  getTelUrl(): string;
  setTelUrl(value: string): Number;

  getCity(): string;
  setCity(value: string): Number;

  getCountry(): string;
  setCountry(value: string): Number;

  getCountryIsoCode(): string;
  setCountryIsoCode(value: string): Number;

  getCreatedAt(): number;
  setCreatedAt(value: number): Number;

  getUpdatedAt(): number;
  setUpdatedAt(value: number): Number;

  getTrunk(): Number.Trunk | undefined;
  setTrunk(value?: Number.Trunk): Number;
  hasTrunk(): boolean;
  clearTrunk(): Number;

  getAgentAor(): string;
  setAgentAor(value: string): Number;

  getAppRef(): string;
  setAppRef(value: string): Number;

  getIngressHandlerCase(): Number.IngressHandlerCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Number.AsObject;
  static toObject(includeInstance: boolean, msg: Number): Number.AsObject;
  static serializeBinaryToWriter(message: Number, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Number;
  static deserializeBinaryFromReader(message: Number, reader: jspb.BinaryReader): Number;
}

export namespace Number {
  export type AsObject = {
    ref: string,
    name: string,
    telUrl: string,
    city: string,
    country: string,
    countryIsoCode: string,
    createdAt: number,
    updatedAt: number,
    trunk?: Number.Trunk.AsObject,
    agentAor: string,
    appRef: string,
  }

  export class Trunk extends jspb.Message {
    getRef(): string;
    setRef(value: string): Trunk;

    getName(): string;
    setName(value: string): Trunk;

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
    }
  }


  export enum IngressHandlerCase { 
    INGRESS_HANDLER_NOT_SET = 0,
    AGENT_AOR = 10,
    APP_REF = 11,
  }
}

export class CreateNumberRequest extends jspb.Message {
  getName(): string;
  setName(value: string): CreateNumberRequest;

  getTelUrl(): string;
  setTelUrl(value: string): CreateNumberRequest;

  getCity(): string;
  setCity(value: string): CreateNumberRequest;

  getCountry(): string;
  setCountry(value: string): CreateNumberRequest;

  getCountryIsoCode(): string;
  setCountryIsoCode(value: string): CreateNumberRequest;

  getTrunkRef(): string;
  setTrunkRef(value: string): CreateNumberRequest;

  getAgentAor(): string;
  setAgentAor(value: string): CreateNumberRequest;

  getAppRef(): string;
  setAppRef(value: string): CreateNumberRequest;

  getIngressHandlerCase(): CreateNumberRequest.IngressHandlerCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateNumberRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateNumberRequest): CreateNumberRequest.AsObject;
  static serializeBinaryToWriter(message: CreateNumberRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateNumberRequest;
  static deserializeBinaryFromReader(message: CreateNumberRequest, reader: jspb.BinaryReader): CreateNumberRequest;
}

export namespace CreateNumberRequest {
  export type AsObject = {
    name: string,
    telUrl: string,
    city: string,
    country: string,
    countryIsoCode: string,
    trunkRef: string,
    agentAor: string,
    appRef: string,
  }

  export enum IngressHandlerCase { 
    INGRESS_HANDLER_NOT_SET = 0,
    AGENT_AOR = 7,
    APP_REF = 8,
  }
}

export class CreateNumberResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): CreateNumberResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateNumberResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateNumberResponse): CreateNumberResponse.AsObject;
  static serializeBinaryToWriter(message: CreateNumberResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateNumberResponse;
  static deserializeBinaryFromReader(message: CreateNumberResponse, reader: jspb.BinaryReader): CreateNumberResponse;
}

export namespace CreateNumberResponse {
  export type AsObject = {
    ref: string,
  }
}

export class UpdateNumberRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateNumberRequest;

  getName(): string;
  setName(value: string): UpdateNumberRequest;

  getTrunkRef(): string;
  setTrunkRef(value: string): UpdateNumberRequest;

  getAgentAor(): string;
  setAgentAor(value: string): UpdateNumberRequest;

  getAppRef(): string;
  setAppRef(value: string): UpdateNumberRequest;

  getIngressHandlerCase(): UpdateNumberRequest.IngressHandlerCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateNumberRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateNumberRequest): UpdateNumberRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateNumberRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateNumberRequest;
  static deserializeBinaryFromReader(message: UpdateNumberRequest, reader: jspb.BinaryReader): UpdateNumberRequest;
}

export namespace UpdateNumberRequest {
  export type AsObject = {
    ref: string,
    name: string,
    trunkRef: string,
    agentAor: string,
    appRef: string,
  }

  export enum IngressHandlerCase { 
    INGRESS_HANDLER_NOT_SET = 0,
    AGENT_AOR = 4,
    APP_REF = 5,
  }
}

export class UpdateNumberResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateNumberResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateNumberResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateNumberResponse): UpdateNumberResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateNumberResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateNumberResponse;
  static deserializeBinaryFromReader(message: UpdateNumberResponse, reader: jspb.BinaryReader): UpdateNumberResponse;
}

export namespace UpdateNumberResponse {
  export type AsObject = {
    ref: string,
  }
}

export class GetNumberRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): GetNumberRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetNumberRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetNumberRequest): GetNumberRequest.AsObject;
  static serializeBinaryToWriter(message: GetNumberRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetNumberRequest;
  static deserializeBinaryFromReader(message: GetNumberRequest, reader: jspb.BinaryReader): GetNumberRequest;
}

export namespace GetNumberRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteNumberRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteNumberRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteNumberRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteNumberRequest): DeleteNumberRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteNumberRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteNumberRequest;
  static deserializeBinaryFromReader(message: DeleteNumberRequest, reader: jspb.BinaryReader): DeleteNumberRequest;
}

export namespace DeleteNumberRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteNumberResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteNumberResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteNumberResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteNumberResponse): DeleteNumberResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteNumberResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteNumberResponse;
  static deserializeBinaryFromReader(message: DeleteNumberResponse, reader: jspb.BinaryReader): DeleteNumberResponse;
}

export namespace DeleteNumberResponse {
  export type AsObject = {
    ref: string,
  }
}

export class ListNumbersRequest extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListNumbersRequest;

  getPageToken(): string;
  setPageToken(value: string): ListNumbersRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListNumbersRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListNumbersRequest): ListNumbersRequest.AsObject;
  static serializeBinaryToWriter(message: ListNumbersRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListNumbersRequest;
  static deserializeBinaryFromReader(message: ListNumbersRequest, reader: jspb.BinaryReader): ListNumbersRequest;
}

export namespace ListNumbersRequest {
  export type AsObject = {
    pageSize: number,
    pageToken: string,
  }
}

export class ListNumbersResponse extends jspb.Message {
  getItemsList(): Array<Number>;
  setItemsList(value: Array<Number>): ListNumbersResponse;
  clearItemsList(): ListNumbersResponse;
  addItems(value?: Number, index?: number): Number;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListNumbersResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListNumbersResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListNumbersResponse): ListNumbersResponse.AsObject;
  static serializeBinaryToWriter(message: ListNumbersResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListNumbersResponse;
  static deserializeBinaryFromReader(message: ListNumbersResponse, reader: jspb.BinaryReader): ListNumbersResponse;
}

export namespace ListNumbersResponse {
  export type AsObject = {
    itemsList: Array<Number.AsObject>,
    nextPageToken: string,
  }
}

