// package: fonos.numbers.v1alpha1
// file: numbers.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as numbers_pb from "./numbers_pb";
import * as common_pb from "./common_pb";
import * as appmanager_pb from "./appmanager_pb";

interface INumbersService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    listNumbers: INumbersService_IListNumbers;
    createNumber: INumbersService_ICreateNumber;
    getIngressApp: INumbersService_IGetIngressApp;
    getNumber: INumbersService_IGetNumber;
    updateNumber: INumbersService_IUpdateNumber;
    deleteNumber: INumbersService_IDeleteNumber;
}

interface INumbersService_IListNumbers extends grpc.MethodDefinition<numbers_pb.ListNumbersRequest, numbers_pb.ListNumbersResponse> {
    path: "/fonos.numbers.v1alpha1.Numbers/ListNumbers";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<numbers_pb.ListNumbersRequest>;
    requestDeserialize: grpc.deserialize<numbers_pb.ListNumbersRequest>;
    responseSerialize: grpc.serialize<numbers_pb.ListNumbersResponse>;
    responseDeserialize: grpc.deserialize<numbers_pb.ListNumbersResponse>;
}
interface INumbersService_ICreateNumber extends grpc.MethodDefinition<numbers_pb.CreateNumberRequest, numbers_pb.Number> {
    path: "/fonos.numbers.v1alpha1.Numbers/CreateNumber";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<numbers_pb.CreateNumberRequest>;
    requestDeserialize: grpc.deserialize<numbers_pb.CreateNumberRequest>;
    responseSerialize: grpc.serialize<numbers_pb.Number>;
    responseDeserialize: grpc.deserialize<numbers_pb.Number>;
}
interface INumbersService_IGetIngressApp extends grpc.MethodDefinition<numbers_pb.GetIngressAppRequest, appmanager_pb.App> {
    path: "/fonos.numbers.v1alpha1.Numbers/GetIngressApp";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<numbers_pb.GetIngressAppRequest>;
    requestDeserialize: grpc.deserialize<numbers_pb.GetIngressAppRequest>;
    responseSerialize: grpc.serialize<appmanager_pb.App>;
    responseDeserialize: grpc.deserialize<appmanager_pb.App>;
}
interface INumbersService_IGetNumber extends grpc.MethodDefinition<numbers_pb.GetNumberRequest, numbers_pb.Number> {
    path: "/fonos.numbers.v1alpha1.Numbers/GetNumber";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<numbers_pb.GetNumberRequest>;
    requestDeserialize: grpc.deserialize<numbers_pb.GetNumberRequest>;
    responseSerialize: grpc.serialize<numbers_pb.Number>;
    responseDeserialize: grpc.deserialize<numbers_pb.Number>;
}
interface INumbersService_IUpdateNumber extends grpc.MethodDefinition<numbers_pb.UpdateNumberRequest, numbers_pb.Number> {
    path: "/fonos.numbers.v1alpha1.Numbers/UpdateNumber";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<numbers_pb.UpdateNumberRequest>;
    requestDeserialize: grpc.deserialize<numbers_pb.UpdateNumberRequest>;
    responseSerialize: grpc.serialize<numbers_pb.Number>;
    responseDeserialize: grpc.deserialize<numbers_pb.Number>;
}
interface INumbersService_IDeleteNumber extends grpc.MethodDefinition<numbers_pb.DeleteNumberRequest, common_pb.Empty> {
    path: "/fonos.numbers.v1alpha1.Numbers/DeleteNumber";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<numbers_pb.DeleteNumberRequest>;
    requestDeserialize: grpc.deserialize<numbers_pb.DeleteNumberRequest>;
    responseSerialize: grpc.serialize<common_pb.Empty>;
    responseDeserialize: grpc.deserialize<common_pb.Empty>;
}

export const NumbersService: INumbersService;

