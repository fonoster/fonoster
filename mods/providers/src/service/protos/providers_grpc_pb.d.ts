// package: fonoster.providers.v1beta1
// file: providers.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as providers_pb from "./providers_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";
import * as common_pb from "./common_pb";

interface IProvidersService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    listProviders: IProvidersService_IListProviders;
    createProvider: IProvidersService_ICreateProvider;
    getProvider: IProvidersService_IGetProvider;
    updateProvider: IProvidersService_IUpdateProvider;
    deleteProvider: IProvidersService_IDeleteProvider;
}

interface IProvidersService_IListProviders extends grpc.MethodDefinition<providers_pb.ListProvidersRequest, providers_pb.ListProvidersResponse> {
    path: "/fonoster.providers.v1beta1.Providers/ListProviders";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<providers_pb.ListProvidersRequest>;
    requestDeserialize: grpc.deserialize<providers_pb.ListProvidersRequest>;
    responseSerialize: grpc.serialize<providers_pb.ListProvidersResponse>;
    responseDeserialize: grpc.deserialize<providers_pb.ListProvidersResponse>;
}
interface IProvidersService_ICreateProvider extends grpc.MethodDefinition<providers_pb.CreateProviderRequest, providers_pb.Provider> {
    path: "/fonoster.providers.v1beta1.Providers/CreateProvider";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<providers_pb.CreateProviderRequest>;
    requestDeserialize: grpc.deserialize<providers_pb.CreateProviderRequest>;
    responseSerialize: grpc.serialize<providers_pb.Provider>;
    responseDeserialize: grpc.deserialize<providers_pb.Provider>;
}
interface IProvidersService_IGetProvider extends grpc.MethodDefinition<providers_pb.GetProviderRequest, providers_pb.Provider> {
    path: "/fonoster.providers.v1beta1.Providers/GetProvider";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<providers_pb.GetProviderRequest>;
    requestDeserialize: grpc.deserialize<providers_pb.GetProviderRequest>;
    responseSerialize: grpc.serialize<providers_pb.Provider>;
    responseDeserialize: grpc.deserialize<providers_pb.Provider>;
}
interface IProvidersService_IUpdateProvider extends grpc.MethodDefinition<providers_pb.UpdateProviderRequest, providers_pb.Provider> {
    path: "/fonoster.providers.v1beta1.Providers/UpdateProvider";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<providers_pb.UpdateProviderRequest>;
    requestDeserialize: grpc.deserialize<providers_pb.UpdateProviderRequest>;
    responseSerialize: grpc.serialize<providers_pb.Provider>;
    responseDeserialize: grpc.deserialize<providers_pb.Provider>;
}
interface IProvidersService_IDeleteProvider extends grpc.MethodDefinition<providers_pb.DeleteProviderRequest, common_pb.Empty> {
    path: "/fonoster.providers.v1beta1.Providers/DeleteProvider";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<providers_pb.DeleteProviderRequest>;
    requestDeserialize: grpc.deserialize<providers_pb.DeleteProviderRequest>;
    responseSerialize: grpc.serialize<common_pb.Empty>;
    responseDeserialize: grpc.deserialize<common_pb.Empty>;
}

export const ProvidersService: IProvidersService;

export interface IProvidersServer extends grpc.UntypedServiceImplementation {
    listProviders: grpc.handleUnaryCall<providers_pb.ListProvidersRequest, providers_pb.ListProvidersResponse>;
    createProvider: grpc.handleUnaryCall<providers_pb.CreateProviderRequest, providers_pb.Provider>;
    getProvider: grpc.handleUnaryCall<providers_pb.GetProviderRequest, providers_pb.Provider>;
    updateProvider: grpc.handleUnaryCall<providers_pb.UpdateProviderRequest, providers_pb.Provider>;
    deleteProvider: grpc.handleUnaryCall<providers_pb.DeleteProviderRequest, common_pb.Empty>;
}

export interface IProvidersClient {
    listProviders(request: providers_pb.ListProvidersRequest, callback: (error: grpc.ServiceError | null, response: providers_pb.ListProvidersResponse) => void): grpc.ClientUnaryCall;
    listProviders(request: providers_pb.ListProvidersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: providers_pb.ListProvidersResponse) => void): grpc.ClientUnaryCall;
    listProviders(request: providers_pb.ListProvidersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: providers_pb.ListProvidersResponse) => void): grpc.ClientUnaryCall;
    createProvider(request: providers_pb.CreateProviderRequest, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    createProvider(request: providers_pb.CreateProviderRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    createProvider(request: providers_pb.CreateProviderRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    getProvider(request: providers_pb.GetProviderRequest, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    getProvider(request: providers_pb.GetProviderRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    getProvider(request: providers_pb.GetProviderRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    updateProvider(request: providers_pb.UpdateProviderRequest, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    updateProvider(request: providers_pb.UpdateProviderRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    updateProvider(request: providers_pb.UpdateProviderRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    deleteProvider(request: providers_pb.DeleteProviderRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteProvider(request: providers_pb.DeleteProviderRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteProvider(request: providers_pb.DeleteProviderRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class ProvidersClient extends grpc.Client implements IProvidersClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public listProviders(request: providers_pb.ListProvidersRequest, callback: (error: grpc.ServiceError | null, response: providers_pb.ListProvidersResponse) => void): grpc.ClientUnaryCall;
    public listProviders(request: providers_pb.ListProvidersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: providers_pb.ListProvidersResponse) => void): grpc.ClientUnaryCall;
    public listProviders(request: providers_pb.ListProvidersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: providers_pb.ListProvidersResponse) => void): grpc.ClientUnaryCall;
    public createProvider(request: providers_pb.CreateProviderRequest, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    public createProvider(request: providers_pb.CreateProviderRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    public createProvider(request: providers_pb.CreateProviderRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    public getProvider(request: providers_pb.GetProviderRequest, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    public getProvider(request: providers_pb.GetProviderRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    public getProvider(request: providers_pb.GetProviderRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    public updateProvider(request: providers_pb.UpdateProviderRequest, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    public updateProvider(request: providers_pb.UpdateProviderRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    public updateProvider(request: providers_pb.UpdateProviderRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: providers_pb.Provider) => void): grpc.ClientUnaryCall;
    public deleteProvider(request: providers_pb.DeleteProviderRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteProvider(request: providers_pb.DeleteProviderRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteProvider(request: providers_pb.DeleteProviderRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}
