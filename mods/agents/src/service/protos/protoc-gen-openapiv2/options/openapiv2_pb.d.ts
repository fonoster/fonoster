// package: grpc.gateway.protoc_gen_openapiv2.options
// file: protoc-gen-openapiv2/options/openapiv2.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class Swagger extends jspb.Message { 
    getSwagger(): string;
    setSwagger(value: string): Swagger;

    hasInfo(): boolean;
    clearInfo(): void;
    getInfo(): Info | undefined;
    setInfo(value?: Info): Swagger;
    getHost(): string;
    setHost(value: string): Swagger;
    getBasePath(): string;
    setBasePath(value: string): Swagger;
    clearSchemesList(): void;
    getSchemesList(): Array<Scheme>;
    setSchemesList(value: Array<Scheme>): Swagger;
    addSchemes(value: Scheme, index?: number): Scheme;
    clearConsumesList(): void;
    getConsumesList(): Array<string>;
    setConsumesList(value: Array<string>): Swagger;
    addConsumes(value: string, index?: number): string;
    clearProducesList(): void;
    getProducesList(): Array<string>;
    setProducesList(value: Array<string>): Swagger;
    addProduces(value: string, index?: number): string;

    getResponsesMap(): jspb.Map<string, Response>;
    clearResponsesMap(): void;

    hasSecurityDefinitions(): boolean;
    clearSecurityDefinitions(): void;
    getSecurityDefinitions(): SecurityDefinitions | undefined;
    setSecurityDefinitions(value?: SecurityDefinitions): Swagger;
    clearSecurityList(): void;
    getSecurityList(): Array<SecurityRequirement>;
    setSecurityList(value: Array<SecurityRequirement>): Swagger;
    addSecurity(value?: SecurityRequirement, index?: number): SecurityRequirement;

    hasExternalDocs(): boolean;
    clearExternalDocs(): void;
    getExternalDocs(): ExternalDocumentation | undefined;
    setExternalDocs(value?: ExternalDocumentation): Swagger;

    getExtensionsMap(): jspb.Map<string, google_protobuf_struct_pb.Value>;
    clearExtensionsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Swagger.AsObject;
    static toObject(includeInstance: boolean, msg: Swagger): Swagger.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Swagger, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Swagger;
    static deserializeBinaryFromReader(message: Swagger, reader: jspb.BinaryReader): Swagger;
}

export namespace Swagger {
    export type AsObject = {
        swagger: string,
        info?: Info.AsObject,
        host: string,
        basePath: string,
        schemesList: Array<Scheme>,
        consumesList: Array<string>,
        producesList: Array<string>,

        responsesMap: Array<[string, Response.AsObject]>,
        securityDefinitions?: SecurityDefinitions.AsObject,
        securityList: Array<SecurityRequirement.AsObject>,
        externalDocs?: ExternalDocumentation.AsObject,

        extensionsMap: Array<[string, google_protobuf_struct_pb.Value.AsObject]>,
    }
}

export class Operation extends jspb.Message { 
    clearTagsList(): void;
    getTagsList(): Array<string>;
    setTagsList(value: Array<string>): Operation;
    addTags(value: string, index?: number): string;
    getSummary(): string;
    setSummary(value: string): Operation;
    getDescription(): string;
    setDescription(value: string): Operation;

    hasExternalDocs(): boolean;
    clearExternalDocs(): void;
    getExternalDocs(): ExternalDocumentation | undefined;
    setExternalDocs(value?: ExternalDocumentation): Operation;
    getOperationId(): string;
    setOperationId(value: string): Operation;
    clearConsumesList(): void;
    getConsumesList(): Array<string>;
    setConsumesList(value: Array<string>): Operation;
    addConsumes(value: string, index?: number): string;
    clearProducesList(): void;
    getProducesList(): Array<string>;
    setProducesList(value: Array<string>): Operation;
    addProduces(value: string, index?: number): string;

