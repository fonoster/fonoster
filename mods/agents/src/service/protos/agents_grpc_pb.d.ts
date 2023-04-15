// package: fonoster.agents.v1beta1
// file: agents.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as agents_pb from "./agents_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";
import * as common_pb from "./common_pb";

interface IAgentsService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    listAgents: IAgentsService_IListAgents;
    createAgent: IAgentsService_ICreateAgent;
    getAgent: IAgentsService_IGetAgent;
    updateAgent: IAgentsService_IUpdateAgent;
    deleteAgent: IAgentsService_IDeleteAgent;
}

interface IAgentsService_IListAgents extends grpc.MethodDefinition<agents_pb.ListAgentsRequest, agents_pb.ListAgentsResponse> {
    path: "/fonoster.agents.v1beta1.Agents/ListAgents";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<agents_pb.ListAgentsRequest>;
    requestDeserialize: grpc.deserialize<agents_pb.ListAgentsRequest>;
    responseSerialize: grpc.serialize<agents_pb.ListAgentsResponse>;
    responseDeserialize: grpc.deserialize<agents_pb.ListAgentsResponse>;
}
interface IAgentsService_ICreateAgent extends grpc.MethodDefinition<agents_pb.CreateAgentRequest, agents_pb.Agent> {
    path: "/fonoster.agents.v1beta1.Agents/CreateAgent";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<agents_pb.CreateAgentRequest>;
    requestDeserialize: grpc.deserialize<agents_pb.CreateAgentRequest>;
    responseSerialize: grpc.serialize<agents_pb.Agent>;
    responseDeserialize: grpc.deserialize<agents_pb.Agent>;
}
interface IAgentsService_IGetAgent extends grpc.MethodDefinition<agents_pb.GetAgentRequest, agents_pb.Agent> {
    path: "/fonoster.agents.v1beta1.Agents/GetAgent";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<agents_pb.GetAgentRequest>;
    requestDeserialize: grpc.deserialize<agents_pb.GetAgentRequest>;
    responseSerialize: grpc.serialize<agents_pb.Agent>;
    responseDeserialize: grpc.deserialize<agents_pb.Agent>;
}
interface IAgentsService_IUpdateAgent extends grpc.MethodDefinition<agents_pb.UpdateAgentRequest, agents_pb.Agent> {
    path: "/fonoster.agents.v1beta1.Agents/UpdateAgent";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<agents_pb.UpdateAgentRequest>;
    requestDeserialize: grpc.deserialize<agents_pb.UpdateAgentRequest>;
    responseSerialize: grpc.serialize<agents_pb.Agent>;
    responseDeserialize: grpc.deserialize<agents_pb.Agent>;
}
interface IAgentsService_IDeleteAgent extends grpc.MethodDefinition<agents_pb.DeleteAgentRequest, common_pb.Empty> {
    path: "/fonoster.agents.v1beta1.Agents/DeleteAgent";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<agents_pb.DeleteAgentRequest>;
    requestDeserialize: grpc.deserialize<agents_pb.DeleteAgentRequest>;
    responseSerialize: grpc.serialize<common_pb.Empty>;
    responseDeserialize: grpc.deserialize<common_pb.Empty>;
}

export const AgentsService: IAgentsService;

export interface IAgentsServer extends grpc.UntypedServiceImplementation {
    listAgents: grpc.handleUnaryCall<agents_pb.ListAgentsRequest, agents_pb.ListAgentsResponse>;
    createAgent: grpc.handleUnaryCall<agents_pb.CreateAgentRequest, agents_pb.Agent>;
    getAgent: grpc.handleUnaryCall<agents_pb.GetAgentRequest, agents_pb.Agent>;
    updateAgent: grpc.handleUnaryCall<agents_pb.UpdateAgentRequest, agents_pb.Agent>;
    deleteAgent: grpc.handleUnaryCall<agents_pb.DeleteAgentRequest, common_pb.Empty>;
}

export interface IAgentsClient {
    listAgents(request: agents_pb.ListAgentsRequest, callback: (error: grpc.ServiceError | null, response: agents_pb.ListAgentsResponse) => void): grpc.ClientUnaryCall;
    listAgents(request: agents_pb.ListAgentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: agents_pb.ListAgentsResponse) => void): grpc.ClientUnaryCall;
    listAgents(request: agents_pb.ListAgentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: agents_pb.ListAgentsResponse) => void): grpc.ClientUnaryCall;
    createAgent(request: agents_pb.CreateAgentRequest, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    createAgent(request: agents_pb.CreateAgentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    createAgent(request: agents_pb.CreateAgentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    getAgent(request: agents_pb.GetAgentRequest, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    getAgent(request: agents_pb.GetAgentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    getAgent(request: agents_pb.GetAgentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    updateAgent(request: agents_pb.UpdateAgentRequest, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    updateAgent(request: agents_pb.UpdateAgentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    updateAgent(request: agents_pb.UpdateAgentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    deleteAgent(request: agents_pb.DeleteAgentRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteAgent(request: agents_pb.DeleteAgentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteAgent(request: agents_pb.DeleteAgentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}

export class AgentsClient extends grpc.Client implements IAgentsClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public listAgents(request: agents_pb.ListAgentsRequest, callback: (error: grpc.ServiceError | null, response: agents_pb.ListAgentsResponse) => void): grpc.ClientUnaryCall;
    public listAgents(request: agents_pb.ListAgentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: agents_pb.ListAgentsResponse) => void): grpc.ClientUnaryCall;
    public listAgents(request: agents_pb.ListAgentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: agents_pb.ListAgentsResponse) => void): grpc.ClientUnaryCall;
    public createAgent(request: agents_pb.CreateAgentRequest, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    public createAgent(request: agents_pb.CreateAgentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    public createAgent(request: agents_pb.CreateAgentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    public getAgent(request: agents_pb.GetAgentRequest, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    public getAgent(request: agents_pb.GetAgentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    public getAgent(request: agents_pb.GetAgentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    public updateAgent(request: agents_pb.UpdateAgentRequest, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    public updateAgent(request: agents_pb.UpdateAgentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    public updateAgent(request: agents_pb.UpdateAgentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: agents_pb.Agent) => void): grpc.ClientUnaryCall;
    public deleteAgent(request: agents_pb.DeleteAgentRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteAgent(request: agents_pb.DeleteAgentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteAgent(request: agents_pb.DeleteAgentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
}
