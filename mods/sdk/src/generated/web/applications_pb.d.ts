import * as jspb from 'google-protobuf'

import * as google_protobuf_struct_pb from 'google-protobuf/google/protobuf/struct_pb'; // proto import: "google/protobuf/struct.proto"


export class ProductContainer extends jspb.Message {
  getProductRef(): string;
  setProductRef(value: string): ProductContainer;

  getConfig(): google_protobuf_struct_pb.Struct | undefined;
  setConfig(value?: google_protobuf_struct_pb.Struct): ProductContainer;
  hasConfig(): boolean;
  clearConfig(): ProductContainer;

  getCredentials(): google_protobuf_struct_pb.Struct | undefined;
  setCredentials(value?: google_protobuf_struct_pb.Struct): ProductContainer;
  hasCredentials(): boolean;
  clearCredentials(): ProductContainer;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProductContainer.AsObject;
  static toObject(includeInstance: boolean, msg: ProductContainer): ProductContainer.AsObject;
  static serializeBinaryToWriter(message: ProductContainer, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProductContainer;
  static deserializeBinaryFromReader(message: ProductContainer, reader: jspb.BinaryReader): ProductContainer;
}

export namespace ProductContainer {
  export type AsObject = {
    productRef: string,
    config?: google_protobuf_struct_pb.Struct.AsObject,
    credentials?: google_protobuf_struct_pb.Struct.AsObject,
  }
}

export class Application extends jspb.Message {
  getRef(): string;
  setRef(value: string): Application;

  getName(): string;
  setName(value: string): Application;

  getType(): ApplicationType;
  setType(value: ApplicationType): Application;

  getEndpoint(): string;
  setEndpoint(value: string): Application;

  getTextToSpeech(): ProductContainer | undefined;
  setTextToSpeech(value?: ProductContainer): Application;
  hasTextToSpeech(): boolean;
  clearTextToSpeech(): Application;

  getSpeechToText(): ProductContainer | undefined;
  setSpeechToText(value?: ProductContainer): Application;
  hasSpeechToText(): boolean;
  clearSpeechToText(): Application;

  getIntelligence(): ProductContainer | undefined;
  setIntelligence(value?: ProductContainer): Application;
  hasIntelligence(): boolean;
  clearIntelligence(): Application;

  getCreatedAt(): number;
  setCreatedAt(value: number): Application;

  getUpdatedAt(): number;
  setUpdatedAt(value: number): Application;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Application.AsObject;
  static toObject(includeInstance: boolean, msg: Application): Application.AsObject;
  static serializeBinaryToWriter(message: Application, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Application;
  static deserializeBinaryFromReader(message: Application, reader: jspb.BinaryReader): Application;
}

export namespace Application {
  export type AsObject = {
    ref: string,
    name: string,
    type: ApplicationType,
    endpoint: string,
    textToSpeech?: ProductContainer.AsObject,
    speechToText?: ProductContainer.AsObject,
    intelligence?: ProductContainer.AsObject,
    createdAt: number,
    updatedAt: number,
  }
}

export class CreateApplicationRequest extends jspb.Message {
  getName(): string;
  setName(value: string): CreateApplicationRequest;

  getType(): ApplicationType;
  setType(value: ApplicationType): CreateApplicationRequest;

  getEndpoint(): string;
  setEndpoint(value: string): CreateApplicationRequest;

  getTextToSpeech(): ProductContainer | undefined;
  setTextToSpeech(value?: ProductContainer): CreateApplicationRequest;
  hasTextToSpeech(): boolean;
  clearTextToSpeech(): CreateApplicationRequest;

  getSpeechToText(): ProductContainer | undefined;
  setSpeechToText(value?: ProductContainer): CreateApplicationRequest;
  hasSpeechToText(): boolean;
  clearSpeechToText(): CreateApplicationRequest;

  getIntelligence(): ProductContainer | undefined;
  setIntelligence(value?: ProductContainer): CreateApplicationRequest;
  hasIntelligence(): boolean;
  clearIntelligence(): CreateApplicationRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateApplicationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateApplicationRequest): CreateApplicationRequest.AsObject;
  static serializeBinaryToWriter(message: CreateApplicationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateApplicationRequest;
  static deserializeBinaryFromReader(message: CreateApplicationRequest, reader: jspb.BinaryReader): CreateApplicationRequest;
}

export namespace CreateApplicationRequest {
  export type AsObject = {
    name: string,
    type: ApplicationType,
    endpoint: string,
    textToSpeech?: ProductContainer.AsObject,
    speechToText?: ProductContainer.AsObject,
    intelligence?: ProductContainer.AsObject,
  }
}

export class CreateApplicationResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): CreateApplicationResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateApplicationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateApplicationResponse): CreateApplicationResponse.AsObject;
  static serializeBinaryToWriter(message: CreateApplicationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateApplicationResponse;
  static deserializeBinaryFromReader(message: CreateApplicationResponse, reader: jspb.BinaryReader): CreateApplicationResponse;
}