    getResponsesMap(): jspb.Map<string, Response>;
    clearResponsesMap(): void;
    clearSchemesList(): void;
    getSchemesList(): Array<Scheme>;
    setSchemesList(value: Array<Scheme>): Operation;
    addSchemes(value: Scheme, index?: number): Scheme;
    getDeprecated(): boolean;
    setDeprecated(value: boolean): Operation;
    clearSecurityList(): void;
    getSecurityList(): Array<SecurityRequirement>;
    setSecurityList(value: Array<SecurityRequirement>): Operation;
    addSecurity(value?: SecurityRequirement, index?: number): SecurityRequirement;

    getExtensionsMap(): jspb.Map<string, google_protobuf_struct_pb.Value>;
    clearExtensionsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Operation.AsObject;
    static toObject(includeInstance: boolean, msg: Operation): Operation.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Operation, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Operation;
    static deserializeBinaryFromReader(message: Operation, reader: jspb.BinaryReader): Operation;
}

export namespace Operation {
    export type AsObject = {
        tagsList: Array<string>,
        summary: string,
        description: string,
        externalDocs?: ExternalDocumentation.AsObject,
        operationId: string,
        consumesList: Array<string>,
        producesList: Array<string>,

        responsesMap: Array<[string, Response.AsObject]>,
        schemesList: Array<Scheme>,
        deprecated: boolean,
        securityList: Array<SecurityRequirement.AsObject>,

        extensionsMap: Array<[string, google_protobuf_struct_pb.Value.AsObject]>,
    }
}

export class Header extends jspb.Message { 
    getDescription(): string;
    setDescription(value: string): Header;
    getType(): string;
    setType(value: string): Header;
    getFormat(): string;
    setFormat(value: string): Header;
    getDefault(): string;
    setDefault(value: string): Header;
    getPattern(): string;
    setPattern(value: string): Header;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Header.AsObject;
    static toObject(includeInstance: boolean, msg: Header): Header.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Header, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Header;
    static deserializeBinaryFromReader(message: Header, reader: jspb.BinaryReader): Header;
}

export namespace Header {
    export type AsObject = {
        description: string,
        type: string,
        format: string,
        pb_default: string,
        pattern: string,
    }
}

export class Response extends jspb.Message { 
    getDescription(): string;
    setDescription(value: string): Response;

    hasSchema(): boolean;
    clearSchema(): void;
    getSchema(): Schema | undefined;
    setSchema(value?: Schema): Response;

    getHeadersMap(): jspb.Map<string, Header>;
    clearHeadersMap(): void;

    getExamplesMap(): jspb.Map<string, string>;
    clearExamplesMap(): void;

    getExtensionsMap(): jspb.Map<string, google_protobuf_struct_pb.Value>;
    clearExtensionsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Response.AsObject;
    static toObject(includeInstance: boolean, msg: Response): Response.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Response, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Response;
    static deserializeBinaryFromReader(message: Response, reader: jspb.BinaryReader): Response;
}

export namespace Response {
    export type AsObject = {
        description: string,
        schema?: Schema.AsObject,

        headersMap: Array<[string, Header.AsObject]>,

        examplesMap: Array<[string, string]>,

        extensionsMap: Array<[string, google_protobuf_struct_pb.Value.AsObject]>,
    }
}

export class Info extends jspb.Message { 
    getTitle(): string;
    setTitle(value: string): Info;
    getDescription(): string;
    setDescription(value: string): Info;
    getTermsOfService(): string;
    setTermsOfService(value: string): Info;

    hasContact(): boolean;
    clearContact(): void;
    getContact(): Contact | undefined;
    setContact(value?: Contact): Info;

    hasLicense(): boolean;
    clearLicense(): void;
    getLicense(): License | undefined;
    setLicense(value?: License): Info;
    getVersion(): string;
    setVersion(value: string): Info;

    getExtensionsMap(): jspb.Map<string, google_protobuf_struct_pb.Value>;
    clearExtensionsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Info.AsObject;
    static toObject(includeInstance: boolean, msg: Info): Info.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Info, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Info;
    static deserializeBinaryFromReader(message: Info, reader: jspb.BinaryReader): Info;
}

