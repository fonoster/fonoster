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
import {
  updateResource,
  createResource,
  ResourceServer,
  getAccessKeyId
} from "@fonos/core";
import decoder from "./decoder";

class ProvidersServer extends ResourceServer implements IProvidersServer {
  async listProviders(
    call: grpc.ServerUnaryCall<ListProvidersRequest>,
    callback: grpc.sendUnaryData<ListProvidersResponse>
  ) {
    const result = await super.listResources(Kind.GATEWAY, call);
    const response = new ListProvidersResponse();
    if (result.resources) {
      const providers = result.resources.map((resource) => decoder(resource));
      response.setNextPageToken(result.nextPageToken + "");
      response.setProvidersList(providers);
    }
    callback(null, response);
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

      const result = await createResource(resource);
      callback(null, decoder(result));
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

      const result = await updateResource({
        resource,
        accessKeyId: getAccessKeyId(call)
      });

      callback(null, decoder(result));
    } catch (e) {
      callback(e, null);
    }
  }

  async getProvider(
    call: grpc.ServerUnaryCall<GetProviderRequest>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    try {
      const result = await super.getResource(Kind.GATEWAY, call);
      callback(null, decoder(result));
    } catch (e) {
      callback(e, null);
    }
  }

  async deleteProvider(
    call: grpc.ServerUnaryCall<DeleteProviderRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      await super.deleteResource(Kind.GATEWAY, call);
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }
}

export {ProvidersServer as default, IProvidersService, ProvidersService};
