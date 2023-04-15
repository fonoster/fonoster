// package: fonoster.projects.v1beta1
// file: projects.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as projects_pb from "./projects_pb";
import * as protoc_gen_openapiv2_options_annotations_pb from "./protoc-gen-openapiv2/options/annotations_pb";
import * as google_api_field_behavior_pb from "./google/api/field_behavior_pb";
import * as common_pb from "./common_pb";

interface IProjectsService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    listProjects: IProjectsService_IListProjects;
    createProject: IProjectsService_ICreateProject;
    updateProject: IProjectsService_IUpdateProject;
    getProject: IProjectsService_IGetProject;
    deleteProject: IProjectsService_IDeleteProject;
    renewAccessKeySecret: IProjectsService_IRenewAccessKeySecret;
}

interface IProjectsService_IListProjects extends grpc.MethodDefinition<projects_pb.ListProjectsRequest, projects_pb.ListProjectsResponse> {
    path: "/fonoster.projects.v1beta1.Projects/ListProjects";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<projects_pb.ListProjectsRequest>;
    requestDeserialize: grpc.deserialize<projects_pb.ListProjectsRequest>;
    responseSerialize: grpc.serialize<projects_pb.ListProjectsResponse>;
    responseDeserialize: grpc.deserialize<projects_pb.ListProjectsResponse>;
}
interface IProjectsService_ICreateProject extends grpc.MethodDefinition<projects_pb.CreateProjectRequest, projects_pb.Project> {
    path: "/fonoster.projects.v1beta1.Projects/CreateProject";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<projects_pb.CreateProjectRequest>;
    requestDeserialize: grpc.deserialize<projects_pb.CreateProjectRequest>;
    responseSerialize: grpc.serialize<projects_pb.Project>;
    responseDeserialize: grpc.deserialize<projects_pb.Project>;
}
interface IProjectsService_IUpdateProject extends grpc.MethodDefinition<projects_pb.UpdateProjectRequest, projects_pb.Project> {
    path: "/fonoster.projects.v1beta1.Projects/UpdateProject";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<projects_pb.UpdateProjectRequest>;
    requestDeserialize: grpc.deserialize<projects_pb.UpdateProjectRequest>;
    responseSerialize: grpc.serialize<projects_pb.Project>;
    responseDeserialize: grpc.deserialize<projects_pb.Project>;
}
interface IProjectsService_IGetProject extends grpc.MethodDefinition<projects_pb.GetProjectRequest, projects_pb.Project> {
    path: "/fonoster.projects.v1beta1.Projects/GetProject";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<projects_pb.GetProjectRequest>;
    requestDeserialize: grpc.deserialize<projects_pb.GetProjectRequest>;
    responseSerialize: grpc.serialize<projects_pb.Project>;
    responseDeserialize: grpc.deserialize<projects_pb.Project>;
}
interface IProjectsService_IDeleteProject extends grpc.MethodDefinition<projects_pb.DeleteProjectRequest, common_pb.Empty> {
    path: "/fonoster.projects.v1beta1.Projects/DeleteProject";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<projects_pb.DeleteProjectRequest>;
    requestDeserialize: grpc.deserialize<projects_pb.DeleteProjectRequest>;
    responseSerialize: grpc.serialize<common_pb.Empty>;
    responseDeserialize: grpc.deserialize<common_pb.Empty>;
}
interface IProjectsService_IRenewAccessKeySecret extends grpc.MethodDefinition<projects_pb.RenewAccessKeySecretRequest, projects_pb.RenewAccessKeySecretResponse> {
    path: "/fonoster.projects.v1beta1.Projects/RenewAccessKeySecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<projects_pb.RenewAccessKeySecretRequest>;
    requestDeserialize: grpc.deserialize<projects_pb.RenewAccessKeySecretRequest>;
    responseSerialize: grpc.serialize<projects_pb.RenewAccessKeySecretResponse>;
    responseDeserialize: grpc.deserialize<projects_pb.RenewAccessKeySecretResponse>;
}

export const ProjectsService: IProjectsService;