export namespace Info {
    export type AsObject = {
        title: string,
        description: string,
        termsOfService: string,
        contact?: Contact.AsObject,
        license?: License.AsObject,
        version: string,

        extensionsMap: Array<[string, google_protobuf_struct_pb.Value.AsObject]>,
    }
}

export class Contact extends jspb.Message { 
    getName(): string;
    setName(value: string): Contact;
    getUrl(): string;
    setUrl(value: string): Contact;
    getEmail(): string;
    setEmail(value: string): Contact;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Contact.AsObject;
    static toObject(includeInstance: boolean, msg: Contact): Contact.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Contact, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Contact;
    static deserializeBinaryFromReader(message: Contact, reader: jspb.BinaryReader): Contact;
}

export namespace Contact {
    export type AsObject = {
        name: string,
        url: string,
        email: string,
    }
}

export class License extends jspb.Message { 
    getName(): string;
    setName(value: string): License;
    getUrl(): string;
    setUrl(value: string): License;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): License.AsObject;
    static toObject(includeInstance: boolean, msg: License): License.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: License, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): License;
    static deserializeBinaryFromReader(message: License, reader: jspb.BinaryReader): License;
}

export namespace License {
    export type AsObject = {
        name: string,
        url: string,
    }
}

export class ExternalDocumentation extends jspb.Message { 
    getDescription(): string;
    setDescription(value: string): ExternalDocumentation;
    getUrl(): string;
    setUrl(value: string): ExternalDocumentation;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExternalDocumentation.AsObject;
    static toObject(includeInstance: boolean, msg: ExternalDocumentation): ExternalDocumentation.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExternalDocumentation, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExternalDocumentation;
    static deserializeBinaryFromReader(message: ExternalDocumentation, reader: jspb.BinaryReader): ExternalDocumentation;
}

export namespace ExternalDocumentation {
    export type AsObject = {
        description: string,
        url: string,
    }
}

export class Schema extends jspb.Message { 

    hasJsonSchema(): boolean;
    clearJsonSchema(): void;
    getJsonSchema(): JSONSchema | undefined;
    setJsonSchema(value?: JSONSchema): Schema;
    getDiscriminator(): string;
    setDiscriminator(value: string): Schema;
    getReadOnly(): boolean;
    setReadOnly(value: boolean): Schema;

    hasExternalDocs(): boolean;
    clearExternalDocs(): void;
    getExternalDocs(): ExternalDocumentation | undefined;
    setExternalDocs(value?: ExternalDocumentation): Schema;
    getExample(): string;
    setExample(value: string): Schema;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Schema.AsObject;
    static toObject(includeInstance: boolean, msg: Schema): Schema.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Schema, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Schema;
    static deserializeBinaryFromReader(message: Schema, reader: jspb.BinaryReader): Schema;
}

export namespace Schema {
    export type AsObject = {
        jsonSchema?: JSONSchema.AsObject,
        discriminator: string,
        readOnly: boolean,
        externalDocs?: ExternalDocumentation.AsObject,
        example: string,
    }
}

