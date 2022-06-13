// package: fonoster.limiter.v1beta1
// file: limiter.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import {handleClientStreamingCall} from "@grpc/grpc-js/build/src/server-call";
import * as limiter_pb from "./limiter_pb";

interface ILimiterService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    checkAuthorized: ILimiterService_ICheckAuthorized;
}

interface ILimiterService_ICheckAuthorized extends grpc.MethodDefinition<limiter_pb.CheckAuthorizedRequest, limiter_pb.CheckAuthorizedResponse> {
    path: "/fonoster.limiter.v1beta1.Limiter/CheckAuthorized";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<limiter_pb.CheckAuthorizedRequest>;
    requestDeserialize: grpc.deserialize<limiter_pb.CheckAuthorizedRequest>;
    responseSerialize: grpc.serialize<limiter_pb.CheckAuthorizedResponse>;
    responseDeserialize: grpc.deserialize<limiter_pb.CheckAuthorizedResponse>;
}

export const LimiterService: ILimiterService;

export interface ILimiterServer extends grpc.UntypedServiceImplementation {
    checkAuthorized: grpc.handleUnaryCall<limiter_pb.CheckAuthorizedRequest, limiter_pb.CheckAuthorizedResponse>;
}

export interface ILimiterClient {
    checkAuthorized(request: limiter_pb.CheckAuthorizedRequest, callback: (error: grpc.ServiceError | null, response: limiter_pb.CheckAuthorizedResponse) => void): grpc.ClientUnaryCall;
    checkAuthorized(request: limiter_pb.CheckAuthorizedRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: limiter_pb.CheckAuthorizedResponse) => void): grpc.ClientUnaryCall;
    checkAuthorized(request: limiter_pb.CheckAuthorizedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: limiter_pb.CheckAuthorizedResponse) => void): grpc.ClientUnaryCall;
}

export class LimiterClient extends grpc.Client implements ILimiterClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public checkAuthorized(request: limiter_pb.CheckAuthorizedRequest, callback: (error: grpc.ServiceError | null, response: limiter_pb.CheckAuthorizedResponse) => void): grpc.ClientUnaryCall;
    public checkAuthorized(request: limiter_pb.CheckAuthorizedRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: limiter_pb.CheckAuthorizedResponse) => void): grpc.ClientUnaryCall;
    public checkAuthorized(request: limiter_pb.CheckAuthorizedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: limiter_pb.CheckAuthorizedResponse) => void): grpc.ClientUnaryCall;
}
