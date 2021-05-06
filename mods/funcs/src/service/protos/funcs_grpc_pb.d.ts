// package: fonos.appmanager.v1alpha1
// file: funcs.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as funcs_pb from "./funcs_pb";
import * as common_pb from "./common_pb";

interface IFuncsService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    listFuncs: IFuncsService_IListFuncs;
    getFunc: IFuncsService_IGetFunc;
    createFunc: IFuncsService_ICreateFunc;
    deleteFunc: IFuncsService_IDeleteFunc;
    getFuncLogs: IFuncsService_IGetFuncLogs;
}

interface IFuncsService_IListFuncs extends grpc.MethodDefinition<funcs_pb.ListFuncsRequest, funcs_pb.ListFuncsResponse> {
    path: "/fonos.appmanager.v1alpha1.Funcs/ListFuncs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<funcs_pb.ListFuncsRequest>;
    requestDeserialize: grpc.deserialize<funcs_pb.ListFuncsRequest>;
    responseSerialize: grpc.serialize<funcs_pb.ListFuncsResponse>;
    responseDeserialize: grpc.deserialize<funcs_pb.ListFuncsResponse>;
}
interface IFuncsService_IGetFunc extends grpc.MethodDefinition<funcs_pb.GetFuncRequest, funcs_pb.Func> {
    path: "/fonos.appmanager.v1alpha1.Funcs/GetFunc";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<funcs_pb.GetFuncRequest>;
    requestDeserialize: grpc.deserialize<funcs_pb.GetFuncRequest>;
    responseSerialize: grpc.serialize<funcs_pb.Func>;
    responseDeserialize: grpc.deserialize<funcs_pb.Func>;
}
interface IFuncsService_ICreateFunc extends grpc.MethodDefinition<funcs_pb.CreateFuncRequest, funcs_pb.Func> {
    path: "/fonos.appmanager.v1alpha1.Funcs/CreateFunc";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<funcs_pb.CreateFuncRequest>;
    requestDeserialize: grpc.deserialize<funcs_pb.CreateFuncRequest>;
    responseSerialize: grpc.serialize<funcs_pb.Func>;
    responseDeserialize: grpc.deserialize<funcs_pb.Func>;
}
interface IFuncsService_IDeleteFunc extends grpc.MethodDefinition<funcs_pb.DeleteFuncRequest, common_pb.Empty> {
    path: "/fonos.appmanager.v1alpha1.Funcs/DeleteFunc";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<funcs_pb.DeleteFuncRequest>;
    requestDeserialize: grpc.deserialize<funcs_pb.DeleteFuncRequest>;
    responseSerialize: grpc.serialize<common_pb.Empty>;
    responseDeserialize: grpc.deserialize<common_pb.Empty>;
}
interface IFuncsService_IGetFuncLogs extends grpc.MethodDefinition<funcs_pb.GetFuncLogsRequest, funcs_pb.FuncLog> {
    path: "/fonos.appmanager.v1alpha1.Funcs/GetFuncLogs";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<funcs_pb.GetFuncLogsRequest>;
    requestDeserialize: grpc.deserialize<funcs_pb.GetFuncLogsRequest>;
    responseSerialize: grpc.serialize<funcs_pb.FuncLog>;
    responseDeserialize: grpc.deserialize<funcs_pb.FuncLog>;
}

export const FuncsService: IFuncsService;

export interface IFuncsServer {
    listFuncs: grpc.handleUnaryCall<funcs_pb.ListFuncsRequest, funcs_pb.ListFuncsResponse>;
    getFunc: grpc.handleUnaryCall<funcs_pb.GetFuncRequest, funcs_pb.Func>;
    createFunc: grpc.handleUnaryCall<funcs_pb.CreateFuncRequest, funcs_pb.Func>;
    deleteFunc: grpc.handleUnaryCall<funcs_pb.DeleteFuncRequest, common_pb.Empty>;
    getFuncLogs: grpc.handleServerStreamingCall<funcs_pb.GetFuncLogsRequest, funcs_pb.FuncLog>;
}

export interface IFuncsClient {
    listFuncs(request: funcs_pb.ListFuncsRequest, callback: (error: grpc.ServiceError | null, response: funcs_pb.ListFuncsResponse) => void): grpc.ClientUnaryCall;
    listFuncs(request: funcs_pb.ListFuncsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: funcs_pb.ListFuncsResponse) => void): grpc.ClientUnaryCall;
    listFuncs(request: funcs_pb.ListFuncsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: funcs_pb.ListFuncsResponse) => void): grpc.ClientUnaryCall;
    getFunc(request: funcs_pb.GetFuncRequest, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    getFunc(request: funcs_pb.GetFuncRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    getFunc(request: funcs_pb.GetFuncRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    createFunc(request: funcs_pb.CreateFuncRequest, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    createFunc(request: funcs_pb.CreateFuncRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    createFunc(request: funcs_pb.CreateFuncRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    deleteFunc(request: funcs_pb.DeleteFuncRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteFunc(request: funcs_pb.DeleteFuncRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteFunc(request: funcs_pb.DeleteFuncRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    getFuncLogs(request: funcs_pb.GetFuncLogsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<funcs_pb.FuncLog>;
    getFuncLogs(request: funcs_pb.GetFuncLogsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<funcs_pb.FuncLog>;
}

export class FuncsClient extends grpc.Client implements IFuncsClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public listFuncs(request: funcs_pb.ListFuncsRequest, callback: (error: grpc.ServiceError | null, response: funcs_pb.ListFuncsResponse) => void): grpc.ClientUnaryCall;
    public listFuncs(request: funcs_pb.ListFuncsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: funcs_pb.ListFuncsResponse) => void): grpc.ClientUnaryCall;
    public listFuncs(request: funcs_pb.ListFuncsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: funcs_pb.ListFuncsResponse) => void): grpc.ClientUnaryCall;
    public getFunc(request: funcs_pb.GetFuncRequest, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    public getFunc(request: funcs_pb.GetFuncRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    public getFunc(request: funcs_pb.GetFuncRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    public createFunc(request: funcs_pb.CreateFuncRequest, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    public createFunc(request: funcs_pb.CreateFuncRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    public createFunc(request: funcs_pb.CreateFuncRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: funcs_pb.Func) => void): grpc.ClientUnaryCall;
    public deleteFunc(request: funcs_pb.DeleteFuncRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteFunc(request: funcs_pb.DeleteFuncRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteFunc(request: funcs_pb.DeleteFuncRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public getFuncLogs(request: funcs_pb.GetFuncLogsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<funcs_pb.FuncLog>;
    public getFuncLogs(request: funcs_pb.GetFuncLogsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<funcs_pb.FuncLog>;
}
