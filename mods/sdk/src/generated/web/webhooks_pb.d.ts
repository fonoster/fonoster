import * as jspb from 'google-protobuf'



export class Webhook extends jspb.Message {
  getRef(): string;
  setRef(value: string): Webhook;

  getUrl(): string;
  setUrl(value: string): Webhook;

  getEventsList(): Array<string>;
  setEventsList(value: Array<string>): Webhook;
  clearEventsList(): Webhook;
  addEvents(value: string, index?: number): Webhook;

  getSecretHint(): string;
  setSecretHint(value: string): Webhook;

  getPreviousSecretUntil(): number;
  setPreviousSecretUntil(value: number): Webhook;

  getCreatedAt(): number;
  setCreatedAt(value: number): Webhook;

  getUpdatedAt(): number;
  setUpdatedAt(value: number): Webhook;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Webhook.AsObject;
  static toObject(includeInstance: boolean, msg: Webhook): Webhook.AsObject;
  static serializeBinaryToWriter(message: Webhook, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Webhook;
  static deserializeBinaryFromReader(message: Webhook, reader: jspb.BinaryReader): Webhook;
}

export namespace Webhook {
  export type AsObject = {
    ref: string,
    url: string,
    eventsList: Array<string>,
    secretHint: string,
    previousSecretUntil: number,
    createdAt: number,
    updatedAt: number,
  }
}

export class CreateWebhookRequest extends jspb.Message {
  getUrl(): string;
  setUrl(value: string): CreateWebhookRequest;

  getEventsList(): Array<string>;
  setEventsList(value: Array<string>): CreateWebhookRequest;
  clearEventsList(): CreateWebhookRequest;
  addEvents(value: string, index?: number): CreateWebhookRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateWebhookRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateWebhookRequest): CreateWebhookRequest.AsObject;
  static serializeBinaryToWriter(message: CreateWebhookRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateWebhookRequest;
  static deserializeBinaryFromReader(message: CreateWebhookRequest, reader: jspb.BinaryReader): CreateWebhookRequest;
}

export namespace CreateWebhookRequest {
  export type AsObject = {
    url: string,
    eventsList: Array<string>,
  }
}

export class CreateWebhookResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): CreateWebhookResponse;

  getSecret(): string;
  setSecret(value: string): CreateWebhookResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateWebhookResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateWebhookResponse): CreateWebhookResponse.AsObject;
  static serializeBinaryToWriter(message: CreateWebhookResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateWebhookResponse;
  static deserializeBinaryFromReader(message: CreateWebhookResponse, reader: jspb.BinaryReader): CreateWebhookResponse;
}

export namespace CreateWebhookResponse {
  export type AsObject = {
    ref: string,
    secret: string,
  }
}

export class ListWebhooksRequest extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListWebhooksRequest;

  getPageToken(): string;
  setPageToken(value: string): ListWebhooksRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListWebhooksRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListWebhooksRequest): ListWebhooksRequest.AsObject;
  static serializeBinaryToWriter(message: ListWebhooksRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListWebhooksRequest;
  static deserializeBinaryFromReader(message: ListWebhooksRequest, reader: jspb.BinaryReader): ListWebhooksRequest;
}

export namespace ListWebhooksRequest {
  export type AsObject = {
    pageSize: number,
    pageToken: string,
  }
}

export class ListWebhooksResponse extends jspb.Message {
  getItemsList(): Array<Webhook>;
  setItemsList(value: Array<Webhook>): ListWebhooksResponse;
  clearItemsList(): ListWebhooksResponse;
  addItems(value?: Webhook, index?: number): Webhook;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListWebhooksResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListWebhooksResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListWebhooksResponse): ListWebhooksResponse.AsObject;
  static serializeBinaryToWriter(message: ListWebhooksResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListWebhooksResponse;
  static deserializeBinaryFromReader(message: ListWebhooksResponse, reader: jspb.BinaryReader): ListWebhooksResponse;
}

