import grpc from "@grpc/grpc-js";
import { Provider, ListProvidersRequest, ListProvidersResponse, GetProviderRequest, CreateProviderRequest, UpdateProviderRequest, DeleteProviderRequest } from "./protos/providers_pb";
import { Empty } from "./protos/common_pb";
import { IProvidersService, ProvidersService, IProvidersServer } from "./protos/providers_grpc_pb";
declare class ProvidersServer implements IProvidersServer {
    [name: string]: grpc.UntypedHandleCall;
    listProviders(call: grpc.ServerUnaryCall<ListProvidersRequest, ListProvidersResponse>, callback: grpc.sendUnaryData<ListProvidersResponse>): Promise<void>;
    createProvider(call: grpc.ServerUnaryCall<CreateProviderRequest, Provider>, callback: grpc.sendUnaryData<Provider>): Promise<void>;
    updateProvider(call: grpc.ServerUnaryCall<UpdateProviderRequest, Provider>, callback: grpc.sendUnaryData<Provider>): Promise<void>;
    getProvider(call: grpc.ServerUnaryCall<GetProviderRequest, Provider>, callback: grpc.sendUnaryData<Provider>): Promise<void>;
    deleteProvider(call: grpc.ServerUnaryCall<DeleteProviderRequest, Empty>, callback: grpc.sendUnaryData<Empty>): Promise<void>;
}
export { ProvidersServer as default, IProvidersService, ProvidersService };
