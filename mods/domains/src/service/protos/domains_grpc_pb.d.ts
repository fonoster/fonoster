// package: fonoster.domains.v1beta1
// file: domains.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as domains_pb from "./domains_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";
import * as common_pb from "./common_pb";

interface IDomainsService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    listDomains: IDomainsService_IListDomains;
    createDomain: IDomainsService_ICreateDomain;
    getDomain: IDomainsService_IGetDomain;
    updateDomain: IDomainsService_IUpdateDomain;
    deleteDomain: IDomainsService_IDeleteDomain;
}

interface IDomainsService_IListDomains extends grpc.MethodDefinition<domains_pb.ListDomainsRequest, domains_pb.ListDomainsResponse> {
    path: "/fonoster.domains.v1beta1.Domains/ListDomains";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<domains_pb.ListDomainsRequest>;
    requestDeserialize: grpc.deserialize<domains_pb.ListDomainsRequest>;
    responseSerialize: grpc.serialize<domains_pb.ListDomainsResponse>;
    responseDeserialize: grpc.deserialize<domains_pb.ListDomainsResponse>;
}
interface IDomainsService_ICreateDomain extends grpc.MethodDefinition<domains_pb.CreateDomainRequest, domains_pb.Domain> {
    path: "/fonoster.domains.v1beta1.Domains/CreateDomain";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<domains_pb.CreateDomainRequest>;
    requestDeserialize: grpc.deserialize<domains_pb.CreateDomainRequest>;
    responseSerialize: grpc.serialize<domains_pb.Domain>;
    responseDeserialize: grpc.deserialize<domains_pb.Domain>;
}
interface IDomainsService_IGetDomain extends grpc.MethodDefinition<domains_pb.GetDomainRequest, domains_pb.Domain> {
    path: "/fonoster.domains.v1beta1.Domains/GetDomain";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<domains_pb.GetDomainRequest>;
    requestDeserialize: grpc.deserialize<domains_pb.GetDomainRequest>;
    responseSerialize: grpc.serialize<domains_pb.Domain>;
    responseDeserialize: grpc.deserialize<domains_pb.Domain>;
}
interface IDomainsService_IUpdateDomain extends grpc.MethodDefinition<domains_pb.UpdateDomainRequest, domains_pb.Domain> {
    path: "/fonoster.domains.v1beta1.Domains/UpdateDomain";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<domains_pb.UpdateDomainRequest>;
    requestDeserialize: grpc.deserialize<domains_pb.UpdateDomainRequest>;
    responseSerialize: grpc.serialize<domains_pb.Domain>;
    responseDeserialize: grpc.deserialize<domains_pb.Domain>;
}
interface IDomainsService_IDeleteDomain extends grpc.MethodDefinition<domains_pb.DeleteDomainRequest, common_pb.Empty> {
    path: "/fonoster.domains.v1beta1.Domains/DeleteDomain";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<domains_pb.DeleteDomainRequest>;
    requestDeserialize: grpc.deserialize<domains_pb.DeleteDomainRequest>;
    responseSerialize: grpc.serialize<common_pb.Empty>;
    responseDeserialize: grpc.deserialize<common_pb.Empty>;
}

export const DomainsService: IDomainsService;

export interface IDomainsServer extends grpc.UntypedServiceImplementation {
    listDomains: grpc.handleUnaryCall<domains_pb.ListDomainsRequest, domains_pb.ListDomainsResponse>;
    createDomain: grpc.handleUnaryCall<domains_pb.CreateDomainRequest, domains_pb.Domain>;
    getDomain: grpc.handleUnaryCall<domains_pb.GetDomainRequest, domains_pb.Domain>;
    updateDomain: grpc.handleUnaryCall<domains_pb.UpdateDomainRequest, domains_pb.Domain>;
    deleteDomain: grpc.handleUnaryCall<domains_pb.DeleteDomainRequest, common_pb.Empty>;
}

export interface IDomainsClient {
    listDomains(request: domains_pb.ListDomainsRequest, callback: (error: grpc.ServiceError | null, response: domains_pb.ListDomainsResponse) => void): grpc.ClientUnaryCall;
    listDomains(request: domains_pb.ListDomainsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: domains_pb.ListDomainsResponse) => void): grpc.ClientUnaryCall;
    listDomains(request: domains_pb.ListDomainsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: domains_pb.ListDomainsResponse) => void): grpc.ClientUnaryCall;
    createDomain(request: domains_pb.CreateDomainRequest, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    createDomain(request: domains_pb.CreateDomainRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    createDomain(request: domains_pb.CreateDomainRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    getDomain(request: domains_pb.GetDomainRequest, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    getDomain(request: domains_pb.GetDomainRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    getDomain(request: domains_pb.GetDomainRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    updateDomain(request: domains_pb.UpdateDomainRequest, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    updateDomain(request: domains_pb.UpdateDomainRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    updateDomain(request: domains_pb.UpdateDomainRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    deleteDomain(request: domains_pb.DeleteDomainRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteDomain(request: domains_pb.DeleteDomainRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteDomain(request: domains_pb.DeleteDomainRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class DomainsClient extends grpc.Client implements IDomainsClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public listDomains(request: domains_pb.ListDomainsRequest, callback: (error: grpc.ServiceError | null, response: domains_pb.ListDomainsResponse) => void): grpc.ClientUnaryCall;
    public listDomains(request: domains_pb.ListDomainsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: domains_pb.ListDomainsResponse) => void): grpc.ClientUnaryCall;
    public listDomains(request: domains_pb.ListDomainsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: domains_pb.ListDomainsResponse) => void): grpc.ClientUnaryCall;
    public createDomain(request: domains_pb.CreateDomainRequest, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    public createDomain(request: domains_pb.CreateDomainRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    public createDomain(request: domains_pb.CreateDomainRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    public getDomain(request: domains_pb.GetDomainRequest, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    public getDomain(request: domains_pb.GetDomainRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    public getDomain(request: domains_pb.GetDomainRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    public updateDomain(request: domains_pb.UpdateDomainRequest, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    public updateDomain(request: domains_pb.UpdateDomainRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    public updateDomain(request: domains_pb.UpdateDomainRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: domains_pb.Domain) => void): grpc.ClientUnaryCall;
    public deleteDomain(request: domains_pb.DeleteDomainRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteDomain(request: domains_pb.DeleteDomainRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteDomain(request: domains_pb.DeleteDomainRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}
