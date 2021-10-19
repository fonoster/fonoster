// package: fonos.users.v1beta1
// file: users.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import {handleClientStreamingCall} from "@grpc/grpc-js/build/src/server-call";
import * as users_pb from "./users_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";
import * as common_pb from "./common_pb";

interface IUsersService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createUser: IUsersService_ICreateUser;
    getUser: IUsersService_IGetUser;
    updateUser: IUsersService_IUpdateUser;
    deleteUser: IUsersService_IDeleteUser;
    login: IUsersService_ILogin;
}

interface IUsersService_ICreateUser extends grpc.MethodDefinition<users_pb.CreateUserRequest, users_pb.User> {
    path: "/fonos.users.v1beta1.Users/CreateUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<users_pb.CreateUserRequest>;
    requestDeserialize: grpc.deserialize<users_pb.CreateUserRequest>;
    responseSerialize: grpc.serialize<users_pb.User>;
    responseDeserialize: grpc.deserialize<users_pb.User>;
}
interface IUsersService_IGetUser extends grpc.MethodDefinition<users_pb.GetUserRequest, users_pb.User> {
    path: "/fonos.users.v1beta1.Users/GetUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<users_pb.GetUserRequest>;
    requestDeserialize: grpc.deserialize<users_pb.GetUserRequest>;
    responseSerialize: grpc.serialize<users_pb.User>;
    responseDeserialize: grpc.deserialize<users_pb.User>;
}
interface IUsersService_IUpdateUser extends grpc.MethodDefinition<users_pb.UpdateUserRequest, users_pb.User> {
    path: "/fonos.users.v1beta1.Users/UpdateUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<users_pb.UpdateUserRequest>;
    requestDeserialize: grpc.deserialize<users_pb.UpdateUserRequest>;
    responseSerialize: grpc.serialize<users_pb.User>;
    responseDeserialize: grpc.deserialize<users_pb.User>;
}
interface IUsersService_IDeleteUser extends grpc.MethodDefinition<users_pb.DeleteUserRequest, common_pb.Empty> {
    path: "/fonos.users.v1beta1.Users/DeleteUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<users_pb.DeleteUserRequest>;
    requestDeserialize: grpc.deserialize<users_pb.DeleteUserRequest>;
    responseSerialize: grpc.serialize<common_pb.Empty>;
    responseDeserialize: grpc.deserialize<common_pb.Empty>;
}
interface IUsersService_ILogin extends grpc.MethodDefinition<users_pb.LoginRequest, users_pb.LoginResponse> {
    path: "/fonos.users.v1beta1.Users/Login";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<users_pb.LoginRequest>;
    requestDeserialize: grpc.deserialize<users_pb.LoginRequest>;
    responseSerialize: grpc.serialize<users_pb.LoginResponse>;
    responseDeserialize: grpc.deserialize<users_pb.LoginResponse>;
}

export const UsersService: IUsersService;

export interface IUsersServer extends grpc.UntypedServiceImplementation {
    createUser: grpc.handleUnaryCall<users_pb.CreateUserRequest, users_pb.User>;
    getUser: grpc.handleUnaryCall<users_pb.GetUserRequest, users_pb.User>;
    updateUser: grpc.handleUnaryCall<users_pb.UpdateUserRequest, users_pb.User>;
    deleteUser: grpc.handleUnaryCall<users_pb.DeleteUserRequest, common_pb.Empty>;
    login: grpc.handleUnaryCall<users_pb.LoginRequest, users_pb.LoginResponse>;
}

export interface IUsersClient {
    createUser(request: users_pb.CreateUserRequest, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    createUser(request: users_pb.CreateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    createUser(request: users_pb.CreateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    getUser(request: users_pb.GetUserRequest, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    getUser(request: users_pb.GetUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    getUser(request: users_pb.GetUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    updateUser(request: users_pb.UpdateUserRequest, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    updateUser(request: users_pb.UpdateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    updateUser(request: users_pb.UpdateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    deleteUser(request: users_pb.DeleteUserRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteUser(request: users_pb.DeleteUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteUser(request: users_pb.DeleteUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    login(request: users_pb.LoginRequest, callback: (error: grpc.ServiceError | null, response: users_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    login(request: users_pb.LoginRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: users_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    login(request: users_pb.LoginRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: users_pb.LoginResponse) => void): grpc.ClientUnaryCall;
}

export class UsersClient extends grpc.Client implements IUsersClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createUser(request: users_pb.CreateUserRequest, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    public createUser(request: users_pb.CreateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    public createUser(request: users_pb.CreateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    public getUser(request: users_pb.GetUserRequest, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    public getUser(request: users_pb.GetUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    public getUser(request: users_pb.GetUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    public updateUser(request: users_pb.UpdateUserRequest, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    public updateUser(request: users_pb.UpdateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    public updateUser(request: users_pb.UpdateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: users_pb.User) => void): grpc.ClientUnaryCall;
    public deleteUser(request: users_pb.DeleteUserRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteUser(request: users_pb.DeleteUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteUser(request: users_pb.DeleteUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public login(request: users_pb.LoginRequest, callback: (error: grpc.ServiceError | null, response: users_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    public login(request: users_pb.LoginRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: users_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    public login(request: users_pb.LoginRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: users_pb.LoginResponse) => void): grpc.ClientUnaryCall;
}
