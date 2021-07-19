// package: fonos.funcs.v1alpha1
// file: funcs.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as funcs_pb from "./funcs_pb";
import * as common_pb from "./common_pb";

interface IFuncsService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    listFuncs: IFuncsService_IListFuncs;
    getFunc: IFuncsService_IGetFunc;
    deployFunc: IFuncsService_IDeployFunc;
    deleteFunc: IFuncsService_IDeleteFunc;
    getFuncLogs: IFuncsService_IGetFuncLogs;
    createRegistryToken: IFuncsService_ICreateRegistryToken;
}

interface IFuncsService_IListFuncs extends grpc.MethodDefinition<funcs_pb.ListFuncsRequest, funcs_pb.ListFuncsResponse> {
    path: "/fonos.funcs.v1alpha1.Funcs/ListFuncs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<funcs_pb.ListFuncsRequest>;
    requestDeserialize: grpc.deserialize<funcs_pb.ListFuncsRequest>;
    responseSerialize: grpc.serialize<funcs_pb.ListFuncsResponse>;
    responseDeserialize: grpc.deserialize<funcs_pb.ListFuncsResponse>;
}
interface IFuncsService_IGetFunc extends grpc.MethodDefinition<funcs_pb.GetFuncRequest, funcs_pb.Func> {
    path: "/fonos.funcs.v1alpha1.Funcs/GetFunc";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<funcs_pb.GetFuncRequest>;
    requestDeserialize: grpc.deserialize<funcs_pb.GetFuncRequest>;
    responseSerialize: grpc.serialize<funcs_pb.Func>;
    responseDeserialize: grpc.deserialize<funcs_pb.Func>;
}
interface IFuncsService_IDeployFunc extends grpc.MethodDefinition<funcs_pb.DeployFuncRequest, funcs_pb.DeployStream> {
    path: "/fonos.funcs.v1alpha1.Funcs/DeployFunc";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<funcs_pb.DeployFuncRequest>;
    requestDeserialize: grpc.deserialize<funcs_pb.DeployFuncRequest>;
    responseSerialize: grpc.serialize<funcs_pb.DeployStream>;
    responseDeserialize: grpc.deserialize<funcs_pb.DeployStream>;
}
interface IFuncsService_IDeleteFunc extends grpc.MethodDefinition<funcs_pb.DeleteFuncRequest, common_pb.Empty> {
    path: "/fonos.funcs.v1alpha1.Funcs/DeleteFunc";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<funcs_pb.DeleteFuncRequest>;
    requestDeserialize: grpc.deserialize<funcs_pb.DeleteFuncRequest>;
    responseSerialize: grpc.serialize<common_pb.Empty>;
    responseDeserialize: grpc.deserialize<common_pb.Empty>;
}
interface IFuncsService_IGetFuncLogs extends grpc.MethodDefinition<funcs_pb.GetFuncLogsRequest, funcs_pb.FuncLog> {
    path: "/fonos.funcs.v1alpha1.Funcs/GetFuncLogs";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<funcs_pb.GetFuncLogsRequest>;
    requestDeserialize: grpc.deserialize<funcs_pb.GetFuncLogsRequest>;
    responseSerialize: grpc.serialize<funcs_pb.FuncLog>;
    responseDeserialize: grpc.deserialize<funcs_pb.FuncLog>;
}
interface IFuncsService_ICreateRegistryToken extends grpc.MethodDefinition<funcs_pb.CreateRegistryTokenRequest, funcs_pb.CreateRegistryTokenResponse> {
    path: "/fonos.funcs.v1alpha1.Funcs/CreateRegistryToken";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<funcs_pb.CreateRegistryTokenRequest>;
    requestDeserialize: grpc.deserialize<funcs_pb.CreateRegistryTokenRequest>;
    responseSerialize: grpc.serialize<funcs_pb.CreateRegistryTokenResponse>;
    responseDeserialize: grpc.deserialize<funcs_pb.CreateRegistryTokenResponse>;
}

export const FuncsService: IFuncsService;

