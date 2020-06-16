import grpc from 'grpc'
import updateProvider from './update_provider'
import {
  Provider,
  ListProvidersRequest,
  ListProvidersResponse,
  GetProviderRequest,
  CreateProviderRequest,
  UpdateProviderRequest,
  DeleteProviderRequest
} from '../protos/providers_pb'
import { Empty } from '../protos/common_pb'
import {
  IProvidersService,
  ProvidersService,
  IProvidersServer
} from '../protos/providers_grpc_pb'
import deleteResource from '../resources/delete_resource'
import { Kind, REncoder } from '../../common/resource_encoder'
import { FonosAuthError } from '@fonos/errors'
import { auth } from '../../common/trust_util'
import getResource from '../resources/get_resource'
import listResources from '../resources/list_resources'
import updateResource from '../resources/update_resource'
import createResource from '../resources/create_resource'
import providerDecoder from '../../common/decoders/provider_decoder'

class ProvidersServer implements IProvidersServer {
  async listProviders (
    call: grpc.ServerUnaryCall<ListProvidersRequest>,
    callback: grpc.sendUnaryData<ListProvidersResponse>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    const r: any = await listResources(
      parseInt(call.request.getPageToken()),
      call.request.getPageSize(),
      providerDecoder
    )
    callback(null, r)
  }

  async createProvider (
    call: grpc.ServerUnaryCall<CreateProviderRequest>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    const provider = call.request.getProvider()
    const resource = new REncoder(
      Kind.GATEWAY,
      provider.getName(),
      provider.getRef()
    )
      .withCredentials(provider.getUsername(), provider.getSecret())
      .withHost(provider.getHost())
      .withTransport(provider.getTransport())
      .withExpires(provider.getExpires())
      .build()

    callback(null, await createResource(provider, providerDecoder))
  }

  async updateProvider (
    call: grpc.ServerUnaryCall<UpdateProviderRequest>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    const provider = call.request.getProvider()
    const resource = new REncoder(
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
      .build()

    callback(null, await updateResource(resource, providerDecoder))
  }

  async getProvider (
    call: grpc.ServerUnaryCall<GetProviderRequest>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    callback(
      null,
      await getResource(call.request.getRef(), Kind.DOMAIN, providerDecoder)
    )
  }

  async deleteProvider (
    call: grpc.ServerUnaryCall<DeleteProviderRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    callback(null, await deleteResource(call.request.getRef(), Kind.DOMAIN))
  }
}

export { ProvidersServer as default, IProvidersService, ProvidersService }
