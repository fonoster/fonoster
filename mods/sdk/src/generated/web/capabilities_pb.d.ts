import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"


export class GitHubCapability extends jspb.Message {
  getClientId(): string;
  setClientId(value: string): GitHubCapability;

  getAuthorizeUrl(): string;
  setAuthorizeUrl(value: string): GitHubCapability;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GitHubCapability.AsObject;
  static toObject(includeInstance: boolean, msg: GitHubCapability): GitHubCapability.AsObject;
  static serializeBinaryToWriter(message: GitHubCapability, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GitHubCapability;
  static deserializeBinaryFromReader(message: GitHubCapability, reader: jspb.BinaryReader): GitHubCapability;
}

export namespace GitHubCapability {
  export type AsObject = {
    clientId: string,
    authorizeUrl: string,
  }
}

export class AuthCapabilities extends jspb.Message {
  getMethodsList(): Array<string>;
  setMethodsList(value: Array<string>): AuthCapabilities;
  clearMethodsList(): AuthCapabilities;
  addMethods(value: string, index?: number): AuthCapabilities;

  getSignup(): string;
  setSignup(value: string): AuthCapabilities;

  getGithub(): GitHubCapability | undefined;
  setGithub(value?: GitHubCapability): AuthCapabilities;
  hasGithub(): boolean;
  clearGithub(): AuthCapabilities;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthCapabilities.AsObject;
  static toObject(includeInstance: boolean, msg: AuthCapabilities): AuthCapabilities.AsObject;
  static serializeBinaryToWriter(message: AuthCapabilities, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AuthCapabilities;
  static deserializeBinaryFromReader(message: AuthCapabilities, reader: jspb.BinaryReader): AuthCapabilities;
}

export namespace AuthCapabilities {
  export type AsObject = {
    methodsList: Array<string>,
    signup: string,
    github?: GitHubCapability.AsObject,
  }
}

export class BillingCapabilities extends jspb.Message {
  getEnabled(): boolean;
  setEnabled(value: boolean): BillingCapabilities;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BillingCapabilities.AsObject;
  static toObject(includeInstance: boolean, msg: BillingCapabilities): BillingCapabilities.AsObject;
  static serializeBinaryToWriter(message: BillingCapabilities, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BillingCapabilities;
  static deserializeBinaryFromReader(message: BillingCapabilities, reader: jspb.BinaryReader): BillingCapabilities;
}

export namespace BillingCapabilities {
  export type AsObject = {
    enabled: boolean,
  }
}

export class CostsCapabilities extends jspb.Message {
  getDisplay(): string;
  setDisplay(value: string): CostsCapabilities;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CostsCapabilities.AsObject;
  static toObject(includeInstance: boolean, msg: CostsCapabilities): CostsCapabilities.AsObject;
  static serializeBinaryToWriter(message: CostsCapabilities, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CostsCapabilities;
  static deserializeBinaryFromReader(message: CostsCapabilities, reader: jspb.BinaryReader): CostsCapabilities;
}

export namespace CostsCapabilities {
  export type AsObject = {
    display: string,
  }
}

export class RegionsCapabilities extends jspb.Message {
  getPrivate(): boolean;
  setPrivate(value: boolean): RegionsCapabilities;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegionsCapabilities.AsObject;
  static toObject(includeInstance: boolean, msg: RegionsCapabilities): RegionsCapabilities.AsObject;
  static serializeBinaryToWriter(message: RegionsCapabilities, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegionsCapabilities;
  static deserializeBinaryFromReader(message: RegionsCapabilities, reader: jspb.BinaryReader): RegionsCapabilities;
}

export namespace RegionsCapabilities {
  export type AsObject = {
    pb_private: boolean,
  }
}

export class TrunksCapabilities extends jspb.Message {
  getInboundUri(): string;
  setInboundUri(value: string): TrunksCapabilities;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrunksCapabilities.AsObject;
  static toObject(includeInstance: boolean, msg: TrunksCapabilities): TrunksCapabilities.AsObject;
  static serializeBinaryToWriter(message: TrunksCapabilities, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TrunksCapabilities;
  static deserializeBinaryFromReader(message: TrunksCapabilities, reader: jspb.BinaryReader): TrunksCapabilities;
}

export namespace TrunksCapabilities {
  export type AsObject = {
    inboundUri: string,
  }
}

export class SipEndpoint extends jspb.Message {
  getHost(): string;
  setHost(value: string): SipEndpoint;

  getPort(): number;
  setPort(value: number): SipEndpoint;

  getTransport(): string;
  setTransport(value: string): SipEndpoint;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SipEndpoint.AsObject;
  static toObject(includeInstance: boolean, msg: SipEndpoint): SipEndpoint.AsObject;
  static serializeBinaryToWriter(message: SipEndpoint, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SipEndpoint;
  static deserializeBinaryFromReader(message: SipEndpoint, reader: jspb.BinaryReader): SipEndpoint;
}

export namespace SipEndpoint {
  export type AsObject = {
    host: string,
    port: number,
    transport: string,
  }
}

export class PortRange extends jspb.Message {
  getMin(): number;
  setMin(value: number): PortRange;

