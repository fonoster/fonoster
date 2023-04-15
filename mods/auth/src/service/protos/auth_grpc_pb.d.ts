// package: fonoster.auth.v1beta1
// file: auth.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as auth_pb from "./auth_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";

interface IAuthService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getRole: IAuthService_IGetRole;
    validateToken: IAuthService_IValidateToken;
    createToken: IAuthService_ICreateToken;
    createNoAccessToken: IAuthService_ICreateNoAccessToken;
}

interface IAuthService_IGetRole extends grpc.MethodDefinition<auth_pb.GetRoleRequest, auth_pb.Role> {
    path: "/fonoster.auth.v1beta1.Auth/GetRole";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<auth_pb.GetRoleRequest>;
    requestDeserialize: grpc.deserialize<auth_pb.GetRoleRequest>;
    responseSerialize: grpc.serialize<auth_pb.Role>;
    responseDeserialize: grpc.deserialize<auth_pb.Role>;
}
interface IAuthService_IValidateToken extends grpc.MethodDefinition<auth_pb.ValidateTokenRequest, auth_pb.ValidateTokenResponse> {
    path: "/fonoster.auth.v1beta1.Auth/ValidateToken";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<auth_pb.ValidateTokenRequest>;
    requestDeserialize: grpc.deserialize<auth_pb.ValidateTokenRequest>;
    responseSerialize: grpc.serialize<auth_pb.ValidateTokenResponse>;
    responseDeserialize: grpc.deserialize<auth_pb.ValidateTokenResponse>;
}
interface IAuthService_ICreateToken extends grpc.MethodDefinition<auth_pb.CreateTokenRequest, auth_pb.CreateTokenResponse> {
    path: "/fonoster.auth.v1beta1.Auth/CreateToken";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<auth_pb.CreateTokenRequest>;
    requestDeserialize: grpc.deserialize<auth_pb.CreateTokenRequest>;
    responseSerialize: grpc.serialize<auth_pb.CreateTokenResponse>;
    responseDeserialize: grpc.deserialize<auth_pb.CreateTokenResponse>;
}
interface IAuthService_ICreateNoAccessToken extends grpc.MethodDefinition<auth_pb.CreateTokenRequest, auth_pb.CreateTokenResponse> {
    path: "/fonoster.auth.v1beta1.Auth/CreateNoAccessToken";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<auth_pb.CreateTokenRequest>;
    requestDeserialize: grpc.deserialize<auth_pb.CreateTokenRequest>;
    responseSerialize: grpc.serialize<auth_pb.CreateTokenResponse>;
    responseDeserialize: grpc.deserialize<auth_pb.CreateTokenResponse>;
}

export const AuthService: IAuthService;

export interface IAuthServer extends grpc.UntypedServiceImplementation {
    getRole: grpc.handleUnaryCall<auth_pb.GetRoleRequest, auth_pb.Role>;
    validateToken: grpc.handleUnaryCall<auth_pb.ValidateTokenRequest, auth_pb.ValidateTokenResponse>;
    createToken: grpc.handleUnaryCall<auth_pb.CreateTokenRequest, auth_pb.CreateTokenResponse>;
    createNoAccessToken: grpc.handleUnaryCall<auth_pb.CreateTokenRequest, auth_pb.CreateTokenResponse>;
}

export interface IAuthClient {
    getRole(request: auth_pb.GetRoleRequest, callback: (error: grpc.ServiceError | null, response: auth_pb.Role) => void): grpc.ClientUnaryCall;
    getRole(request: auth_pb.GetRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: auth_pb.Role) => void): grpc.ClientUnaryCall;
    getRole(request: auth_pb.GetRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: auth_pb.Role) => void): grpc.ClientUnaryCall;
    validateToken(request: auth_pb.ValidateTokenRequest, callback: (error: grpc.ServiceError | null, response: auth_pb.ValidateTokenResponse) => void): grpc.ClientUnaryCall;
    validateToken(request: auth_pb.ValidateTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: auth_pb.ValidateTokenResponse) => void): grpc.ClientUnaryCall;
    validateToken(request: auth_pb.ValidateTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: auth_pb.ValidateTokenResponse) => void): grpc.ClientUnaryCall;
    createToken(request: auth_pb.CreateTokenRequest, callback: (error: grpc.ServiceError | null, response: auth_pb.CreateTokenResponse) => void): grpc.ClientUnaryCall;
    createToken(request: auth_pb.CreateTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: auth_pb.CreateTokenResponse) => void): grpc.ClientUnaryCall;
    createToken(request: auth_pb.CreateTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: auth_pb.CreateTokenResponse) => void): grpc.ClientUnaryCall;
    createNoAccessToken(request: auth_pb.CreateTokenRequest, callback: (error: grpc.ServiceError | null, response: auth_pb.CreateTokenResponse) => void): grpc.ClientUnaryCall;
    createNoAccessToken(request: auth_pb.CreateTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: auth_pb.CreateTokenResponse) => void): grpc.ClientUnaryCall;
    createNoAccessToken(request: auth_pb.CreateTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: auth_pb.CreateTokenResponse) => void): grpc.ClientUnaryCall;
}

