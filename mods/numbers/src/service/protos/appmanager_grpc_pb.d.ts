// package: fonos.appmanager.v1alpha1
// file: appmanager.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as appmanager_pb from "./appmanager_pb";
import * as common_pb from "./common_pb";

interface IAppManagerService
  extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  listApps: IAppManagerService_IListApps;
  getApp: IAppManagerService_IGetApp;
  createApp: IAppManagerService_ICreateApp;
  updateApp: IAppManagerService_IUpdateApp;
  deleteApp: IAppManagerService_IDeleteApp;
}

interface IAppManagerService_IListApps
  extends grpc.MethodDefinition<
    appmanager_pb.ListAppsRequest,
    appmanager_pb.ListAppsResponse
  > {
  path: "/fonos.appmanager.v1alpha1.AppManager/ListApps";
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<appmanager_pb.ListAppsRequest>;
  requestDeserialize: grpc.deserialize<appmanager_pb.ListAppsRequest>;
  responseSerialize: grpc.serialize<appmanager_pb.ListAppsResponse>;
  responseDeserialize: grpc.deserialize<appmanager_pb.ListAppsResponse>;
}
interface IAppManagerService_IGetApp
  extends grpc.MethodDefinition<
    appmanager_pb.GetAppRequest,
    appmanager_pb.App
  > {
  path: "/fonos.appmanager.v1alpha1.AppManager/GetApp";
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<appmanager_pb.GetAppRequest>;
  requestDeserialize: grpc.deserialize<appmanager_pb.GetAppRequest>;
  responseSerialize: grpc.serialize<appmanager_pb.App>;
  responseDeserialize: grpc.deserialize<appmanager_pb.App>;
}
interface IAppManagerService_ICreateApp
  extends grpc.MethodDefinition<
    appmanager_pb.CreateAppRequest,
    appmanager_pb.App
  > {
  path: "/fonos.appmanager.v1alpha1.AppManager/CreateApp";
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<appmanager_pb.CreateAppRequest>;
  requestDeserialize: grpc.deserialize<appmanager_pb.CreateAppRequest>;
  responseSerialize: grpc.serialize<appmanager_pb.App>;
  responseDeserialize: grpc.deserialize<appmanager_pb.App>;
}
interface IAppManagerService_IUpdateApp
  extends grpc.MethodDefinition<
    appmanager_pb.UpdateAppRequest,
    appmanager_pb.App
  > {
  path: "/fonos.appmanager.v1alpha1.AppManager/UpdateApp";
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<appmanager_pb.UpdateAppRequest>;
  requestDeserialize: grpc.deserialize<appmanager_pb.UpdateAppRequest>;
  responseSerialize: grpc.serialize<appmanager_pb.App>;
  responseDeserialize: grpc.deserialize<appmanager_pb.App>;
}
interface IAppManagerService_IDeleteApp
  extends grpc.MethodDefinition<
    appmanager_pb.DeleteAppRequest,
    common_pb.Empty
  > {
  path: "/fonos.appmanager.v1alpha1.AppManager/DeleteApp";
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<appmanager_pb.DeleteAppRequest>;
  requestDeserialize: grpc.deserialize<appmanager_pb.DeleteAppRequest>;
  responseSerialize: grpc.serialize<common_pb.Empty>;
  responseDeserialize: grpc.deserialize<common_pb.Empty>;
}

export const AppManagerService: IAppManagerService;

export interface IAppManagerServer {
  listApps: grpc.handleUnaryCall<
    appmanager_pb.ListAppsRequest,
    appmanager_pb.ListAppsResponse
  >;
  getApp: grpc.handleUnaryCall<appmanager_pb.GetAppRequest, appmanager_pb.App>;
  createApp: grpc.handleUnaryCall<
    appmanager_pb.CreateAppRequest,
    appmanager_pb.App
  >;
  updateApp: grpc.handleUnaryCall<
    appmanager_pb.UpdateAppRequest,
    appmanager_pb.App
  >;
  deleteApp: grpc.handleUnaryCall<
    appmanager_pb.DeleteAppRequest,
    common_pb.Empty
  >;
}

export interface IAppManagerClient {
  listApps(
    request: appmanager_pb.ListAppsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.ListAppsResponse
    ) => void
  ): grpc.ClientUnaryCall;
  listApps(
    request: appmanager_pb.ListAppsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.ListAppsResponse
    ) => void
  ): grpc.ClientUnaryCall;
  listApps(
    request: appmanager_pb.ListAppsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.ListAppsResponse
    ) => void
  ): grpc.ClientUnaryCall;
  getApp(
    request: appmanager_pb.GetAppRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  getApp(
    request: appmanager_pb.GetAppRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  getApp(
    request: appmanager_pb.GetAppRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  createApp(
    request: appmanager_pb.CreateAppRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  createApp(
    request: appmanager_pb.CreateAppRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  createApp(
    request: appmanager_pb.CreateAppRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  updateApp(
    request: appmanager_pb.UpdateAppRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  updateApp(
    request: appmanager_pb.UpdateAppRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  updateApp(
    request: appmanager_pb.UpdateAppRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  deleteApp(
    request: appmanager_pb.DeleteAppRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: common_pb.Empty
    ) => void
  ): grpc.ClientUnaryCall;
  deleteApp(
    request: appmanager_pb.DeleteAppRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: common_pb.Empty
    ) => void
  ): grpc.ClientUnaryCall;
  deleteApp(
    request: appmanager_pb.DeleteAppRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: common_pb.Empty
    ) => void
  ): grpc.ClientUnaryCall;
}

export class AppManagerClient extends grpc.Client implements IAppManagerClient {
  constructor(
    address: string,
    credentials: grpc.ChannelCredentials,
    options?: object
  );
  public listApps(
    request: appmanager_pb.ListAppsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.ListAppsResponse
    ) => void
  ): grpc.ClientUnaryCall;
  public listApps(
    request: appmanager_pb.ListAppsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.ListAppsResponse
    ) => void
  ): grpc.ClientUnaryCall;
  public listApps(
    request: appmanager_pb.ListAppsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.ListAppsResponse
    ) => void
  ): grpc.ClientUnaryCall;
  public getApp(
    request: appmanager_pb.GetAppRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  public getApp(
    request: appmanager_pb.GetAppRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  public getApp(
    request: appmanager_pb.GetAppRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  public createApp(
    request: appmanager_pb.CreateAppRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  public createApp(
    request: appmanager_pb.CreateAppRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  public createApp(
    request: appmanager_pb.CreateAppRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  public updateApp(
    request: appmanager_pb.UpdateAppRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  public updateApp(
    request: appmanager_pb.UpdateAppRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  public updateApp(
    request: appmanager_pb.UpdateAppRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: appmanager_pb.App
    ) => void
  ): grpc.ClientUnaryCall;
  public deleteApp(
    request: appmanager_pb.DeleteAppRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: common_pb.Empty
    ) => void
  ): grpc.ClientUnaryCall;
  public deleteApp(
    request: appmanager_pb.DeleteAppRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: common_pb.Empty
    ) => void
  ): grpc.ClientUnaryCall;
  public deleteApp(
    request: appmanager_pb.DeleteAppRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: common_pb.Empty
    ) => void
  ): grpc.ClientUnaryCall;
}