export class JSONSchema extends jspb.Message { 
    getRef(): string;
    setRef(value: string): JSONSchema;
    getTitle(): string;
    setTitle(value: string): JSONSchema;
    getDescription(): string;
    setDescription(value: string): JSONSchema;
    getDefault(): string;
    setDefault(value: string): JSONSchema;
    getReadOnly(): boolean;
    setReadOnly(value: boolean): JSONSchema;
    getExample(): string;
    setExample(value: string): JSONSchema;
    getMultipleOf(): number;
    setMultipleOf(value: number): JSONSchema;
    getMaximum(): number;
    setMaximum(value: number): JSONSchema;
    getExclusiveMaximum(): boolean;
    setExclusiveMaximum(value: boolean): JSONSchema;
    getMinimum(): number;
    setMinimum(value: number): JSONSchema;
    getExclusiveMinimum(): boolean;
    setExclusiveMinimum(value: boolean): JSONSchema;
    getMaxLength(): number;
    setMaxLength(value: number): JSONSchema;
    getMinLength(): number;
    setMinLength(value: number): JSONSchema;
    getPattern(): string;
    setPattern(value: string): JSONSchema;
    getMaxItems(): number;
    setMaxItems(value: number): JSONSchema;
    getMinItems(): number;
    setMinItems(value: number): JSONSchema;
    getUniqueItems(): boolean;
    setUniqueItems(value: boolean): JSONSchema;
    getMaxProperties(): number;
    setMaxProperties(value: number): JSONSchema;
    getMinProperties(): number;
    setMinProperties(value: number): JSONSchema;
    clearRequiredList(): void;
    getRequiredList(): Array<string>;
    setRequiredList(value: Array<string>): JSONSchema;
    addRequired(value: string, index?: number): string;
    clearArrayList(): void;
    getArrayList(): Array<string>;
    setArrayList(value: Array<string>): JSONSchema;
    addArray(value: string, index?: number): string;
    clearTypeList(): void;
    getTypeList(): Array<JSONSchema.JSONSchemaSimpleTypes>;
    setTypeList(value: Array<JSONSchema.JSONSchemaSimpleTypes>): JSONSchema;
    addType(value: JSONSchema.JSONSchemaSimpleTypes, index?: number): JSONSchema.JSONSchemaSimpleTypes;
    getFormat(): string;
    setFormat(value: string): JSONSchema;
    clearEnumList(): void;
    getEnumList(): Array<string>;
    setEnumList(value: Array<string>): JSONSchema;
    addEnum(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): JSONSchema.AsObject;
    static toObject(includeInstance: boolean, msg: JSONSchema): JSONSchema.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: JSONSchema, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): JSONSchema;
    static deserializeBinaryFromReader(message: JSONSchema, reader: jspb.BinaryReader): JSONSchema;
}

export namespace JSONSchema {
    export type AsObject = {
        ref: string,
        title: string,
        description: string,
        pb_default: string,
        readOnly: boolean,
        example: string,
        multipleOf: number,
        maximum: number,
        exclusiveMaximum: boolean,
        minimum: number,
        exclusiveMinimum: boolean,
        maxLength: number,
        minLength: number,
        pattern: string,
        maxItems: number,
        minItems: number,
        uniqueItems: boolean,
        maxProperties: number,
        minProperties: number,
        requiredList: Array<string>,
        arrayList: Array<string>,
        typeList: Array<JSONSchema.JSONSchemaSimpleTypes>,
        format: string,
        pb_enumList: Array<string>,
    }

    export enum JSONSchemaSimpleTypes {
    UNKNOWN = 0,
    ARRAY = 1,
    BOOLEAN = 2,
    INTEGER = 3,
    NULL = 4,
    NUMBER = 5,
    OBJECT = 6,
    STRING = 7,
    }

}

export class Tag extends jspb.Message { 
    getDescription(): string;
    setDescription(value: string): Tag;

    hasExternalDocs(): boolean;
    clearExternalDocs(): void;
    getExternalDocs(): ExternalDocumentation | undefined;
    setExternalDocs(value?: ExternalDocumentation): Tag;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Tag.AsObject;
    static toObject(includeInstance: boolean, msg: Tag): Tag.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Tag, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Tag;
    static deserializeBinaryFromReader(message: Tag, reader: jspb.BinaryReader): Tag;
}

export namespace Tag {
    export type AsObject = {
        description: string,
        externalDocs?: ExternalDocumentation.AsObject,
    }
}

export class SecurityDefinitions extends jspb.Message { 

    getSecurityMap(): jspb.Map<string, SecurityScheme>;
    clearSecurityMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecurityDefinitions.AsObject;
    static toObject(includeInstance: boolean, msg: SecurityDefinitions): SecurityDefinitions.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecurityDefinitions, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecurityDefinitions;
    static deserializeBinaryFromReader(message: SecurityDefinitions, reader: jspb.BinaryReader): SecurityDefinitions;
}

export namespace SecurityDefinitions {
    export type AsObject = {

        securityMap: Array<[string, SecurityScheme.AsObject]>,
    }
}

