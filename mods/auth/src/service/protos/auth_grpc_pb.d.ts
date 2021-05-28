// package: fonos.auth.v1alpha1
// file: auth.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as auth_pb from "./auth_pb";

interface IAuthService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getRole: IAuthService_IGetRole;
}

interface IAuthService_IGetRole extends grpc.MethodDefinition<auth_pb.GetRoleRequest, auth_pb.Role> {
    path: "/fonos.auth.v1alpha1.Auth/GetRole";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<auth_pb.GetRoleRequest>;
    requestDeserialize: grpc.deserialize<auth_pb.GetRoleRequest>;
    responseSerialize: grpc.serialize<auth_pb.Role>;
    responseDeserialize: grpc.deserialize<auth_pb.Role>;
}

export const AuthService: IAuthService;

export interface IAuthServer {
    getRole: grpc.handleUnaryCall<auth_pb.GetRoleRequest, auth_pb.Role>;
}

export interface IAuthClient {
    getRole(request: auth_pb.GetRoleRequest, callback: (error: grpc.ServiceError | null, response: auth_pb.Role) => void): grpc.ClientUnaryCall;
    getRole(request: auth_pb.GetRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: auth_pb.Role) => void): grpc.ClientUnaryCall;
    getRole(request: auth_pb.GetRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: auth_pb.Role) => void): grpc.ClientUnaryCall;
}

export class AuthClient extends grpc.Client implements IAuthClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public getRole(request: auth_pb.GetRoleRequest, callback: (error: grpc.ServiceError | null, response: auth_pb.Role) => void): grpc.ClientUnaryCall;
    public getRole(request: auth_pb.GetRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: auth_pb.Role) => void): grpc.ClientUnaryCall;
    public getRole(request: auth_pb.GetRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: auth_pb.Role) => void): grpc.ClientUnaryCall;
}
