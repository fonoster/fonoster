/**
 * @fileoverview gRPC-Web generated client stub for fonoster.agents.v1beta2
 * @enhanceable
 * @public
 */

// Code generated by protoc-gen-grpc-web. DO NOT EDIT.
// versions:
// 	protoc-gen-grpc-web v1.5.0
// 	protoc              v5.29.3
// source: agents.proto


/* eslint-disable */
// @ts-nocheck


import * as grpcWeb from 'grpc-web';

import * as agents_pb from './agents_pb'; // proto import: "agents.proto"


export class AgentsClient {
  client_: grpcWeb.AbstractClientBase;
  hostname_: string;
  credentials_: null | { [index: string]: string; };
  options_: null | { [index: string]: any; };

  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; }) {
    if (!options) options = {};
    if (!credentials) credentials = {};
    options['format'] = 'text';

    this.client_ = new grpcWeb.GrpcWebClientBase(options);
    this.hostname_ = hostname.replace(/\/+$/, '');
    this.credentials_ = credentials;
    this.options_ = options;
  }

  methodDescriptorCreateAgent = new grpcWeb.MethodDescriptor(
    '/fonoster.agents.v1beta2.Agents/CreateAgent',
    grpcWeb.MethodType.UNARY,
    agents_pb.CreateAgentRequest,
    agents_pb.CreateAgentResponse,
    (request: agents_pb.CreateAgentRequest) => {
      return request.serializeBinary();
    },
    agents_pb.CreateAgentResponse.deserializeBinary
  );

  createAgent(
    request: agents_pb.CreateAgentRequest,
    metadata?: grpcWeb.Metadata | null): Promise<agents_pb.CreateAgentResponse>;

  createAgent(
    request: agents_pb.CreateAgentRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: agents_pb.CreateAgentResponse) => void): grpcWeb.ClientReadableStream<agents_pb.CreateAgentResponse>;

  createAgent(
    request: agents_pb.CreateAgentRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: agents_pb.CreateAgentResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/fonoster.agents.v1beta2.Agents/CreateAgent',
        request,
        metadata || {},
        this.methodDescriptorCreateAgent,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/fonoster.agents.v1beta2.Agents/CreateAgent',
    request,
    metadata || {},
    this.methodDescriptorCreateAgent);
  }

  methodDescriptorUpdateAgent = new grpcWeb.MethodDescriptor(
    '/fonoster.agents.v1beta2.Agents/UpdateAgent',
    grpcWeb.MethodType.UNARY,
    agents_pb.UpdateAgentRequest,
    agents_pb.UpdateAgentResponse,
    (request: agents_pb.UpdateAgentRequest) => {
      return request.serializeBinary();
    },
    agents_pb.UpdateAgentResponse.deserializeBinary
  );

  updateAgent(
    request: agents_pb.UpdateAgentRequest,
    metadata?: grpcWeb.Metadata | null): Promise<agents_pb.UpdateAgentResponse>;

  updateAgent(
    request: agents_pb.UpdateAgentRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: agents_pb.UpdateAgentResponse) => void): grpcWeb.ClientReadableStream<agents_pb.UpdateAgentResponse>;

  updateAgent(
    request: agents_pb.UpdateAgentRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: agents_pb.UpdateAgentResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/fonoster.agents.v1beta2.Agents/UpdateAgent',
        request,
        metadata || {},
        this.methodDescriptorUpdateAgent,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/fonoster.agents.v1beta2.Agents/UpdateAgent',
    request,
    metadata || {},
    this.methodDescriptorUpdateAgent);
  }

  methodDescriptorGetAgent = new grpcWeb.MethodDescriptor(
    '/fonoster.agents.v1beta2.Agents/GetAgent',
    grpcWeb.MethodType.UNARY,
    agents_pb.GetAgentRequest,
    agents_pb.Agent,
    (request: agents_pb.GetAgentRequest) => {
      return request.serializeBinary();
    },
    agents_pb.Agent.deserializeBinary
  );

  getAgent(
    request: agents_pb.GetAgentRequest,
    metadata?: grpcWeb.Metadata | null): Promise<agents_pb.Agent>;

  getAgent(
    request: agents_pb.GetAgentRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: agents_pb.Agent) => void): grpcWeb.ClientReadableStream<agents_pb.Agent>;

  getAgent(
    request: agents_pb.GetAgentRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: agents_pb.Agent) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/fonoster.agents.v1beta2.Agents/GetAgent',
        request,
        metadata || {},
        this.methodDescriptorGetAgent,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/fonoster.agents.v1beta2.Agents/GetAgent',
    request,
    metadata || {},
    this.methodDescriptorGetAgent);
  }

  methodDescriptorDeleteAgent = new grpcWeb.MethodDescriptor(
    '/fonoster.agents.v1beta2.Agents/DeleteAgent',
    grpcWeb.MethodType.UNARY,
    agents_pb.DeleteAgentRequest,
    agents_pb.DeleteAgentResponse,
    (request: agents_pb.DeleteAgentRequest) => {
      return request.serializeBinary();
    },
    agents_pb.DeleteAgentResponse.deserializeBinary
  );

  deleteAgent(
    request: agents_pb.DeleteAgentRequest,
    metadata?: grpcWeb.Metadata | null): Promise<agents_pb.DeleteAgentResponse>;

  deleteAgent(
    request: agents_pb.DeleteAgentRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: agents_pb.DeleteAgentResponse) => void): grpcWeb.ClientReadableStream<agents_pb.DeleteAgentResponse>;

  deleteAgent(
    request: agents_pb.DeleteAgentRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: agents_pb.DeleteAgentResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/fonoster.agents.v1beta2.Agents/DeleteAgent',
        request,
        metadata || {},
        this.methodDescriptorDeleteAgent,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/fonoster.agents.v1beta2.Agents/DeleteAgent',
    request,
    metadata || {},
    this.methodDescriptorDeleteAgent);
  }

  methodDescriptorListAgents = new grpcWeb.MethodDescriptor(
    '/fonoster.agents.v1beta2.Agents/ListAgents',
    grpcWeb.MethodType.UNARY,
    agents_pb.ListAgentsRequest,
    agents_pb.ListAgentsResponse,
    (request: agents_pb.ListAgentsRequest) => {
      return request.serializeBinary();
    },
    agents_pb.ListAgentsResponse.deserializeBinary
  );

  listAgents(
    request: agents_pb.ListAgentsRequest,
    metadata?: grpcWeb.Metadata | null): Promise<agents_pb.ListAgentsResponse>;

  listAgents(
    request: agents_pb.ListAgentsRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: agents_pb.ListAgentsResponse) => void): grpcWeb.ClientReadableStream<agents_pb.ListAgentsResponse>;

  listAgents(
    request: agents_pb.ListAgentsRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: agents_pb.ListAgentsResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/fonoster.agents.v1beta2.Agents/ListAgents',
        request,
        metadata || {},
        this.methodDescriptorListAgents,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/fonoster.agents.v1beta2.Agents/ListAgents',
    request,
    metadata || {},
    this.methodDescriptorListAgents);
  }

}

