import * as jspb from 'google-protobuf'



export class GetBillingRequest extends jspb.Message {
  getOwnerRef(): string;
  setOwnerRef(value: string): GetBillingRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetBillingRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetBillingRequest): GetBillingRequest.AsObject;
  static serializeBinaryToWriter(message: GetBillingRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetBillingRequest;
  static deserializeBinaryFromReader(message: GetBillingRequest, reader: jspb.BinaryReader): GetBillingRequest;
}

export namespace GetBillingRequest {
  export type AsObject = {
    ownerRef: string,
  }
}

export class CreditSource extends jspb.Message {
  getKind(): string;
  setKind(value: string): CreditSource;

  getCredits(): number;
  setCredits(value: number): CreditSource;

  getExpiresAt(): string;
  setExpiresAt(value: string): CreditSource;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreditSource.AsObject;
  static toObject(includeInstance: boolean, msg: CreditSource): CreditSource.AsObject;
  static serializeBinaryToWriter(message: CreditSource, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreditSource;
  static deserializeBinaryFromReader(message: CreditSource, reader: jspb.BinaryReader): CreditSource;
}

export namespace CreditSource {
  export type AsObject = {
    kind: string,
    credits: number,
    expiresAt: string,
  }
}

export class BillingSummary extends jspb.Message {
  getPlan(): string;
  setPlan(value: string): BillingSummary;

  getStatus(): string;
  setStatus(value: string): BillingSummary;

  getBalance(): number;
  setBalance(value: number): BillingSummary;

  getOverdraft(): number;
  setOverdraft(value: number): BillingSummary;

  getSourcesList(): Array<CreditSource>;
  setSourcesList(value: Array<CreditSource>): BillingSummary;
  clearSourcesList(): BillingSummary;
  addSources(value?: CreditSource, index?: number): CreditSource;

  getPeriodEnd(): string;
  setPeriodEnd(value: string): BillingSummary;

  getAutoRecharge(): boolean;
  setAutoRecharge(value: boolean): BillingSummary;

  getRechargeThreshold(): number;
  setRechargeThreshold(value: number): BillingSummary;

  getRechargeAmount(): number;
  setRechargeAmount(value: number): BillingSummary;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BillingSummary.AsObject;
  static toObject(includeInstance: boolean, msg: BillingSummary): BillingSummary.AsObject;
  static serializeBinaryToWriter(message: BillingSummary, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BillingSummary;
  static deserializeBinaryFromReader(message: BillingSummary, reader: jspb.BinaryReader): BillingSummary;
}

export namespace BillingSummary {
  export type AsObject = {
    plan: string,
    status: string,
    balance: number,
    overdraft: number,
    sourcesList: Array<CreditSource.AsObject>,
    periodEnd: string,
    autoRecharge: boolean,
    rechargeThreshold: number,
    rechargeAmount: number,
  }
}

export class UpdateAutoRechargeRequest extends jspb.Message {
  getOwnerRef(): string;
  setOwnerRef(value: string): UpdateAutoRechargeRequest;

  getEnabled(): boolean;
  setEnabled(value: boolean): UpdateAutoRechargeRequest;

  getThreshold(): number;
  setThreshold(value: number): UpdateAutoRechargeRequest;

  getAmount(): number;
  setAmount(value: number): UpdateAutoRechargeRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateAutoRechargeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateAutoRechargeRequest): UpdateAutoRechargeRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateAutoRechargeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateAutoRechargeRequest;
  static deserializeBinaryFromReader(message: UpdateAutoRechargeRequest, reader: jspb.BinaryReader): UpdateAutoRechargeRequest;
}

export namespace UpdateAutoRechargeRequest {
  export type AsObject = {
    ownerRef: string,
    enabled: boolean,
    threshold: number,
    amount: number,
  }
}

export class CreateTopUpRequest extends jspb.Message {
  getOwnerRef(): string;
  setOwnerRef(value: string): CreateTopUpRequest;

  getCredits(): number;
  setCredits(value: number): CreateTopUpRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateTopUpRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateTopUpRequest): CreateTopUpRequest.AsObject;
  static serializeBinaryToWriter(message: CreateTopUpRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateTopUpRequest;
  static deserializeBinaryFromReader(message: CreateTopUpRequest, reader: jspb.BinaryReader): CreateTopUpRequest;
}

export namespace CreateTopUpRequest {
  export type AsObject = {
    ownerRef: string,
    credits: number,
  }
}

export class SubscribeRequest extends jspb.Message {
  getOwnerRef(): string;
  setOwnerRef(value: string): SubscribeRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SubscribeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SubscribeRequest): SubscribeRequest.AsObject;
  static serializeBinaryToWriter(message: SubscribeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SubscribeRequest;
  static deserializeBinaryFromReader(message: SubscribeRequest, reader: jspb.BinaryReader): SubscribeRequest;
}

export namespace SubscribeRequest {
  export type AsObject = {
    ownerRef: string,
  }
}

export class CreatePortalSessionRequest extends jspb.Message {
  getOwnerRef(): string;
  setOwnerRef(value: string): CreatePortalSessionRequest;

  getReturnUrl(): string;
  setReturnUrl(value: string): CreatePortalSessionRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreatePortalSessionRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreatePortalSessionRequest): CreatePortalSessionRequest.AsObject;
  static serializeBinaryToWriter(message: CreatePortalSessionRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreatePortalSessionRequest;
  static deserializeBinaryFromReader(message: CreatePortalSessionRequest, reader: jspb.BinaryReader): CreatePortalSessionRequest;
}

export namespace CreatePortalSessionRequest {
  export type AsObject = {
    ownerRef: string,
    returnUrl: string,
  }
}

export class CreatePortalSessionResponse extends jspb.Message {
  getUrl(): string;
  setUrl(value: string): CreatePortalSessionResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreatePortalSessionResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreatePortalSessionResponse): CreatePortalSessionResponse.AsObject;
  static serializeBinaryToWriter(message: CreatePortalSessionResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreatePortalSessionResponse;
  static deserializeBinaryFromReader(message: CreatePortalSessionResponse, reader: jspb.BinaryReader): CreatePortalSessionResponse;
}

export namespace CreatePortalSessionResponse {
  export type AsObject = {
    url: string,
  }
}

