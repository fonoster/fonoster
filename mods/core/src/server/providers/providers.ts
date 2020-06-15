import grpc from 'grpc'
import listProviders from './list_providers'
import createProvider from './create_provider'
import getProvider from './get_provider'
import deleteProvider from './delete_provider'
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
import { App } from '../protos/appmanager_pb'

class ProvidersServer implements IProvidersServer {
  async listProviders (
    call: grpc.ServerUnaryCall<ListProvidersRequest>,
    callback: grpc.sendUnaryData<ListProvidersResponse>
  ) {
    listProviders(call, callback)
  }

  async createProvider (
    call: grpc.ServerUnaryCall<CreateProviderRequest>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    createProvider(call, callback)
  }

  async updateProvider (
    call: grpc.ServerUnaryCall<UpdateProviderRequest>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    updateProvider(call, callback)
  }

  async getProvider (
    call: grpc.ServerUnaryCall<GetProviderRequest>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    getProvider(call, callback)
  }

  async deleteProvider (
    call: grpc.ServerUnaryCall<DeleteProviderRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    deleteProvider(call, callback)
  }
}

export { ProvidersServer as default, IProvidersService, ProvidersService }