export namespace ListWebhooksResponse {
  export type AsObject = {
    itemsList: Array<Webhook.AsObject>,
    nextPageToken: string,
  }
}

export class GetWebhookRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): GetWebhookRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetWebhookRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetWebhookRequest): GetWebhookRequest.AsObject;
  static serializeBinaryToWriter(message: GetWebhookRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetWebhookRequest;
  static deserializeBinaryFromReader(message: GetWebhookRequest, reader: jspb.BinaryReader): GetWebhookRequest;
}

export namespace GetWebhookRequest {
  export type AsObject = {
    ref: string,
  }
}

export class UpdateWebhookRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateWebhookRequest;

  getUrl(): string;
  setUrl(value: string): UpdateWebhookRequest;

  getEventsList(): Array<string>;
  setEventsList(value: Array<string>): UpdateWebhookRequest;
  clearEventsList(): UpdateWebhookRequest;
  addEvents(value: string, index?: number): UpdateWebhookRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateWebhookRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateWebhookRequest): UpdateWebhookRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateWebhookRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateWebhookRequest;
  static deserializeBinaryFromReader(message: UpdateWebhookRequest, reader: jspb.BinaryReader): UpdateWebhookRequest;
}

export namespace UpdateWebhookRequest {
  export type AsObject = {
    ref: string,
    url: string,
    eventsList: Array<string>,
  }
}

export class UpdateWebhookResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): UpdateWebhookResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateWebhookResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateWebhookResponse): UpdateWebhookResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateWebhookResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateWebhookResponse;
  static deserializeBinaryFromReader(message: UpdateWebhookResponse, reader: jspb.BinaryReader): UpdateWebhookResponse;
}

export namespace UpdateWebhookResponse {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteWebhookRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteWebhookRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteWebhookRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteWebhookRequest): DeleteWebhookRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteWebhookRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteWebhookRequest;
  static deserializeBinaryFromReader(message: DeleteWebhookRequest, reader: jspb.BinaryReader): DeleteWebhookRequest;
}

export namespace DeleteWebhookRequest {
  export type AsObject = {
    ref: string,
  }
}

export class DeleteWebhookResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): DeleteWebhookResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteWebhookResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteWebhookResponse): DeleteWebhookResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteWebhookResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteWebhookResponse;
  static deserializeBinaryFromReader(message: DeleteWebhookResponse, reader: jspb.BinaryReader): DeleteWebhookResponse;
}

export namespace DeleteWebhookResponse {
  export type AsObject = {
    ref: string,
  }
}

export class RotateWebhookSecretRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): RotateWebhookSecretRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RotateWebhookSecretRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RotateWebhookSecretRequest): RotateWebhookSecretRequest.AsObject;
  static serializeBinaryToWriter(message: RotateWebhookSecretRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RotateWebhookSecretRequest;
  static deserializeBinaryFromReader(message: RotateWebhookSecretRequest, reader: jspb.BinaryReader): RotateWebhookSecretRequest;
}

export namespace RotateWebhookSecretRequest {
  export type AsObject = {
    ref: string,
  }
}

export class RotateWebhookSecretResponse extends jspb.Message {
  getRef(): string;
  setRef(value: string): RotateWebhookSecretResponse;

  getSecret(): string;
  setSecret(value: string): RotateWebhookSecretResponse;

  getPreviousSecretUntil(): number;
  setPreviousSecretUntil(value: number): RotateWebhookSecretResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RotateWebhookSecretResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RotateWebhookSecretResponse): RotateWebhookSecretResponse.AsObject;
  static serializeBinaryToWriter(message: RotateWebhookSecretResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RotateWebhookSecretResponse;
  static deserializeBinaryFromReader(message: RotateWebhookSecretResponse, reader: jspb.BinaryReader): RotateWebhookSecretResponse;
}

export namespace RotateWebhookSecretResponse {
  export type AsObject = {
    ref: string,
    secret: string,
    previousSecretUntil: number,
  }
}

