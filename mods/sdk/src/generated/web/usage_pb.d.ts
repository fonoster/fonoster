import * as jspb from 'google-protobuf'



export class GetUsageRequest extends jspb.Message {
  getFromDay(): string;
  setFromDay(value: string): GetUsageRequest;

  getToDay(): string;
  setToDay(value: string): GetUsageRequest;

  getGroupByList(): Array<string>;
  setGroupByList(value: Array<string>): GetUsageRequest;
  clearGroupByList(): GetUsageRequest;
  addGroupBy(value: string, index?: number): GetUsageRequest;

  getAllOwned(): boolean;
  setAllOwned(value: boolean): GetUsageRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetUsageRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetUsageRequest): GetUsageRequest.AsObject;
  static serializeBinaryToWriter(message: GetUsageRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetUsageRequest;
  static deserializeBinaryFromReader(message: GetUsageRequest, reader: jspb.BinaryReader): GetUsageRequest;
}

export namespace GetUsageRequest {
  export type AsObject = {
    fromDay: string,
    toDay: string,
    groupByList: Array<string>,
    allOwned: boolean,
  }
}

export class UsageRow extends jspb.Message {
  getDay(): string;
  setDay(value: string): UsageRow;

  getWorkspaceRef(): string;
  setWorkspaceRef(value: string): UsageRow;

  getMeter(): string;
  setMeter(value: string): UsageRow;

  getUnit(): string;
  setUnit(value: string): UsageRow;

  getProvider(): string;
  setProvider(value: string): UsageRow;

  getModel(): string;
  setModel(value: string): UsageRow;

  getKeySource(): string;
  setKeySource(value: string): UsageRow;

  getOrigin(): string;
  setOrigin(value: string): UsageRow;

  getQuantity(): number;
  setQuantity(value: number): UsageRow;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UsageRow.AsObject;
  static toObject(includeInstance: boolean, msg: UsageRow): UsageRow.AsObject;
  static serializeBinaryToWriter(message: UsageRow, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UsageRow;
  static deserializeBinaryFromReader(message: UsageRow, reader: jspb.BinaryReader): UsageRow;
}

export namespace UsageRow {
  export type AsObject = {
    day: string,
    workspaceRef: string,
    meter: string,
    unit: string,
    provider: string,
    model: string,
    keySource: string,
    origin: string,
    quantity: number,
  }
}

export class GetUsageResponse extends jspb.Message {
  getRowsList(): Array<UsageRow>;
  setRowsList(value: Array<UsageRow>): GetUsageResponse;
  clearRowsList(): GetUsageResponse;
  addRows(value?: UsageRow, index?: number): UsageRow;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetUsageResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetUsageResponse): GetUsageResponse.AsObject;
  static serializeBinaryToWriter(message: GetUsageResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetUsageResponse;
  static deserializeBinaryFromReader(message: GetUsageResponse, reader: jspb.BinaryReader): GetUsageResponse;
}

export namespace GetUsageResponse {
  export type AsObject = {
    rowsList: Array<UsageRow.AsObject>,
  }
}