export interface IFuncsServer extends grpc.UntypedServiceImplementation {
    listFuncs: grpc.handleUnaryCall<funcs_pb.ListFuncsRequest, funcs_pb.ListFuncsResponse>;
    getFunc: grpc.handleUnaryCall<funcs_pb.GetFuncRequest, funcs_pb.Func>;
    deployFunc: grpc.handleServerStreamingCall<funcs_pb.DeployFuncRequest, funcs_pb.DeployStream>;
    deleteFunc: grpc.handleUnaryCall<funcs_pb.DeleteFuncRequest, common_pb.Empty>;
    getFuncLogs: grpc.handleServerStreamingCall<funcs_pb.GetFuncLogsRequest, funcs_pb.FuncLog>;
    createRegistryToken: grpc.handleUnaryCall<funcs_pb.CreateRegistryTokenRequest, funcs_pb.CreateRegistryTokenResponse>;
}

export interface IFuncsClient {
    listFuncs(request: funcs_pb.ListFuncsRequest, callback: (error: grpc.ServiceError | null, response: funcs_pb.ListFuncsResponse) => void): grpc.ClientUnaryCall;
    listFuncs(request: funcs_pb.ListFuncsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: funcs_pb.ListFuncsResponse) => void): grpc.ClientUnaryCall;
    listFuncs(request: funcs_pb.ListFuncsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: funcs_pb.ListFuncsResponse) => void): grpc.ClientUnaryCall;
    getFunc(request: funcs_pb.GetFuncRequest, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    getFunc(request: funcs_pb.GetFuncRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    getFunc(request: funcs_pb.GetFuncRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    deployFunc(request: funcs_pb.DeployFuncRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<funcs_pb.DeployStream>;
    deployFunc(request: funcs_pb.DeployFuncRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<funcs_pb.DeployStream>;
    deleteFunc(request: funcs_pb.DeleteFuncRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteFunc(request: funcs_pb.DeleteFuncRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteFunc(request: funcs_pb.DeleteFuncRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    getFuncLogs(request: funcs_pb.GetFuncLogsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<funcs_pb.FuncLog>;
    getFuncLogs(request: funcs_pb.GetFuncLogsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<funcs_pb.FuncLog>;
    createRegistryToken(request: funcs_pb.CreateRegistryTokenRequest, callback: (error: grpc.ServiceError | null, response: funcs_pb.CreateRegistryTokenResponse) => void): grpc.ClientUnaryCall;
    createRegistryToken(request: funcs_pb.CreateRegistryTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: funcs_pb.CreateRegistryTokenResponse) => void): grpc.ClientUnaryCall;
    createRegistryToken(request: funcs_pb.CreateRegistryTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: funcs_pb.CreateRegistryTokenResponse) => void): grpc.ClientUnaryCall;
}

export class FuncsClient extends grpc.Client implements IFuncsClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public listFuncs(request: funcs_pb.ListFuncsRequest, callback: (error: grpc.ServiceError | null, response: funcs_pb.ListFuncsResponse) => void): grpc.ClientUnaryCall;
    public listFuncs(request: funcs_pb.ListFuncsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: funcs_pb.ListFuncsResponse) => void): grpc.ClientUnaryCall;
    public listFuncs(request: funcs_pb.ListFuncsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: funcs_pb.ListFuncsResponse) => void): grpc.ClientUnaryCall;
    public getFunc(request: funcs_pb.GetFuncRequest, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    public getFunc(request: funcs_pb.GetFuncRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    public getFunc(request: funcs_pb.GetFuncRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    public deployFunc(request: funcs_pb.DeployFuncRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<funcs_pb.DeployStream>;
    public deployFunc(request: funcs_pb.DeployFuncRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<funcs_pb.DeployStream>;
    public deleteFunc(request: funcs_pb.DeleteFuncRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteFunc(request: funcs_pb.DeleteFuncRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteFunc(request: funcs_pb.DeleteFuncRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public getFuncLogs(request: funcs_pb.GetFuncLogsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<funcs_pb.FuncLog>;
    public getFuncLogs(request: funcs_pb.GetFuncLogsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<funcs_pb.FuncLog>;
    public createRegistryToken(request: funcs_pb.CreateRegistryTokenRequest, callback: (error: grpc.ServiceError | null, response: funcs_pb.CreateRegistryTokenResponse) => void): grpc.ClientUnaryCall;
    public createRegistryToken(request: funcs_pb.CreateRegistryTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: funcs_pb.CreateRegistryTokenResponse) => void): grpc.ClientUnaryCall;
    public createRegistryToken(request: funcs_pb.CreateRegistryTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: funcs_pb.CreateRegistryTokenResponse) => void): grpc.ClientUnaryCall;
}