export class WebhookDelivery extends jspb.Message {
  getRef(): string;
  setRef(value: string): WebhookDelivery;

  getWebhookRef(): string;
  setWebhookRef(value: string): WebhookDelivery;

  getEventId(): string;
  setEventId(value: string): WebhookDelivery;

  getEventType(): string;
  setEventType(value: string): WebhookDelivery;

  getStatus(): string;
  setStatus(value: string): WebhookDelivery;

  getAttempts(): number;
  setAttempts(value: number): WebhookDelivery;

  getLastStatus(): number;
  setLastStatus(value: number): WebhookDelivery;

  getLastAttemptAt(): number;
  setLastAttemptAt(value: number): WebhookDelivery;

  getNextAttemptAt(): number;
  setNextAttemptAt(value: number): WebhookDelivery;

  getCreatedAt(): number;
  setCreatedAt(value: number): WebhookDelivery;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WebhookDelivery.AsObject;
  static toObject(includeInstance: boolean, msg: WebhookDelivery): WebhookDelivery.AsObject;
  static serializeBinaryToWriter(message: WebhookDelivery, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WebhookDelivery;
  static deserializeBinaryFromReader(message: WebhookDelivery, reader: jspb.BinaryReader): WebhookDelivery;
}

export namespace WebhookDelivery {
  export type AsObject = {
    ref: string,
    webhookRef: string,
    eventId: string,
    eventType: string,
    status: string,
    attempts: number,
    lastStatus: number,
    lastAttemptAt: number,
    nextAttemptAt: number,
    createdAt: number,
  }
}

export class ListWebhookDeliveriesRequest extends jspb.Message {
  getWebhookRef(): string;
  setWebhookRef(value: string): ListWebhookDeliveriesRequest;

  getPageSize(): number;
  setPageSize(value: number): ListWebhookDeliveriesRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListWebhookDeliveriesRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListWebhookDeliveriesRequest): ListWebhookDeliveriesRequest.AsObject;
  static serializeBinaryToWriter(message: ListWebhookDeliveriesRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListWebhookDeliveriesRequest;
  static deserializeBinaryFromReader(message: ListWebhookDeliveriesRequest, reader: jspb.BinaryReader): ListWebhookDeliveriesRequest;
}

export namespace ListWebhookDeliveriesRequest {
  export type AsObject = {
    webhookRef: string,
    pageSize: number,
  }
}

export class ListWebhookDeliveriesResponse extends jspb.Message {
  getItemsList(): Array<WebhookDelivery>;
  setItemsList(value: Array<WebhookDelivery>): ListWebhookDeliveriesResponse;
  clearItemsList(): ListWebhookDeliveriesResponse;
  addItems(value?: WebhookDelivery, index?: number): WebhookDelivery;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListWebhookDeliveriesResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListWebhookDeliveriesResponse): ListWebhookDeliveriesResponse.AsObject;
  static serializeBinaryToWriter(message: ListWebhookDeliveriesResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListWebhookDeliveriesResponse;
  static deserializeBinaryFromReader(message: ListWebhookDeliveriesResponse, reader: jspb.BinaryReader): ListWebhookDeliveriesResponse;
}

export namespace ListWebhookDeliveriesResponse {
  export type AsObject = {
    itemsList: Array<WebhookDelivery.AsObject>,
  }
}

export class ResendWebhookDeliveryRequest extends jspb.Message {
  getRef(): string;
  setRef(value: string): ResendWebhookDeliveryRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResendWebhookDeliveryRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ResendWebhookDeliveryRequest): ResendWebhookDeliveryRequest.AsObject;
  static serializeBinaryToWriter(message: ResendWebhookDeliveryRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResendWebhookDeliveryRequest;
  static deserializeBinaryFromReader(message: ResendWebhookDeliveryRequest, reader: jspb.BinaryReader): ResendWebhookDeliveryRequest;
}

export namespace ResendWebhookDeliveryRequest {
  export type AsObject = {
    ref: string,
  }
}