export interface INumbersServer {
    listNumbers: grpc.handleUnaryCall<numbers_pb.ListNumbersRequest, numbers_pb.ListNumbersResponse>;
    createNumber: grpc.handleUnaryCall<numbers_pb.CreateNumberRequest, numbers_pb.Number>;
    getIngressApp: grpc.handleUnaryCall<numbers_pb.GetIngressAppRequest, appmanager_pb.App>;
    getNumber: grpc.handleUnaryCall<numbers_pb.GetNumberRequest, numbers_pb.Number>;
    updateNumber: grpc.handleUnaryCall<numbers_pb.UpdateNumberRequest, numbers_pb.Number>;
    deleteNumber: grpc.handleUnaryCall<numbers_pb.DeleteNumberRequest, common_pb.Empty>;
}

export interface INumbersClient {
    listNumbers(request: numbers_pb.ListNumbersRequest, callback: (error: grpc.ServiceError | null, response: numbers_pb.ListNumbersResponse) => void): grpc.ClientUnaryCall;
    listNumbers(request: numbers_pb.ListNumbersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: numbers_pb.ListNumbersResponse) => void): grpc.ClientUnaryCall;
    listNumbers(request: numbers_pb.ListNumbersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: numbers_pb.ListNumbersResponse) => void): grpc.ClientUnaryCall;
    createNumber(request: numbers_pb.CreateNumberRequest, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    createNumber(request: numbers_pb.CreateNumberRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    createNumber(request: numbers_pb.CreateNumberRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    getIngressApp(request: numbers_pb.GetIngressAppRequest, callback: (error: grpc.ServiceError | null, response: appmanager_pb.App) => void): grpc.ClientUnaryCall;
    getIngressApp(request: numbers_pb.GetIngressAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: appmanager_pb.App) => void): grpc.ClientUnaryCall;
    getIngressApp(request: numbers_pb.GetIngressAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: appmanager_pb.App) => void): grpc.ClientUnaryCall;
    getNumber(request: numbers_pb.GetNumberRequest, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    getNumber(request: numbers_pb.GetNumberRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    getNumber(request: numbers_pb.GetNumberRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    updateNumber(request: numbers_pb.UpdateNumberRequest, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    updateNumber(request: numbers_pb.UpdateNumberRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    updateNumber(request: numbers_pb.UpdateNumberRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    deleteNumber(request: numbers_pb.DeleteNumberRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteNumber(request: numbers_pb.DeleteNumberRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteNumber(request: numbers_pb.DeleteNumberRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class NumbersClient extends grpc.Client implements INumbersClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public listNumbers(request: numbers_pb.ListNumbersRequest, callback: (error: grpc.ServiceError | null, response: numbers_pb.ListNumbersResponse) => void): grpc.ClientUnaryCall;
    public listNumbers(request: numbers_pb.ListNumbersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: numbers_pb.ListNumbersResponse) => void): grpc.ClientUnaryCall;
    public listNumbers(request: numbers_pb.ListNumbersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: numbers_pb.ListNumbersResponse) => void): grpc.ClientUnaryCall;
    public createNumber(request: numbers_pb.CreateNumberRequest, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    public createNumber(request: numbers_pb.CreateNumberRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    public createNumber(request: numbers_pb.CreateNumberRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    public getIngressApp(request: numbers_pb.GetIngressAppRequest, callback: (error: grpc.ServiceError | null, response: appmanager_pb.App) => void): grpc.ClientUnaryCall;
    public getIngressApp(request: numbers_pb.GetIngressAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: appmanager_pb.App) => void): grpc.ClientUnaryCall;
    public getIngressApp(request: numbers_pb.GetIngressAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: appmanager_pb.App) => void): grpc.ClientUnaryCall;
    public getNumber(request: numbers_pb.GetNumberRequest, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    public getNumber(request: numbers_pb.GetNumberRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    public getNumber(request: numbers_pb.GetNumberRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    public updateNumber(request: numbers_pb.UpdateNumberRequest, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    public updateNumber(request: numbers_pb.UpdateNumberRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    public updateNumber(request: numbers_pb.UpdateNumberRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: numbers_pb.Number) => void): grpc.ClientUnaryCall;
    public deleteNumber(request: numbers_pb.DeleteNumberRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteNumber(request: numbers_pb.DeleteNumberRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteNumber(request: numbers_pb.DeleteNumberRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}