export class AuthClient extends grpc.Client implements IAuthClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getRole(request: auth_pb.GetRoleRequest, callback: (error: grpc.ServiceError | null, response: auth_pb.Role) => void): grpc.ClientUnaryCall;
    public getRole(request: auth_pb.GetRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: auth_pb.Role) => void): grpc.ClientUnaryCall;
    public getRole(request: auth_pb.GetRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: auth_pb.Role) => void): grpc.ClientUnaryCall;
    public validateToken(request: auth_pb.ValidateTokenRequest, callback: (error: grpc.ServiceError | null, response: auth_pb.ValidateTokenResponse) => void): grpc.ClientUnaryCall;
    public validateToken(request: auth_pb.ValidateTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: auth_pb.ValidateTokenResponse) => void): grpc.ClientUnaryCall;
    public validateToken(request: auth_pb.ValidateTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: auth_pb.ValidateTokenResponse) => void): grpc.ClientUnaryCall;
    public createToken(request: auth_pb.CreateTokenRequest, callback: (error: grpc.ServiceError | null, response: auth_pb.CreateTokenResponse) => void): grpc.ClientUnaryCall;
    public createToken(request: auth_pb.CreateTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: auth_pb.CreateTokenResponse) => void): grpc.ClientUnaryCall;
    public createToken(request: auth_pb.CreateTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: auth_pb.CreateTokenResponse) => void): grpc.ClientUnaryCall;
    public createNoAccessToken(request: auth_pb.CreateTokenRequest, callback: (error: grpc.ServiceError | null, response: auth_pb.CreateTokenResponse) => void): grpc.ClientUnaryCall;
    public createNoAccessToken(request: auth_pb.CreateTokenRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: auth_pb.CreateTokenResponse) => void): grpc.ClientUnaryCall;
    public createNoAccessToken(request: auth_pb.CreateTokenRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: auth_pb.CreateTokenResponse) => void): grpc.ClientUnaryCall;
}

interface ILimiterService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    checkAuthorized: ILimiterService_ICheckAuthorized;
}

interface ILimiterService_ICheckAuthorized extends grpc.MethodDefinition<auth_pb.CheckAuthorizedRequest, auth_pb.CheckAuthorizedResponse> {
    path: "/fonoster.auth.v1beta1.Limiter/CheckAuthorized";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<auth_pb.CheckAuthorizedRequest>;
    requestDeserialize: grpc.deserialize<auth_pb.CheckAuthorizedRequest>;
    responseSerialize: grpc.serialize<auth_pb.CheckAuthorizedResponse>;
    responseDeserialize: grpc.deserialize<auth_pb.CheckAuthorizedResponse>;
}

export const LimiterService: ILimiterService;

export interface ILimiterServer extends grpc.UntypedServiceImplementation {
    checkAuthorized: grpc.handleUnaryCall<auth_pb.CheckAuthorizedRequest, auth_pb.CheckAuthorizedResponse>;
}

export interface ILimiterClient {
    checkAuthorized(request: auth_pb.CheckAuthorizedRequest, callback: (error: grpc.ServiceError | null, response: auth_pb.CheckAuthorizedResponse) => void): grpc.ClientUnaryCall;
    checkAuthorized(request: auth_pb.CheckAuthorizedRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: auth_pb.CheckAuthorizedResponse) => void): grpc.ClientUnaryCall;
    checkAuthorized(request: auth_pb.CheckAuthorizedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: auth_pb.CheckAuthorizedResponse) => void): grpc.ClientUnaryCall;
}

export class LimiterClient extends grpc.Client implements ILimiterClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public checkAuthorized(request: auth_pb.CheckAuthorizedRequest, callback: (error: grpc.ServiceError | null, response: auth_pb.CheckAuthorizedResponse) => void): grpc.ClientUnaryCall;
    public checkAuthorized(request: auth_pb.CheckAuthorizedRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: auth_pb.CheckAuthorizedResponse) => void): grpc.ClientUnaryCall;
    public checkAuthorized(request: auth_pb.CheckAuthorizedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: auth_pb.CheckAuthorizedResponse) => void): grpc.ClientUnaryCall;
}
