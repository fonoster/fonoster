import * as jspb from 'google-protobuf'

import * as google_protobuf_struct_pb from 'google-protobuf/google/protobuf/struct_pb'; // proto import: "google/protobuf/struct.proto"
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"


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

export class EvaluateIntelligenceRequest extends jspb.Message {
  getIntelligence(): ProductContainer | undefined;
  setIntelligence(value?: ProductContainer): EvaluateIntelligenceRequest;
  hasIntelligence(): boolean;
  clearIntelligence(): EvaluateIntelligenceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EvaluateIntelligenceRequest.AsObject;
  static toObject(includeInstance: boolean, msg: EvaluateIntelligenceRequest): EvaluateIntelligenceRequest.AsObject;
  static serializeBinaryToWriter(message: EvaluateIntelligenceRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EvaluateIntelligenceRequest;
  static deserializeBinaryFromReader(message: EvaluateIntelligenceRequest, reader: jspb.BinaryReader): EvaluateIntelligenceRequest;
}

export namespace EvaluateIntelligenceRequest {
  export type AsObject = {
    intelligence?: ProductContainer.AsObject,
  }
}

export class EvaluateIntelligenceResponse extends jspb.Message {
  getResultsList(): Array<EvaluateIntelligenceResponse.ScenarioEvaluationReport>;
  setResultsList(value: Array<EvaluateIntelligenceResponse.ScenarioEvaluationReport>): EvaluateIntelligenceResponse;
  clearResultsList(): EvaluateIntelligenceResponse;
  addResults(value?: EvaluateIntelligenceResponse.ScenarioEvaluationReport, index?: number): EvaluateIntelligenceResponse.ScenarioEvaluationReport;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EvaluateIntelligenceResponse.AsObject;
  static toObject(includeInstance: boolean, msg: EvaluateIntelligenceResponse): EvaluateIntelligenceResponse.AsObject;
  static serializeBinaryToWriter(message: EvaluateIntelligenceResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EvaluateIntelligenceResponse;
  static deserializeBinaryFromReader(message: EvaluateIntelligenceResponse, reader: jspb.BinaryReader): EvaluateIntelligenceResponse;
}

export namespace EvaluateIntelligenceResponse {
  export type AsObject = {
    resultsList: Array<EvaluateIntelligenceResponse.ScenarioEvaluationReport.AsObject>,
  }

  export class ToolEvaluationReport extends jspb.Message {
    getExpectedTool(): string;
    setExpectedTool(value: string): ToolEvaluationReport;

    getActualTool(): string;
    setActualTool(value: string): ToolEvaluationReport;

    getPassed(): boolean;
    setPassed(value: boolean): ToolEvaluationReport;

    getExpectedParameters(): google_protobuf_struct_pb.Struct | undefined;
    setExpectedParameters(value?: google_protobuf_struct_pb.Struct): ToolEvaluationReport;
    hasExpectedParameters(): boolean;
    clearExpectedParameters(): ToolEvaluationReport;

    getActualParameters(): google_protobuf_struct_pb.Struct | undefined;
    setActualParameters(value?: google_protobuf_struct_pb.Struct): ToolEvaluationReport;
    hasActualParameters(): boolean;
    clearActualParameters(): ToolEvaluationReport;

    getErrorMessage(): string;
    setErrorMessage(value: string): ToolEvaluationReport;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ToolEvaluationReport.AsObject;
    static toObject(includeInstance: boolean, msg: ToolEvaluationReport): ToolEvaluationReport.AsObject;
    static serializeBinaryToWriter(message: ToolEvaluationReport, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ToolEvaluationReport;
    static deserializeBinaryFromReader(message: ToolEvaluationReport, reader: jspb.BinaryReader): ToolEvaluationReport;
  }

  export namespace ToolEvaluationReport {
    export type AsObject = {
      expectedTool: string,
      actualTool: string,
      passed: boolean,
      expectedParameters?: google_protobuf_struct_pb.Struct.AsObject,
      actualParameters?: google_protobuf_struct_pb.Struct.AsObject,
      errorMessage: string,
    }
  }


  export class StepEvaluationReport extends jspb.Message {
    getHumanInput(): string;
    setHumanInput(value: string): StepEvaluationReport;

    getExpectedResponse(): string;
    setExpectedResponse(value: string): StepEvaluationReport;