  getMax(): number;
  setMax(value: number): PortRange;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PortRange.AsObject;
  static toObject(includeInstance: boolean, msg: PortRange): PortRange.AsObject;
  static serializeBinaryToWriter(message: PortRange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PortRange;
  static deserializeBinaryFromReader(message: PortRange, reader: jspb.BinaryReader): PortRange;
}

export namespace PortRange {
  export type AsObject = {
    min: number,
    max: number,
  }
}

export class ConnectionCapabilities extends jspb.Message {
  getSipList(): Array<SipEndpoint>;
  setSipList(value: Array<SipEndpoint>): ConnectionCapabilities;
  clearSipList(): ConnectionCapabilities;
  addSip(value?: SipEndpoint, index?: number): SipEndpoint;

  getSignalingAddressesList(): Array<string>;
  setSignalingAddressesList(value: Array<string>): ConnectionCapabilities;
  clearSignalingAddressesList(): ConnectionCapabilities;
  addSignalingAddresses(value: string, index?: number): ConnectionCapabilities;

  getMediaAddressesList(): Array<string>;
  setMediaAddressesList(value: Array<string>): ConnectionCapabilities;
  clearMediaAddressesList(): ConnectionCapabilities;
  addMediaAddresses(value: string, index?: number): ConnectionCapabilities;

  getRtpPorts(): PortRange | undefined;
  setRtpPorts(value?: PortRange): ConnectionCapabilities;
  hasRtpPorts(): boolean;
  clearRtpPorts(): ConnectionCapabilities;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConnectionCapabilities.AsObject;
  static toObject(includeInstance: boolean, msg: ConnectionCapabilities): ConnectionCapabilities.AsObject;
  static serializeBinaryToWriter(message: ConnectionCapabilities, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConnectionCapabilities;
  static deserializeBinaryFromReader(message: ConnectionCapabilities, reader: jspb.BinaryReader): ConnectionCapabilities;
}

export namespace ConnectionCapabilities {
  export type AsObject = {
    sipList: Array<SipEndpoint.AsObject>,
    signalingAddressesList: Array<string>,
    mediaAddressesList: Array<string>,
    rtpPorts?: PortRange.AsObject,
  }
}

export class GetCapabilitiesResponse extends jspb.Message {
  getAuth(): AuthCapabilities | undefined;
  setAuth(value?: AuthCapabilities): GetCapabilitiesResponse;
  hasAuth(): boolean;
  clearAuth(): GetCapabilitiesResponse;

  getBilling(): BillingCapabilities | undefined;
  setBilling(value?: BillingCapabilities): GetCapabilitiesResponse;
  hasBilling(): boolean;
  clearBilling(): GetCapabilitiesResponse;

  getCosts(): CostsCapabilities | undefined;
  setCosts(value?: CostsCapabilities): GetCapabilitiesResponse;
  hasCosts(): boolean;
  clearCosts(): GetCapabilitiesResponse;

  getDomain(): string;
  setDomain(value: string): GetCapabilitiesResponse;

  getAppUrl(): string;
  setAppUrl(value: string): GetCapabilitiesResponse;

  getRegions(): RegionsCapabilities | undefined;
  setRegions(value?: RegionsCapabilities): GetCapabilitiesResponse;
  hasRegions(): boolean;
  clearRegions(): GetCapabilitiesResponse;

  getConnection(): ConnectionCapabilities | undefined;
  setConnection(value?: ConnectionCapabilities): GetCapabilitiesResponse;
  hasConnection(): boolean;
  clearConnection(): GetCapabilitiesResponse;

  getTrunks(): TrunksCapabilities | undefined;
  setTrunks(value?: TrunksCapabilities): GetCapabilitiesResponse;
  hasTrunks(): boolean;
  clearTrunks(): GetCapabilitiesResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetCapabilitiesResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetCapabilitiesResponse): GetCapabilitiesResponse.AsObject;
  static serializeBinaryToWriter(message: GetCapabilitiesResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetCapabilitiesResponse;
  static deserializeBinaryFromReader(message: GetCapabilitiesResponse, reader: jspb.BinaryReader): GetCapabilitiesResponse;
}

export namespace GetCapabilitiesResponse {
  export type AsObject = {
    auth?: AuthCapabilities.AsObject,
    billing?: BillingCapabilities.AsObject,
    costs?: CostsCapabilities.AsObject,
    domain: string,
    appUrl: string,
    regions?: RegionsCapabilities.AsObject,
    connection?: ConnectionCapabilities.AsObject,
    trunks?: TrunksCapabilities.AsObject,
  }
}

