// package: fonoster.monitor.v1beta1
// file: monitor.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as monitor_pb from "./monitor_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

interface IMonitorService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    searchEvents: IMonitorService_ISearchEvents;
}

interface IMonitorService_ISearchEvents extends grpc.MethodDefinition<monitor_pb.SearchEventsRequest, monitor_pb.Event> {
    path: "/fonoster.monitor.v1beta1.Monitor/SearchEvents";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<monitor_pb.SearchEventsRequest>;
    requestDeserialize: grpc.deserialize<monitor_pb.SearchEventsRequest>;
    responseSerialize: grpc.serialize<monitor_pb.Event>;
    responseDeserialize: grpc.deserialize<monitor_pb.Event>;
}

export const MonitorService: IMonitorService;

export interface IMonitorServer extends grpc.UntypedServiceImplementation {
    searchEvents: grpc.handleServerStreamingCall<monitor_pb.SearchEventsRequest, monitor_pb.Event>;
}

export interface IMonitorClient {
    searchEvents(request: monitor_pb.SearchEventsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<monitor_pb.Event>;
    searchEvents(request: monitor_pb.SearchEventsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<monitor_pb.Event>;
}

export class MonitorClient extends grpc.Client implements IMonitorClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public searchEvents(request: monitor_pb.SearchEventsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<monitor_pb.Event>;
    public searchEvents(request: monitor_pb.SearchEventsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<monitor_pb.Event>;
}
