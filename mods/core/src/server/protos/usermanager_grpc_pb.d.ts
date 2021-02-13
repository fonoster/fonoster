// package: fonos.usermanager.v1alpha1
// file: usermanager.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as usermanager_pb from "./usermanager_pb";
import * as common_pb from "./common_pb";

interface IUserManagerService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    listUsers: IUserManagerService_IListUsers;
    getUser: IUserManagerService_IGetUser;
    createUser: IUserManagerService_ICreateUser;
    updateUser: IUserManagerService_IUpdateUser;
    deleteUser: IUserManagerService_IDeleteUser;
}

interface IUserManagerService_IListUsers extends grpc.MethodDefinition<usermanager_pb.ListUsersRequest, usermanager_pb.ListUsersResponse> {
    path: "/fonos.usermanager.v1alpha1.UserManager/ListUsers";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<usermanager_pb.ListUsersRequest>;
    requestDeserialize: grpc.deserialize<usermanager_pb.ListUsersRequest>;
    responseSerialize: grpc.serialize<usermanager_pb.ListUsersResponse>;
    responseDeserialize: grpc.deserialize<usermanager_pb.ListUsersResponse>;
}
interface IUserManagerService_IGetUser extends grpc.MethodDefinition<usermanager_pb.GetUserRequest, usermanager_pb.User> {
    path: "/fonos.usermanager.v1alpha1.UserManager/GetUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<usermanager_pb.GetUserRequest>;
    requestDeserialize: grpc.deserialize<usermanager_pb.GetUserRequest>;
    responseSerialize: grpc.serialize<usermanager_pb.User>;
    responseDeserialize: grpc.deserialize<usermanager_pb.User>;
}
interface IUserManagerService_ICreateUser extends grpc.MethodDefinition<usermanager_pb.CreateUserRequest, usermanager_pb.User> {
    path: "/fonos.usermanager.v1alpha1.UserManager/CreateUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<usermanager_pb.CreateUserRequest>;
    requestDeserialize: grpc.deserialize<usermanager_pb.CreateUserRequest>;
    responseSerialize: grpc.serialize<usermanager_pb.User>;
    responseDeserialize: grpc.deserialize<usermanager_pb.User>;
}
interface IUserManagerService_IUpdateUser extends grpc.MethodDefinition<usermanager_pb.UpdateUserRequest, usermanager_pb.User> {
    path: "/fonos.usermanager.v1alpha1.UserManager/UpdateUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<usermanager_pb.UpdateUserRequest>;
    requestDeserialize: grpc.deserialize<usermanager_pb.UpdateUserRequest>;
    responseSerialize: grpc.serialize<usermanager_pb.User>;
    responseDeserialize: grpc.deserialize<usermanager_pb.User>;
}
interface IUserManagerService_IDeleteUser extends grpc.MethodDefinition<usermanager_pb.DeleteUserRequest, common_pb.Empty> {
    path: "/fonos.usermanager.v1alpha1.UserManager/DeleteUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<usermanager_pb.DeleteUserRequest>;
    requestDeserialize: grpc.deserialize<usermanager_pb.DeleteUserRequest>;
    responseSerialize: grpc.serialize<common_pb.Empty>;
    responseDeserialize: grpc.deserialize<common_pb.Empty>;
}

export const UserManagerService: IUserManagerService;

export interface IUserManagerServer {
    listUsers: grpc.handleUnaryCall<usermanager_pb.ListUsersRequest, usermanager_pb.ListUsersResponse>;
    getUser: grpc.handleUnaryCall<usermanager_pb.GetUserRequest, usermanager_pb.User>;
    createUser: grpc.handleUnaryCall<usermanager_pb.CreateUserRequest, usermanager_pb.User>;
    updateUser: grpc.handleUnaryCall<usermanager_pb.UpdateUserRequest, usermanager_pb.User>;
    deleteUser: grpc.handleUnaryCall<usermanager_pb.DeleteUserRequest, common_pb.Empty>;
}

export interface IUserManagerClient {
    listUsers(request: usermanager_pb.ListUsersRequest, callback: (error: grpc.ServiceError | null, response: usermanager_pb.ListUsersResponse) => void): grpc.ClientUnaryCall;
    listUsers(request: usermanager_pb.ListUsersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: usermanager_pb.ListUsersResponse) => void): grpc.ClientUnaryCall;
    listUsers(request: usermanager_pb.ListUsersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: usermanager_pb.ListUsersResponse) => void): grpc.ClientUnaryCall;
    getUser(request: usermanager_pb.GetUserRequest, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    getUser(request: usermanager_pb.GetUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    getUser(request: usermanager_pb.GetUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    createUser(request: usermanager_pb.CreateUserRequest, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    createUser(request: usermanager_pb.CreateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    createUser(request: usermanager_pb.CreateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    updateUser(request: usermanager_pb.UpdateUserRequest, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    updateUser(request: usermanager_pb.UpdateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    updateUser(request: usermanager_pb.UpdateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    deleteUser(request: usermanager_pb.DeleteUserRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteUser(request: usermanager_pb.DeleteUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteUser(request: usermanager_pb.DeleteUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class UserManagerClient extends grpc.Client implements IUserManagerClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public listUsers(request: usermanager_pb.ListUsersRequest, callback: (error: grpc.ServiceError | null, response: usermanager_pb.ListUsersResponse) => void): grpc.ClientUnaryCall;
    public listUsers(request: usermanager_pb.ListUsersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: usermanager_pb.ListUsersResponse) => void): grpc.ClientUnaryCall;
    public listUsers(request: usermanager_pb.ListUsersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: usermanager_pb.ListUsersResponse) => void): grpc.ClientUnaryCall;
    public getUser(request: usermanager_pb.GetUserRequest, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    public getUser(request: usermanager_pb.GetUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    public getUser(request: usermanager_pb.GetUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    public createUser(request: usermanager_pb.CreateUserRequest, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    public createUser(request: usermanager_pb.CreateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    public createUser(request: usermanager_pb.CreateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    public updateUser(request: usermanager_pb.UpdateUserRequest, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    public updateUser(request: usermanager_pb.UpdateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    public updateUser(request: usermanager_pb.UpdateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: usermanager_pb.User) => void): grpc.ClientUnaryCall;
    public deleteUser(request: usermanager_pb.DeleteUserRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteUser(request: usermanager_pb.DeleteUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteUser(request: usermanager_pb.DeleteUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}
