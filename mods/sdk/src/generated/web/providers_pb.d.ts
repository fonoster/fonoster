import * as jspb from 'google-protobuf'



export class CatalogItem extends jspb.Message {
  getId(): string;
  setId(value: string): CatalogItem;

  getKind(): string;
  setKind(value: string): CatalogItem;

  getState(): string;
  setState(value: string): CatalogItem;

  getProviderId(): string;
  setProviderId(value: string): CatalogItem;

  getType(): string;
  setType(value: string): CatalogItem;

  getCapabilitiesList(): Array<string>;
  setCapabilitiesList(value: Array<string>): CatalogItem;
  clearCapabilitiesList(): CatalogItem;
  addCapabilities(value: string, index?: number): CatalogItem;

  getLanguagesList(): Array<string>;
  setLanguagesList(value: Array<string>): CatalogItem;
  clearLanguagesList(): CatalogItem;
  addLanguages(value: string, index?: number): CatalogItem;

  getFeaturesList(): Array<string>;
  setFeaturesList(value: Array<string>): CatalogItem;
  clearFeaturesList(): CatalogItem;
  addFeatures(value: string, index?: number): CatalogItem;

  getModelsList(): Array<string>;
  setModelsList(value: Array<string>): CatalogItem;
  clearModelsList(): CatalogItem;
  addModels(value: string, index?: number): CatalogItem;

  getGender(): string;
  setGender(value: string): CatalogItem;

  getReplacement(): string;
  setReplacement(value: string): CatalogItem;

  getRetireOn(): string;
  setRetireOn(value: string): CatalogItem;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CatalogItem.AsObject;
  static toObject(includeInstance: boolean, msg: CatalogItem): CatalogItem.AsObject;
  static serializeBinaryToWriter(message: CatalogItem, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CatalogItem;
  static deserializeBinaryFromReader(message: CatalogItem, reader: jspb.BinaryReader): CatalogItem;
}

export namespace CatalogItem {
  export type AsObject = {
    id: string,
    kind: string,
    state: string,
    providerId: string,
    type: string,
    capabilitiesList: Array<string>,
    languagesList: Array<string>,
    featuresList: Array<string>,
    modelsList: Array<string>,
    gender: string,
    replacement: string,
    retireOn: string,
  }
}

export class ListCatalogRequest extends jspb.Message {
  getKind(): string;
  setKind(value: string): ListCatalogRequest;

  getType(): string;
  setType(value: string): ListCatalogRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListCatalogRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListCatalogRequest): ListCatalogRequest.AsObject;
  static serializeBinaryToWriter(message: ListCatalogRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListCatalogRequest;
  static deserializeBinaryFromReader(message: ListCatalogRequest, reader: jspb.BinaryReader): ListCatalogRequest;
}

export namespace ListCatalogRequest {
  export type AsObject = {
    kind: string,
    type: string,
  }
}

export class ListCatalogResponse extends jspb.Message {
  getItemsList(): Array<CatalogItem>;
  setItemsList(value: Array<CatalogItem>): ListCatalogResponse;
  clearItemsList(): ListCatalogResponse;
  addItems(value?: CatalogItem, index?: number): CatalogItem;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListCatalogResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListCatalogResponse): ListCatalogResponse.AsObject;
  static serializeBinaryToWriter(message: ListCatalogResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListCatalogResponse;
  static deserializeBinaryFromReader(message: ListCatalogResponse, reader: jspb.BinaryReader): ListCatalogResponse;
}

export namespace ListCatalogResponse {
  export type AsObject = {
    itemsList: Array<CatalogItem.AsObject>,
  }
}

export class ProviderKey extends jspb.Message {
  getRef(): string;
  setRef(value: string): ProviderKey;

  getProviderId(): string;
  setProviderId(value: string): ProviderKey;

  getSecretRef(): string;
  setSecretRef(value: string): ProviderKey;

  getCreatedAt(): number;
  setCreatedAt(value: number): ProviderKey;

  getUpdatedAt(): number;
  setUpdatedAt(value: number): ProviderKey;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProviderKey.AsObject;
  static toObject(includeInstance: boolean, msg: ProviderKey): ProviderKey.AsObject;
  static serializeBinaryToWriter(message: ProviderKey, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProviderKey;
  static deserializeBinaryFromReader(message: ProviderKey, reader: jspb.BinaryReader): ProviderKey;
}

export namespace ProviderKey {
  export type AsObject = {
    ref: string,
    providerId: string,
    secretRef: string,
    createdAt: number,
    updatedAt: number,
  }
}

export class SetProviderKeyRequest extends jspb.Message {
  getProviderId(): string;
  setProviderId(value: string): SetProviderKeyRequest;

  getKey(): string;
  setKey(value: string): SetProviderKeyRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetProviderKeyRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SetProviderKeyRequest): SetProviderKeyRequest.AsObject;
  static serializeBinaryToWriter(message: SetProviderKeyRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetProviderKeyRequest;
  static deserializeBinaryFromReader(message: SetProviderKeyRequest, reader: jspb.BinaryReader): SetProviderKeyRequest;
}

export namespace SetProviderKeyRequest {
  export type AsObject = {
    providerId: string,
    key: string,
  }
}

export class ListProviderKeysRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListProviderKeysRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListProviderKeysRequest): ListProviderKeysRequest.AsObject;
  static serializeBinaryToWriter(message: ListProviderKeysRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListProviderKeysRequest;
  static deserializeBinaryFromReader(message: ListProviderKeysRequest, reader: jspb.BinaryReader): ListProviderKeysRequest;
}

export namespace ListProviderKeysRequest {
  export type AsObject = {
  }
}

export class ListProviderKeysResponse extends jspb.Message {
  getItemsList(): Array<ProviderKey>;
  setItemsList(value: Array<ProviderKey>): ListProviderKeysResponse;
  clearItemsList(): ListProviderKeysResponse;
  addItems(value?: ProviderKey, index?: number): ProviderKey;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListProviderKeysResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListProviderKeysResponse): ListProviderKeysResponse.AsObject;
  static serializeBinaryToWriter(message: ListProviderKeysResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListProviderKeysResponse;
  static deserializeBinaryFromReader(message: ListProviderKeysResponse, reader: jspb.BinaryReader): ListProviderKeysResponse;
}

export namespace ListProviderKeysResponse {
  export type AsObject = {
    itemsList: Array<ProviderKey.AsObject>,
  }
}

export class DeleteProviderKeyRequest extends jspb.Message {
  getProviderId(): string;
  setProviderId(value: string): DeleteProviderKeyRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteProviderKeyRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteProviderKeyRequest): DeleteProviderKeyRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteProviderKeyRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteProviderKeyRequest;
  static deserializeBinaryFromReader(message: DeleteProviderKeyRequest, reader: jspb.BinaryReader): DeleteProviderKeyRequest;
}

export namespace DeleteProviderKeyRequest {
  export type AsObject = {
    providerId: string,
  }
}

export class DeleteProviderKeyResponse extends jspb.Message {
  getProviderId(): string;
  setProviderId(value: string): DeleteProviderKeyResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteProviderKeyResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteProviderKeyResponse): DeleteProviderKeyResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteProviderKeyResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteProviderKeyResponse;
  static deserializeBinaryFromReader(message: DeleteProviderKeyResponse, reader: jspb.BinaryReader): DeleteProviderKeyResponse;
}

export namespace DeleteProviderKeyResponse {
  export type AsObject = {
    providerId: string,
  }
}

