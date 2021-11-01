// package: fonos.secrets.v1beta1
// file: secrets.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import {handleClientStreamingCall} from "@grpc/grpc-js/build/src/server-call";
import * as secrets_pb from "./secrets_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as common_pb from "./common_pb";

interface ISecretsService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    listSecretsId: ISecretsService_IListSecretsId;
    getSecret: ISecretsService_IGetSecret;
    createSecret: ISecretsService_ICreateSecret;
    deleteSecret: ISecretsService_IDeleteSecret;
}

interface ISecretsService_IListSecretsId extends grpc.MethodDefinition<secrets_pb.ListSecretIdRequest, secrets_pb.ListSecretIdResponse> {
    path: "/fonoster.secrets.v1beta1.Secrets/ListSecretsId";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<secrets_pb.ListSecretIdRequest>;
    requestDeserialize: grpc.deserialize<secrets_pb.ListSecretIdRequest>;
    responseSerialize: grpc.serialize<secrets_pb.ListSecretIdResponse>;
    responseDeserialize: grpc.deserialize<secrets_pb.ListSecretIdResponse>;
}
interface ISecretsService_IGetSecret extends grpc.MethodDefinition<secrets_pb.GetSecretRequest, secrets_pb.GetSecretResponse> {
    path: "/fonoster.secrets.v1beta1.Secrets/GetSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<secrets_pb.GetSecretRequest>;
    requestDeserialize: grpc.deserialize<secrets_pb.GetSecretRequest>;
    responseSerialize: grpc.serialize<secrets_pb.GetSecretResponse>;
    responseDeserialize: grpc.deserialize<secrets_pb.GetSecretResponse>;
}
interface ISecretsService_ICreateSecret extends grpc.MethodDefinition<secrets_pb.CreateSecretRequest, secrets_pb.CreateSecretResponse> {
    path: "/fonoster.secrets.v1beta1.Secrets/CreateSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<secrets_pb.CreateSecretRequest>;
    requestDeserialize: grpc.deserialize<secrets_pb.CreateSecretRequest>;
    responseSerialize: grpc.serialize<secrets_pb.CreateSecretResponse>;
    responseDeserialize: grpc.deserialize<secrets_pb.CreateSecretResponse>;
}
interface ISecretsService_IDeleteSecret extends grpc.MethodDefinition<secrets_pb.DeleteSecretRequest, common_pb.Empty> {
    path: "/fonoster.secrets.v1beta1.Secrets/DeleteSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<secrets_pb.DeleteSecretRequest>;
    requestDeserialize: grpc.deserialize<secrets_pb.DeleteSecretRequest>;
    responseSerialize: grpc.serialize<common_pb.Empty>;
    responseDeserialize: grpc.deserialize<common_pb.Empty>;
}

export const SecretsService: ISecretsService;

export interface ISecretsServer extends grpc.UntypedServiceImplementation {
    listSecretsId: grpc.handleUnaryCall<secrets_pb.ListSecretIdRequest, secrets_pb.ListSecretIdResponse>;
    getSecret: grpc.handleUnaryCall<secrets_pb.GetSecretRequest, secrets_pb.GetSecretResponse>;
    createSecret: grpc.handleUnaryCall<secrets_pb.CreateSecretRequest, secrets_pb.CreateSecretResponse>;
    deleteSecret: grpc.handleUnaryCall<secrets_pb.DeleteSecretRequest, common_pb.Empty>;
}

export interface ISecretsClient {
    listSecretsId(request: secrets_pb.ListSecretIdRequest, callback: (error: grpc.ServiceError | null, response: secrets_pb.ListSecretIdResponse) => void): grpc.ClientUnaryCall;
    listSecretsId(request: secrets_pb.ListSecretIdRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_pb.ListSecretIdResponse) => void): grpc.ClientUnaryCall;
    listSecretsId(request: secrets_pb.ListSecretIdRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_pb.ListSecretIdResponse) => void): grpc.ClientUnaryCall;
    getSecret(request: secrets_pb.GetSecretRequest, callback: (error: grpc.ServiceError | null, response: secrets_pb.GetSecretResponse) => void): grpc.ClientUnaryCall;
    getSecret(request: secrets_pb.GetSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_pb.GetSecretResponse) => void): grpc.ClientUnaryCall;
    getSecret(request: secrets_pb.GetSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_pb.GetSecretResponse) => void): grpc.ClientUnaryCall;
    createSecret(request: secrets_pb.CreateSecretRequest, callback: (error: grpc.ServiceError | null, response: secrets_pb.CreateSecretResponse) => void): grpc.ClientUnaryCall;
    createSecret(request: secrets_pb.CreateSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_pb.CreateSecretResponse) => void): grpc.ClientUnaryCall;
    createSecret(request: secrets_pb.CreateSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_pb.CreateSecretResponse) => void): grpc.ClientUnaryCall;
    deleteSecret(request: secrets_pb.DeleteSecretRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteSecret(request: secrets_pb.DeleteSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteSecret(request: secrets_pb.DeleteSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class SecretsClient extends grpc.Client implements ISecretsClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public listSecretsId(request: secrets_pb.ListSecretIdRequest, callback: (error: grpc.ServiceError | null, response: secrets_pb.ListSecretIdResponse) => void): grpc.ClientUnaryCall;
    public listSecretsId(request: secrets_pb.ListSecretIdRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_pb.ListSecretIdResponse) => void): grpc.ClientUnaryCall;
    public listSecretsId(request: secrets_pb.ListSecretIdRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_pb.ListSecretIdResponse) => void): grpc.ClientUnaryCall;
    public getSecret(request: secrets_pb.GetSecretRequest, callback: (error: grpc.ServiceError | null, response: secrets_pb.GetSecretResponse) => void): grpc.ClientUnaryCall;
    public getSecret(request: secrets_pb.GetSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_pb.GetSecretResponse) => void): grpc.ClientUnaryCall;
    public getSecret(request: secrets_pb.GetSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_pb.GetSecretResponse) => void): grpc.ClientUnaryCall;
    public createSecret(request: secrets_pb.CreateSecretRequest, callback: (error: grpc.ServiceError | null, response: secrets_pb.CreateSecretResponse) => void): grpc.ClientUnaryCall;
    public createSecret(request: secrets_pb.CreateSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_pb.CreateSecretResponse) => void): grpc.ClientUnaryCall;
    public createSecret(request: secrets_pb.CreateSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_pb.CreateSecretResponse) => void): grpc.ClientUnaryCall;
    public deleteSecret(request: secrets_pb.DeleteSecretRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteSecret(request: secrets_pb.DeleteSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteSecret(request: secrets_pb.DeleteSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}
