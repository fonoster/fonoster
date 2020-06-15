import grpc from 'grpc'
import listDomains from './list_domains'
import createDomain from './create_domain'
import getDomain from './get_domain'
import deleteDomain from './delete_domain'
import updateDomain from './update_domain'
import {
  Domain,
  ListDomainsRequest,
  ListDomainsResponse,
  GetDomainRequest,
  CreateDomainRequest,
  UpdateDomainRequest,
  DeleteDomainRequest
} from '../protos/domains_pb'
import { Empty } from '../protos/common_pb'
import {
  IDomainsService,
  DomainsService,
  IDomainsServer
} from '../protos/domains_grpc_pb'

class DomainsServer implements IDomainsServer {
  async listDomains (
    call: grpc.ServerUnaryCall<ListDomainsRequest>,
    callback: grpc.sendUnaryData<ListDomainsResponse>
  ) {
    listDomains(call, callback)
  }

  async createDomain (
    call: grpc.ServerUnaryCall<CreateDomainRequest>,
    callback: grpc.sendUnaryData<Domain>
  ) {
    createDomain(call, callback)
  }

  async updateDomain (
    call: grpc.ServerUnaryCall<UpdateDomainRequest>,
    callback: grpc.sendUnaryData<Domain>
  ) {
    updateDomain(call, callback)
  }

  async getDomain (
    call: grpc.ServerUnaryCall<GetDomainRequest>,
    callback: grpc.sendUnaryData<Domain>
  ) {
    getDomain(call, callback)
  }

  async deleteDomain (
    call: grpc.ServerUnaryCall<DeleteDomainRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    deleteDomain(call, callback)
  }
}

export { DomainsServer as default, IDomainsService, DomainsService }