export interface IProjectsServer extends grpc.UntypedServiceImplementation {
    listProjects: grpc.handleUnaryCall<projects_pb.ListProjectsRequest, projects_pb.ListProjectsResponse>;
    createProject: grpc.handleUnaryCall<projects_pb.CreateProjectRequest, projects_pb.Project>;
    updateProject: grpc.handleUnaryCall<projects_pb.UpdateProjectRequest, projects_pb.Project>;
    getProject: grpc.handleUnaryCall<projects_pb.GetProjectRequest, projects_pb.Project>;
    deleteProject: grpc.handleUnaryCall<projects_pb.DeleteProjectRequest, common_pb.Empty>;
    renewAccessKeySecret: grpc.handleUnaryCall<projects_pb.RenewAccessKeySecretRequest, projects_pb.RenewAccessKeySecretResponse>;
}

export interface IProjectsClient {
    listProjects(request: projects_pb.ListProjectsRequest, callback: (error: grpc.ServiceError | null, response: projects_pb.ListProjectsResponse) => void): grpc.ClientUnaryCall;
    listProjects(request: projects_pb.ListProjectsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: projects_pb.ListProjectsResponse) => void): grpc.ClientUnaryCall;
    listProjects(request: projects_pb.ListProjectsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: projects_pb.ListProjectsResponse) => void): grpc.ClientUnaryCall;
    createProject(request: projects_pb.CreateProjectRequest, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    createProject(request: projects_pb.CreateProjectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    createProject(request: projects_pb.CreateProjectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    updateProject(request: projects_pb.UpdateProjectRequest, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    updateProject(request: projects_pb.UpdateProjectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    updateProject(request: projects_pb.UpdateProjectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    getProject(request: projects_pb.GetProjectRequest, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    getProject(request: projects_pb.GetProjectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    getProject(request: projects_pb.GetProjectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    deleteProject(request: projects_pb.DeleteProjectRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteProject(request: projects_pb.DeleteProjectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    deleteProject(request: projects_pb.DeleteProjectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    renewAccessKeySecret(request: projects_pb.RenewAccessKeySecretRequest, callback: (error: grpc.ServiceError | null, response: projects_pb.RenewAccessKeySecretResponse) => void): grpc.ClientUnaryCall;
    renewAccessKeySecret(request: projects_pb.RenewAccessKeySecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: projects_pb.RenewAccessKeySecretResponse) => void): grpc.ClientUnaryCall;
    renewAccessKeySecret(request: projects_pb.RenewAccessKeySecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: projects_pb.RenewAccessKeySecretResponse) => void): grpc.ClientUnaryCall;
}

export class ProjectsClient extends grpc.Client implements IProjectsClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public listProjects(request: projects_pb.ListProjectsRequest, callback: (error: grpc.ServiceError | null, response: projects_pb.ListProjectsResponse) => void): grpc.ClientUnaryCall;
    public listProjects(request: projects_pb.ListProjectsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: projects_pb.ListProjectsResponse) => void): grpc.ClientUnaryCall;
    public listProjects(request: projects_pb.ListProjectsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: projects_pb.ListProjectsResponse) => void): grpc.ClientUnaryCall;
    public createProject(request: projects_pb.CreateProjectRequest, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    public createProject(request: projects_pb.CreateProjectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    public createProject(request: projects_pb.CreateProjectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    public updateProject(request: projects_pb.UpdateProjectRequest, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    public updateProject(request: projects_pb.UpdateProjectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    public updateProject(request: projects_pb.UpdateProjectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    public getProject(request: projects_pb.GetProjectRequest, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    public getProject(request: projects_pb.GetProjectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    public getProject(request: projects_pb.GetProjectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: projects_pb.Project) => void): grpc.ClientUnaryCall;
    public deleteProject(request: projects_pb.DeleteProjectRequest, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteProject(request: projects_pb.DeleteProjectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public deleteProject(request: projects_pb.DeleteProjectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: common_pb.Empty) => void): grpc.ClientUnaryCall;
    public renewAccessKeySecret(request: projects_pb.RenewAccessKeySecretRequest, callback: (error: grpc.ServiceError | null, response: projects_pb.RenewAccessKeySecretResponse) => void): grpc.ClientUnaryCall;
    public renewAccessKeySecret(request: projects_pb.RenewAccessKeySecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: projects_pb.RenewAccessKeySecretResponse) => void): grpc.ClientUnaryCall;
    public renewAccessKeySecret(request: projects_pb.RenewAccessKeySecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: projects_pb.RenewAccessKeySecretResponse) => void): grpc.ClientUnaryCall;
}
