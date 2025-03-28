import * as jspb from 'google-protobuf'

import * as google_protobuf_struct_pb from 'google-protobuf/google/protobuf/struct_pb'; // proto import: "google/protobuf/struct.proto"


export class CallDetailRecord extends jspb.Message {
  getRef(): string;
  setRef(value: string): CallDetailRecord;

  getCallId(): string;
  setCallId(value: string): CallDetailRecord;

  getType(): CallType;
  setType(value: CallType): CallDetailRecord;

  getStatus(): CallStatus;
  setStatus(value: CallStatus): CallDetailRecord;

  getStartedAt(): number;
  setStartedAt(value: number): CallDetailRecord;

  getEndedAt(): number;
  setEndedAt(value: number): CallDetailRecord;

  getFrom(): string;
  setFrom(value: string): CallDetailRecord;

  getTo(): string;
  setTo(value: string): CallDetailRecord;

  getDuration(): number;
  setDuration(value: number): CallDetailRecord;

  getDirection(): CallDirection;
  setDirection(value: CallDirection): CallDetailRecord;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CallDetailRecord.AsObject;
  static toObject(includeInstance: boolean, msg: CallDetailRecord): CallDetailRecord.AsObject;
  static serializeBinaryToWriter(message: CallDetailRecord, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CallDetailRecord;
  static deserializeBinaryFromReader(message: CallDetailRecord, reader: jspb.BinaryReader): CallDetailRecord;
}

export namespace CallDetailRecord {
  export type AsObject = {
    ref: string,
    callId: string,
    type: CallType,
    status: CallStatus,
    startedAt: number,
    endedAt: number,
    from: string,
    to: string,
    duration: number,
    direction: CallDirection,
  }
}

export class CreateCallRequest extends jspb.Message {
  getFrom(): string;
  setFrom(value: string): CreateCallRequest;

  getTo(): string;
  setTo(value: string): CreateCallRequest;

  getAppRef(): string;
  setAppRef(value: string): CreateCallRequest;

  getTimeout(): number;
  setTimeout(value: number): CreateCallRequest;

  getMetadata(): google_protobuf_struct_pb.Struct | undefined;
  setMetadata(value?: google_protobuf_struct_pb.Struct): CreateCallRequest;
  hasMetadata(): boolean;
  clearMetadata(): CreateCallRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateCallRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateCallRequest): CreateCallRequest.AsObject;
  static serializeBinaryToWriter(message: CreateCallRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateCallRequest;
  static deserializeBinaryFromReader(message: CreateCallRequest, reader: jspb.BinaryReader): CreateCallRequest;
}

export namespace CreateCallRequest {
  export type AsObject = {
    from: string,
    to: string,
    appRef: string,
    timeout: number,
    metadata?: google_protobuf_struct_pb.Struct.AsObject,
  }
}

export class CreateCallResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): CreateCallResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateCallResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateCallResponse): CreateCallResponse.AsObject;
  static serializeBinaryToWriter(message: CreateCallResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateCallResponse;
  static deserializeBinaryFromReader(message: CreateCallResponse, reader: jspb.BinaryReader): CreateCallResponse;
}

export namespace CreateCallResponse {
  export type AsObject = {
    ref: string,
  }
}

export class ListCallsRequest extends jspb.Message {
  getAfter(): string;
  setAfter(value: string): ListCallsRequest;

  getBefore(): string;
  setBefore(value: string): ListCallsRequest;

  getType(): CallType;
  setType(value: CallType): ListCallsRequest;

  getStatus(): CallStatus;
  setStatus(value: CallStatus): ListCallsRequest;

  getFrom(): string;
  setFrom(value: string): ListCallsRequest;

  getTo(): string;
  setTo(value: string): ListCallsRequest;

  getPageSize(): number;
  setPageSize(value: number): ListCallsRequest;

  getPageToken(): string;
  setPageToken(value: string): ListCallsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListCallsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListCallsRequest): ListCallsRequest.AsObject;
  static serializeBinaryToWriter(message: ListCallsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListCallsRequest;
  static deserializeBinaryFromReader(message: ListCallsRequest, reader: jspb.BinaryReader): ListCallsRequest;
}

export namespace ListCallsRequest {
  export type AsObject = {
    after: string,
    before: string,
    type: CallType,
    status: CallStatus,
    from: string,
    to: string,
    pageSize: number,
    pageToken: string,
  }
}

export class ListCallsResponse extends jspb.Message {
  getItemsList(): Array<CallDetailRecord>;
  setItemsList(value: Array<CallDetailRecord>): ListCallsResponse;
  clearItemsList(): ListCallsResponse;
  addItems(value?: CallDetailRecord, index?: number): CallDetailRecord;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListCallsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListCallsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListCallsResponse): ListCallsResponse.AsObject;
  static serializeBinaryToWriter(message: ListCallsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListCallsResponse;
  static deserializeBinaryFromReader(message: ListCallsResponse, reader: jspb.BinaryReader): ListCallsResponse;
}

export namespace ListCallsResponse {
  export type AsObject = {
    itemsList: Array<CallDetailRecord.AsObject>,
    nextPageToken: string,
  }
}

export class GetCallRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): GetCallRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetCallRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetCallRequest): GetCallRequest.AsObject;
  static serializeBinaryToWriter(message: GetCallRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetCallRequest;
  static deserializeBinaryFromReader(message: GetCallRequest, reader: jspb.BinaryReader): GetCallRequest;
}

export namespace GetCallRequest {
  export type AsObject = {
    ref: string,
  }
}

export class TrackCallRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): TrackCallRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrackCallRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TrackCallRequest): TrackCallRequest.AsObject;
  static serializeBinaryToWriter(message: TrackCallRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TrackCallRequest;
  static deserializeBinaryFromReader(message: TrackCallRequest, reader: jspb.BinaryReader): TrackCallRequest;
}

export namespace TrackCallRequest {
  export type AsObject = {
    ref: string,
  }
}

export class TrackCallResponse extends jspb.Message {
  getStatus(): TrackCallResponse.Status;
  setStatus(value: TrackCallResponse.Status): TrackCallResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrackCallResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TrackCallResponse): TrackCallResponse.AsObject;
  static serializeBinaryToWriter(message: TrackCallResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TrackCallResponse;
  static deserializeBinaryFromReader(message: TrackCallResponse, reader: jspb.BinaryReader): TrackCallResponse;
}

export namespace TrackCallResponse {
  export type AsObject = {
    status: TrackCallResponse.Status,
  }

  export enum Status { 
    TRYING = 0,
    CANCEL = 1,
    ANSWER = 2,
    BUSY = 3,
    PROGRESS = 4,
    NOANSWER = 5,
    FAILED = 6,
  }
}

export enum CallType { 
  SIP_ORIGINATED = 0,
  API_ORIGINATED = 1,
}
export enum CallStatus { 
  UNKNOWN = 0,
  NORMAL_CLEARING = 1,
  CALL_REJECTED = 2,
  UNALLOCATED = 3,
  NO_USER_RESPONSE = 4,
  NO_ROUTE_DESTINATION = 5,
  NO_ANSWER = 6,
  USER_BUSY = 7,
  NOT_ACCEPTABLE_HERE = 8,
  SERVICE_UNAVAILABLE = 9,
  INVALID_NUMBER_FORMAT = 10,
}
export enum CallDirection { 
  FROM_PSTN = 0,
  TO_PSTN = 1,
  INTRA_NETWORK = 2,
}