export namespace CreateApplicationResponse {
  export type AsObject = {
    ref: string,
  }
}

export class GetApplicationRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): GetApplicationRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetApplicationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetApplicationRequest): GetApplicationRequest.AsObject;
  static serializeBinaryToWriter(message: GetApplicationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetApplicationRequest;
  static deserializeBinaryFromReader(message: GetApplicationRequest, reader: jspb.BinaryReader): GetApplicationRequest;
}

export namespace GetApplicationRequest {
  export type AsObject = {
    ref: string,
  }
}

export class ListApplicationsRequest extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListApplicationsRequest;

  getPageToken(): string;
  setPageToken(value: string): ListApplicationsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListApplicationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListApplicationsRequest): ListApplicationsRequest.AsObject;
  static serializeBinaryToWriter(message: ListApplicationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListApplicationsRequest;
  static deserializeBinaryFromReader(message: ListApplicationsRequest, reader: jspb.BinaryReader): ListApplicationsRequest;
}

export namespace ListApplicationsRequest {
  export type AsObject = {
    pageSize: number,
    pageToken: string,
  }
}

export class ListApplicationsResponse extends jspb.Message {
  getItemsList(): Array<Application>;
  setItemsList(value: Array<Application>): ListApplicationsResponse;
  clearItemsList(): ListApplicationsResponse;
  addItems(value?: Application, index?: number): Application;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListApplicationsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListApplicationsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListApplicationsResponse): ListApplicationsResponse.AsObject;
  static serializeBinaryToWriter(message: ListApplicationsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListApplicationsResponse;
  static deserializeBinaryFromReader(message: ListApplicationsResponse, reader: jspb.BinaryReader): ListApplicationsResponse;
}

export namespace ListApplicationsResponse {
  export type AsObject = {
    itemsList: Array<Application.AsObject>,
    nextPageToken: string,
  }
}

export class UpdateApplicationRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateApplicationRequest;

  getName(): string;
  setName(value: string): UpdateApplicationRequest;

  getType(): ApplicationType;
  setType(value: ApplicationType): UpdateApplicationRequest;

  getEndpoint(): string;
  setEndpoint(value: string): UpdateApplicationRequest;

  getTextToSpeech(): ProductContainer | undefined;
  setTextToSpeech(value?: ProductContainer): UpdateApplicationRequest;
  hasTextToSpeech(): boolean;
  clearTextToSpeech(): UpdateApplicationRequest;

  getSpeechToText(): ProductContainer | undefined;
  setSpeechToText(value?: ProductContainer): UpdateApplicationRequest;
  hasSpeechToText(): boolean;
  clearSpeechToText(): UpdateApplicationRequest;

  getIntelligence(): ProductContainer | undefined;
  setIntelligence(value?: ProductContainer): UpdateApplicationRequest;
  hasIntelligence(): boolean;
  clearIntelligence(): UpdateApplicationRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateApplicationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateApplicationRequest): UpdateApplicationRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateApplicationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateApplicationRequest;
  static deserializeBinaryFromReader(message: UpdateApplicationRequest, reader: jspb.BinaryReader): UpdateApplicationRequest;
}

export namespace UpdateApplicationRequest {
  export type AsObject = {
    ref: string,
    name: string,
    type: ApplicationType,
    endpoint: string,
    textToSpeech?: ProductContainer.AsObject,
    speechToText?: ProductContainer.AsObject,
    intelligence?: ProductContainer.AsObject,
  }
}

export class UpdateApplicationResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateApplicationResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateApplicationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateApplicationResponse): UpdateApplicationResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateApplicationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateApplicationResponse;
  static deserializeBinaryFromReader(message: UpdateApplicationResponse, reader: jspb.BinaryReader): UpdateApplicationResponse;
}

export namespace UpdateApplicationResponse {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteApplicationRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteApplicationRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteApplicationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteApplicationRequest): DeleteApplicationRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteApplicationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteApplicationRequest;
  static deserializeBinaryFromReader(message: DeleteApplicationRequest, reader: jspb.BinaryReader): DeleteApplicationRequest;
}

export namespace DeleteApplicationRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteApplicationResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteApplicationResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteApplicationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteApplicationResponse): DeleteApplicationResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteApplicationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteApplicationResponse;
  static deserializeBinaryFromReader(message: DeleteApplicationResponse, reader: jspb.BinaryReader): DeleteApplicationResponse;
}

export namespace DeleteApplicationResponse {
  export type AsObject = {
    ref: string,
  }
}

export enum ApplicationType { 
  EXTERNAL = 0,
}