    getAiResponse(): string;
    setAiResponse(value: string): StepEvaluationReport;

    getEvaluationType(): EvaluateIntelligenceResponse.ExpectedTextType;
    setEvaluationType(value: EvaluateIntelligenceResponse.ExpectedTextType): StepEvaluationReport;

    getPassed(): boolean;
    setPassed(value: boolean): StepEvaluationReport;

    getErrorMessage(): string;
    setErrorMessage(value: string): StepEvaluationReport;

    getToolEvaluationsList(): Array<EvaluateIntelligenceResponse.ToolEvaluationReport>;
    setToolEvaluationsList(value: Array<EvaluateIntelligenceResponse.ToolEvaluationReport>): StepEvaluationReport;
    clearToolEvaluationsList(): StepEvaluationReport;
    addToolEvaluations(value?: EvaluateIntelligenceResponse.ToolEvaluationReport, index?: number): EvaluateIntelligenceResponse.ToolEvaluationReport;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StepEvaluationReport.AsObject;
    static toObject(includeInstance: boolean, msg: StepEvaluationReport): StepEvaluationReport.AsObject;
    static serializeBinaryToWriter(message: StepEvaluationReport, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StepEvaluationReport;
    static deserializeBinaryFromReader(message: StepEvaluationReport, reader: jspb.BinaryReader): StepEvaluationReport;
  }

  export namespace StepEvaluationReport {
    export type AsObject = {
      humanInput: string,
      expectedResponse: string,
      aiResponse: string,
      evaluationType: EvaluateIntelligenceResponse.ExpectedTextType,
      passed: boolean,
      errorMessage: string,
      toolEvaluationsList: Array<EvaluateIntelligenceResponse.ToolEvaluationReport.AsObject>,
    }
  }


  export class ScenarioEvaluationReport extends jspb.Message {
    getScenarioRef(): string;
    setScenarioRef(value: string): ScenarioEvaluationReport;

    getOverallPassed(): boolean;
    setOverallPassed(value: boolean): ScenarioEvaluationReport;

    getStepsList(): Array<EvaluateIntelligenceResponse.StepEvaluationReport>;
    setStepsList(value: Array<EvaluateIntelligenceResponse.StepEvaluationReport>): ScenarioEvaluationReport;
    clearStepsList(): ScenarioEvaluationReport;
    addSteps(value?: EvaluateIntelligenceResponse.StepEvaluationReport, index?: number): EvaluateIntelligenceResponse.StepEvaluationReport;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ScenarioEvaluationReport.AsObject;
    static toObject(includeInstance: boolean, msg: ScenarioEvaluationReport): ScenarioEvaluationReport.AsObject;
    static serializeBinaryToWriter(message: ScenarioEvaluationReport, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ScenarioEvaluationReport;
    static deserializeBinaryFromReader(message: ScenarioEvaluationReport, reader: jspb.BinaryReader): ScenarioEvaluationReport;
  }

  export namespace ScenarioEvaluationReport {
    export type AsObject = {
      scenarioRef: string,
      overallPassed: boolean,
      stepsList: Array<EvaluateIntelligenceResponse.StepEvaluationReport.AsObject>,
    }
  }


  export enum ExpectedTextType { 
    EXACT = 0,
    SIMILAR = 1,
  }
}

export class TestTokenResponse extends jspb.Message {
  getToken(): string;
  setToken(value: string): TestTokenResponse;

  getDomain(): string;
  setDomain(value: string): TestTokenResponse;

  getDisplayName(): string;
  setDisplayName(value: string): TestTokenResponse;

  getSignalingServer(): string;
  setSignalingServer(value: string): TestTokenResponse;

  getTargetAor(): string;
  setTargetAor(value: string): TestTokenResponse;

  getUsername(): string;
  setUsername(value: string): TestTokenResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TestTokenResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TestTokenResponse): TestTokenResponse.AsObject;
  static serializeBinaryToWriter(message: TestTokenResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TestTokenResponse;
  static deserializeBinaryFromReader(message: TestTokenResponse, reader: jspb.BinaryReader): TestTokenResponse;
}

export namespace TestTokenResponse {
  export type AsObject = {
    token: string,
    domain: string,
    displayName: string,
    signalingServer: string,
    targetAor: string,
    username: string,
  }
}

export enum ApplicationType { 
  EXTERNAL = 0,
  AUTOPILOT = 1,
}
