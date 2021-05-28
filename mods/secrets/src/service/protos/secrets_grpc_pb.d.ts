// package: fonos.secrets.v1alpha1
// file: secrets.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as secrets_pb from "./secrets_pb";
import * as common_pb from "./common_pb";

interface ISecretsService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    listSecretsId: ISecretsService_IListSecretsId;
    getSecret: ISecretsService_IGetSecret;
    createSecret: ISecretsService_ICreateSecret;
    deleteSecret: ISecretsService_IDeleteSecret;
}

interface ISecretsService_IListSecretsId extends grpc.MethodDefinition<secrets_pb.ListSecretsIdRequest, secrets_pb.ListSecretsIdResponse> {
    path: "/fonos.secrets.v1alpha1.Secrets/ListSecretsId";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<secrets_pb.ListSecretsIdRequest>;
    requestDeserialize: grpc.deserialize<secrets_pb.ListSecretsIdRequest>;
    responseSerialize: grpc.serialize<secrets_pb.ListSecretsIdResponse>;
    responseDeserialize: grpc.deserialize<secrets_pb.ListSecretsIdResponse>;
}
interface ISecretsService_IGetSecret extends grpc.MethodDefinition<secrets_pb.GetSecretRequest, secrets_pb.Secret> {
    path: "/fonos.secrets.v1alpha1.Secrets/GetSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<secrets_pb.GetSecretRequest>;
    requestDeserialize: grpc.deserialize<secrets_pb.GetSecretRequest>;
    responseSerialize: grpc.serialize<secrets_pb.Secret>;
    responseDeserialize: grpc.deserialize<secrets_pb.Secret>;
}
interface ISecretsService_ICreateSecret extends grpc.MethodDefinition<secrets_pb.CreateSecretRequest, secrets_pb.Secret> {
    path: "/fonos.secrets.v1alpha1.Secrets/CreateSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<secrets_pb.CreateSecretRequest>;
    requestDeserialize: grpc.deserialize<secrets_pb.CreateSecretRequest>;
    responseSerialize: grpc.serialize<secrets_pb.Secret>;
    responseDeserialize: grpc.deserialize<secrets_pb.Secret>;
}
interface ISecretsService_IDeleteSecret extends grpc.MethodDefinition<secrets_pb.DeleteSecretRequest, common_pb.Empty> {
    path: "/fonos.secrets.v1alpha1.Secrets/DeleteSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<secrets_pb.DeleteSecretRequest>;
    requestDeserialize: grpc.deserialize<secrets_pb.DeleteSecretRequest>;
    responseSerialize: grpc.serialize<common_pb.Empty>;
    responseDeserialize: grpc.deserialize<common_pb.Empty>;
}

export const SecretsService: ISecretsService;

export interface ISecretsServer {
    listSecretsId: grpc.handleUnaryCall<secrets_pb.ListSecretsIdRequest, secrets_pb.ListSecretsIdResponse>;
    getSecret: grpc.handleUnaryCall<secrets_pb.GetSecretRequest, secrets_pb.Secret>;
    createSecret: grpc.handleUnaryCall<secrets_pb.CreateSecretRequest, secrets_pb.Secret>;
    deleteSecret: grpc.handleUnaryCall<secrets_pb.DeleteSecretRequest, common_pb.Empty>;
}

export interface ISecretsClient {
    listSecretsId(request: secrets_pb.ListSecretsIdRequest, callback: (error: grpc.ServiceError | null, response: secrets_pb.ListSecretsIdResponse) => void): grpc.ClientUnaryCall;
    listSecretsId(request: secrets_pb.ListSecretsIdRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_pb.ListSecretsIdResponse) => void): grpc.ClientUnaryCall;
    listSecretsId(request: secrets_pb.ListSecretsIdRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_pb.ListSecretsIdResponse) => void): grpc.ClientUnaryCall;
    getSecret(request: secrets_pb.GetSecretRequest, callback: (error: grpc.ServiceError | null, response: secrets_pb.Secret) => void): grpc.ClientUnaryCall;
    getSecret(request: secrets_pb.GetSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_pb.Secret) => void): grpc.ClientUnaryCall;
    getSecret(request: secrets_pb.GetSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_pb.Secret) => void): grpc.ClientUnaryCall;
    createSecret(request: secrets_pb.CreateSecretRequest, callback: (error: grpc.ServiceError | null, response: secrets_pb.Secret) => void): grpc.ClientUnaryCall;
    createSecret(request: secrets_pb.CreateSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_pb.Secret) => void): grpc.ClientUnaryCall;
    createSecret(request: secrets_pb.CreateSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_pb.Secret) => void): grpc.ClientUnaryCall;
    deleteSecret(request: secrets_pb.DeleteSecretRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteSecret(request: secrets_pb.DeleteSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteSecret(request: secrets_pb.DeleteSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class SecretsClient extends grpc.Client implements ISecretsClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public listSecretsId(request: secrets_pb.ListSecretsIdRequest, callback: (error: grpc.ServiceError | null, response: secrets_pb.ListSecretsIdResponse) => void): grpc.ClientUnaryCall;
    public listSecretsId(request: secrets_pb.ListSecretsIdRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_pb.ListSecretsIdResponse) => void): grpc.ClientUnaryCall;
    public listSecretsId(request: secrets_pb.ListSecretsIdRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_pb.ListSecretsIdResponse) => void): grpc.ClientUnaryCall;
    public getSecret(request: secrets_pb.GetSecretRequest, callback: (error: grpc.ServiceError | null, response: secrets_pb.Secret) => void): grpc.ClientUnaryCall;
    public getSecret(request: secrets_pb.GetSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_pb.Secret) => void): grpc.ClientUnaryCall;
    public getSecret(request: secrets_pb.GetSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_pb.Secret) => void): grpc.ClientUnaryCall;
    public createSecret(request: secrets_pb.CreateSecretRequest, callback: (error: grpc.ServiceError | null, response: secrets_pb.Secret) => void): grpc.ClientUnaryCall;
    public createSecret(request: secrets_pb.CreateSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: secrets_pb.Secret) => void): grpc.ClientUnaryCall;
    public createSecret(request: secrets_pb.CreateSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: secrets_pb.Secret) => void): grpc.ClientUnaryCall;
    public deleteSecret(request: secrets_pb.DeleteSecretRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteSecret(request: secrets_pb.DeleteSecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteSecret(request: secrets_pb.DeleteSecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}
