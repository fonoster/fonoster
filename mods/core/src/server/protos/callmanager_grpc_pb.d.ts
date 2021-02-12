// package: fonos.callmanager.v1alpha1
// file: callmanager.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as callmanager_pb from "./callmanager_pb";

interface ICallManagerService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    call: ICallManagerService_ICall;
}

interface ICallManagerService_ICall extends grpc.MethodDefinition<callmanager_pb.CallRequest, callmanager_pb.CallResponse> {
    path: "/fonos.callmanager.v1alpha1.CallManager/Call";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<callmanager_pb.CallRequest>;
    requestDeserialize: grpc.deserialize<callmanager_pb.CallRequest>;
    responseSerialize: grpc.serialize<callmanager_pb.CallResponse>;
    responseDeserialize: grpc.deserialize<callmanager_pb.CallResponse>;
}

export const CallManagerService: ICallManagerService;

export interface ICallManagerServer {
    call: grpc.handleUnaryCall<callmanager_pb.CallRequest, callmanager_pb.CallResponse>;
}

export interface ICallManagerClient {
    call(request: callmanager_pb.CallRequest, callback: (error: grpc.ServiceError | null, response: callmanager_pb.CallResponse) => void): grpc.ClientUnaryCall;
    call(request: callmanager_pb.CallRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: callmanager_pb.CallResponse) => void): grpc.ClientUnaryCall;
    call(request: callmanager_pb.CallRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: callmanager_pb.CallResponse) => void): grpc.ClientUnaryCall;
}

export class CallManagerClient extends grpc.Client implements ICallManagerClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public call(request: callmanager_pb.CallRequest, callback: (error: grpc.ServiceError | null, response: callmanager_pb.CallResponse) => void): grpc.ClientUnaryCall;
    public call(request: callmanager_pb.CallRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: callmanager_pb.CallResponse) => void): grpc.ClientUnaryCall;
    public call(request: callmanager_pb.CallRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: callmanager_pb.CallResponse) => void): grpc.ClientUnaryCall;
}
