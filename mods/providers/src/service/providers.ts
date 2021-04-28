/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
import grpc from "grpc";
import {
  Provider,
  ListProvidersRequest,
  ListProvidersResponse,
  GetProviderRequest,
  CreateProviderRequest,
  UpdateProviderRequest,
  DeleteProviderRequest
} from "./protos/providers_pb";
import {Empty} from "./protos/common_pb";
import {
  IProvidersService,
  ProvidersService,
  IProvidersServer
} from "./protos/providers_grpc_pb";
import {Kind, ResourceBuilder} from "@fonos/core/src/common/resource_builder";
import providerDecoder from "./decoder";
import {
  updateResource,
  createResource,
  ResourceServer,
  getAccessKeyId
} from "@fonos/core";

class ProvidersServer extends ResourceServer implements IProvidersServer {
  async listProviders(
    call: grpc.ServerUnaryCall<ListProvidersRequest>,
    callback: grpc.sendUnaryData<ListProvidersResponse>
  ) {
    super.listResources(Kind.GATEWAY, call);
  }

  async createProvider(
    call: grpc.ServerUnaryCall<CreateProviderRequest>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    const provider = call.request.getProvider();

    try {
      const resource = new ResourceBuilder(
        Kind.GATEWAY,
        provider.getName(),
        provider.getRef()
      )
        .withCredentials(provider.getUsername(), provider.getSecret())
        .withHost(provider.getHost())
        .withTransport(provider.getTransport())
        .withExpires(provider.getExpires())
        .withMetadata({accessKeyId: getAccessKeyId(call)})
        .build();

      callback(null, await createResource(resource));
    } catch (e) {
      callback(e, null);
    }
  }

  async updateProvider(
    call: grpc.ServerUnaryCall<UpdateProviderRequest>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    const provider = call.request.getProvider();

    try {
      const resource = new ResourceBuilder(
        Kind.GATEWAY,
        provider.getName(),
        provider.getRef()
      )
        .withMetadata({
          createdOn: provider.getCreateTime(),
          modifiedOn: provider.getUpdateTime()
        })
        .withCredentials(provider.getUsername(), provider.getSecret())
        .withHost(provider.getHost())
        .withTransport(provider.getTransport())
        .withExpires(provider.getExpires())
        .build();

      callback(
        null,
        null
        // await updateResource(getAccessKeyId(call), resource, providerDecoder)
      );
    } catch (e) {
      callback(e, null);
    }
  }

  async getProvider(
    call: grpc.ServerUnaryCall<GetProviderRequest>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    super.getResource(Kind.GATEWAY, call);
  }

  async deleteProvider(
    call: grpc.ServerUnaryCall<DeleteProviderRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    super.deleteResource(Kind.GATEWAY, call);
  }
}

export {ProvidersServer as default, IProvidersService, ProvidersService};
