// package: fonoster.apps.v1beta1
// file: apps.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as apps_pb from "./apps_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as common_pb from "./common_pb";

interface IAppsService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    listApps: IAppsService_IListApps;
    createApp: IAppsService_ICreateApp;
    getApp: IAppsService_IGetApp;
    updateApp: IAppsService_IUpdateApp;
    deleteApp: IAppsService_IDeleteApp;
}

interface IAppsService_IListApps extends grpc.MethodDefinition<apps_pb.ListAppsRequest, apps_pb.ListAppsResponse> {
    path: "/fonoster.apps.v1beta1.Apps/ListApps";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<apps_pb.ListAppsRequest>;
    requestDeserialize: grpc.deserialize<apps_pb.ListAppsRequest>;
    responseSerialize: grpc.serialize<apps_pb.ListAppsResponse>;
    responseDeserialize: grpc.deserialize<apps_pb.ListAppsResponse>;
}
interface IAppsService_ICreateApp extends grpc.MethodDefinition<apps_pb.CreateAppRequest, apps_pb.App> {
    path: "/fonoster.apps.v1beta1.Apps/CreateApp";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<apps_pb.CreateAppRequest>;
    requestDeserialize: grpc.deserialize<apps_pb.CreateAppRequest>;
    responseSerialize: grpc.serialize<apps_pb.App>;
    responseDeserialize: grpc.deserialize<apps_pb.App>;
}
interface IAppsService_IGetApp extends grpc.MethodDefinition<apps_pb.GetAppRequest, apps_pb.App> {
    path: "/fonoster.apps.v1beta1.Apps/GetApp";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<apps_pb.GetAppRequest>;
    requestDeserialize: grpc.deserialize<apps_pb.GetAppRequest>;
    responseSerialize: grpc.serialize<apps_pb.App>;
    responseDeserialize: grpc.deserialize<apps_pb.App>;
}
interface IAppsService_IUpdateApp extends grpc.MethodDefinition<apps_pb.UpdateAppRequest, apps_pb.App> {
    path: "/fonoster.apps.v1beta1.Apps/UpdateApp";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<apps_pb.UpdateAppRequest>;
    requestDeserialize: grpc.deserialize<apps_pb.UpdateAppRequest>;
    responseSerialize: grpc.serialize<apps_pb.App>;
    responseDeserialize: grpc.deserialize<apps_pb.App>;
}
interface IAppsService_IDeleteApp extends grpc.MethodDefinition<apps_pb.DeleteAppRequest, common_pb.Empty> {
    path: "/fonoster.apps.v1beta1.Apps/DeleteApp";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<apps_pb.DeleteAppRequest>;
    requestDeserialize: grpc.deserialize<apps_pb.DeleteAppRequest>;
    responseSerialize: grpc.serialize<common_pb.Empty>;
    responseDeserialize: grpc.deserialize<common_pb.Empty>;
}

export const AppsService: IAppsService;

export interface IAppsServer extends grpc.UntypedServiceImplementation {
    listApps: grpc.handleUnaryCall<apps_pb.ListAppsRequest, apps_pb.ListAppsResponse>;
    createApp: grpc.handleUnaryCall<apps_pb.CreateAppRequest, apps_pb.App>;
    getApp: grpc.handleUnaryCall<apps_pb.GetAppRequest, apps_pb.App>;
    updateApp: grpc.handleUnaryCall<apps_pb.UpdateAppRequest, apps_pb.App>;
    deleteApp: grpc.handleUnaryCall<apps_pb.DeleteAppRequest, common_pb.Empty>;
}

export interface IAppsClient {
    listApps(request: apps_pb.ListAppsRequest, callback: (error: grpc.ServiceError | null, response: apps_pb.ListAppsResponse) => void): grpc.ClientUnaryCall;
    listApps(request: apps_pb.ListAppsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: apps_pb.ListAppsResponse) => void): grpc.ClientUnaryCall;
    listApps(request: apps_pb.ListAppsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: apps_pb.ListAppsResponse) => void): grpc.ClientUnaryCall;
    createApp(request: apps_pb.CreateAppRequest, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    createApp(request: apps_pb.CreateAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    createApp(request: apps_pb.CreateAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    getApp(request: apps_pb.GetAppRequest, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    getApp(request: apps_pb.GetAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    getApp(request: apps_pb.GetAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    updateApp(request: apps_pb.UpdateAppRequest, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    updateApp(request: apps_pb.UpdateAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    updateApp(request: apps_pb.UpdateAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    deleteApp(request: apps_pb.DeleteAppRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteApp(request: apps_pb.DeleteAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteApp(request: apps_pb.DeleteAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class AppsClient extends grpc.Client implements IAppsClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public listApps(request: apps_pb.ListAppsRequest, callback: (error: grpc.ServiceError | null, response: apps_pb.ListAppsResponse) => void): grpc.ClientUnaryCall;
    public listApps(request: apps_pb.ListAppsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: apps_pb.ListAppsResponse) => void): grpc.ClientUnaryCall;
    public listApps(request: apps_pb.ListAppsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: apps_pb.ListAppsResponse) => void): grpc.ClientUnaryCall;
    public createApp(request: apps_pb.CreateAppRequest, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    public createApp(request: apps_pb.CreateAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    public createApp(request: apps_pb.CreateAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    public getApp(request: apps_pb.GetAppRequest, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    public getApp(request: apps_pb.GetAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    public getApp(request: apps_pb.GetAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    public updateApp(request: apps_pb.UpdateAppRequest, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    public updateApp(request: apps_pb.UpdateAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    public updateApp(request: apps_pb.UpdateAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: apps_pb.App) => void): grpc.ClientUnaryCall;
    public deleteApp(request: apps_pb.DeleteAppRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteApp(request: apps_pb.DeleteAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteApp(request: apps_pb.DeleteAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}
