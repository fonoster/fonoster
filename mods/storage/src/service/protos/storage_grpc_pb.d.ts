// package: fonoster.storage.v1beta1
// file: storage.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as storage_pb from "./storage_pb";

interface IStorageService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    uploadObject: IStorageService_IUploadObject;
    getObjectURL: IStorageService_IGetObjectURL;
}

interface IStorageService_IUploadObject extends grpc.MethodDefinition<storage_pb.UploadObjectRequest, storage_pb.UploadObjectResponse> {
    path: "/fonoster.storage.v1beta1.Storage/UploadObject";
    requestStream: true;
    responseStream: false;
    requestSerialize: grpc.serialize<storage_pb.UploadObjectRequest>;
    requestDeserialize: grpc.deserialize<storage_pb.UploadObjectRequest>;
    responseSerialize: grpc.serialize<storage_pb.UploadObjectResponse>;
    responseDeserialize: grpc.deserialize<storage_pb.UploadObjectResponse>;
}
interface IStorageService_IGetObjectURL extends grpc.MethodDefinition<storage_pb.GetObjectURLRequest, storage_pb.GetObjectURLResponse> {
    path: "/fonoster.storage.v1beta1.Storage/GetObjectURL";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<storage_pb.GetObjectURLRequest>;
    requestDeserialize: grpc.deserialize<storage_pb.GetObjectURLRequest>;
    responseSerialize: grpc.serialize<storage_pb.GetObjectURLResponse>;
    responseDeserialize: grpc.deserialize<storage_pb.GetObjectURLResponse>;
}

export const StorageService: IStorageService;

export interface IStorageServer extends grpc.UntypedServiceImplementation {
    uploadObject: grpc.handleClientStreamingCall<storage_pb.UploadObjectRequest, storage_pb.UploadObjectResponse>;
    getObjectURL: grpc.handleUnaryCall<storage_pb.GetObjectURLRequest, storage_pb.GetObjectURLResponse>;
}

export interface IStorageClient {
    uploadObject(callback: (error: grpc.ServiceError | null, response: storage_pb.UploadObjectResponse) => void): grpc.ClientWritableStream<storage_pb.UploadObjectRequest>;
    uploadObject(metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: storage_pb.UploadObjectResponse) => void): grpc.ClientWritableStream<storage_pb.UploadObjectRequest>;
    uploadObject(options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: storage_pb.UploadObjectResponse) => void): grpc.ClientWritableStream<storage_pb.UploadObjectRequest>;
    uploadObject(metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: storage_pb.UploadObjectResponse) => void): grpc.ClientWritableStream<storage_pb.UploadObjectRequest>;
    getObjectURL(request: storage_pb.GetObjectURLRequest, callback: (error: grpc.ServiceError | null, response: storage_pb.GetObjectURLResponse) => void): grpc.ClientUnaryCall;
    getObjectURL(request: storage_pb.GetObjectURLRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: storage_pb.GetObjectURLResponse) => void): grpc.ClientUnaryCall;
    getObjectURL(request: storage_pb.GetObjectURLRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: storage_pb.GetObjectURLResponse) => void): grpc.ClientUnaryCall;
}

export class StorageClient extends grpc.Client implements IStorageClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public uploadObject(callback: (error: grpc.ServiceError | null, response: storage_pb.UploadObjectResponse) => void): grpc.ClientWritableStream<storage_pb.UploadObjectRequest>;
    public uploadObject(metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: storage_pb.UploadObjectResponse) => void): grpc.ClientWritableStream<storage_pb.UploadObjectRequest>;
    public uploadObject(options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: storage_pb.UploadObjectResponse) => void): grpc.ClientWritableStream<storage_pb.UploadObjectRequest>;
    public uploadObject(metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: storage_pb.UploadObjectResponse) => void): grpc.ClientWritableStream<storage_pb.UploadObjectRequest>;
    public getObjectURL(request: storage_pb.GetObjectURLRequest, callback: (error: grpc.ServiceError | null, response: storage_pb.GetObjectURLResponse) => void): grpc.ClientUnaryCall;
    public getObjectURL(request: storage_pb.GetObjectURLRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: storage_pb.GetObjectURLResponse) => void): grpc.ClientUnaryCall;
    public getObjectURL(request: storage_pb.GetObjectURLRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: storage_pb.GetObjectURLResponse) => void): grpc.ClientUnaryCall;
}