export class SecurityScheme extends jspb.Message { 
    getType(): SecurityScheme.Type;
    setType(value: SecurityScheme.Type): SecurityScheme;
    getDescription(): string;
    setDescription(value: string): SecurityScheme;
    getName(): string;
    setName(value: string): SecurityScheme;
    getIn(): SecurityScheme.In;
    setIn(value: SecurityScheme.In): SecurityScheme;
    getFlow(): SecurityScheme.Flow;
    setFlow(value: SecurityScheme.Flow): SecurityScheme;
    getAuthorizationUrl(): string;
    setAuthorizationUrl(value: string): SecurityScheme;
    getTokenUrl(): string;
    setTokenUrl(value: string): SecurityScheme;

    hasScopes(): boolean;
    clearScopes(): void;
    getScopes(): Scopes | undefined;
    setScopes(value?: Scopes): SecurityScheme;

    getExtensionsMap(): jspb.Map<string, google_protobuf_struct_pb.Value>;
    clearExtensionsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecurityScheme.AsObject;
    static toObject(includeInstance: boolean, msg: SecurityScheme): SecurityScheme.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecurityScheme, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecurityScheme;
    static deserializeBinaryFromReader(message: SecurityScheme, reader: jspb.BinaryReader): SecurityScheme;
}

export namespace SecurityScheme {
    export type AsObject = {
        type: SecurityScheme.Type,
        description: string,
        name: string,
        pb_in: SecurityScheme.In,
        flow: SecurityScheme.Flow,
        authorizationUrl: string,
        tokenUrl: string,
        scopes?: Scopes.AsObject,

        extensionsMap: Array<[string, google_protobuf_struct_pb.Value.AsObject]>,
    }

    export enum Type {
    TYPE_INVALID = 0,
    TYPE_BASIC = 1,
    TYPE_API_KEY = 2,
    TYPE_OAUTH2 = 3,
    }

    export enum In {
    IN_INVALID = 0,
    IN_QUERY = 1,
    IN_HEADER = 2,
    }

    export enum Flow {
    FLOW_INVALID = 0,
    FLOW_IMPLICIT = 1,
    FLOW_PASSWORD = 2,
    FLOW_APPLICATION = 3,
    FLOW_ACCESS_CODE = 4,
    }

}

export class SecurityRequirement extends jspb.Message { 

    getSecurityRequirementMap(): jspb.Map<string, SecurityRequirement.SecurityRequirementValue>;
    clearSecurityRequirementMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecurityRequirement.AsObject;
    static toObject(includeInstance: boolean, msg: SecurityRequirement): SecurityRequirement.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecurityRequirement, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecurityRequirement;
    static deserializeBinaryFromReader(message: SecurityRequirement, reader: jspb.BinaryReader): SecurityRequirement;
}

export namespace SecurityRequirement {
    export type AsObject = {

        securityRequirementMap: Array<[string, SecurityRequirement.SecurityRequirementValue.AsObject]>,
    }


    export class SecurityRequirementValue extends jspb.Message { 
        clearScopeList(): void;
        getScopeList(): Array<string>;
        setScopeList(value: Array<string>): SecurityRequirementValue;
        addScope(value: string, index?: number): string;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): SecurityRequirementValue.AsObject;
        static toObject(includeInstance: boolean, msg: SecurityRequirementValue): SecurityRequirementValue.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: SecurityRequirementValue, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): SecurityRequirementValue;
        static deserializeBinaryFromReader(message: SecurityRequirementValue, reader: jspb.BinaryReader): SecurityRequirementValue;
    }

    export namespace SecurityRequirementValue {
        export type AsObject = {
            scopeList: Array<string>,
        }
    }

}

export class Scopes extends jspb.Message { 

    getScopeMap(): jspb.Map<string, string>;
    clearScopeMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Scopes.AsObject;
    static toObject(includeInstance: boolean, msg: Scopes): Scopes.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Scopes, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Scopes;
    static deserializeBinaryFromReader(message: Scopes, reader: jspb.BinaryReader): Scopes;
}

export namespace Scopes {
    export type AsObject = {

        scopeMap: Array<[string, string]>,
    }
}

export enum Scheme {
    UNKNOWN = 0,
    HTTP = 1,
    HTTPS = 2,
    WS = 3,
    WSS = 4,
}
