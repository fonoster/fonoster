import grpc from 'grpc'
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
import deleteResource from '../resources/delete_resource'
import { Kind, REncoder } from '../../common/resource_encoder'
import getResource from '../resources/get_resource'
import listResources from '../resources/list_resources'
import createResource from '../resources/create_resource'
import updateResource from '../resources/update_resource'
import domainDecoder from '../../common/decoders/domain_decoder'
import { FonosAuthError } from '@fonos/errors'
import { auth } from '../../common/trust_util'

class DomainsServer implements IDomainsServer {
  async listDomains (
    call: grpc.ServerUnaryCall<ListDomainsRequest>,
    callback: grpc.sendUnaryData<ListDomainsResponse>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    const r: any = await listResources(
      parseInt(call.request.getPageToken()),
      call.request.getPageSize(),
      domainDecoder
    )
    callback(null, r)
  }

  async createDomain (
    call: grpc.ServerUnaryCall<CreateDomainRequest>,
    callback: grpc.sendUnaryData<Domain>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    const domain = call.request.getDomain()
    const resource = new REncoder(
      Kind.DOMAIN,
      domain.getName(),
      domain.getRef()
    )
      .withDomainUri(domain.getDomainUri())
      .withEgressPolicy(domain.getEgressRule(), domain.getEgressNumberRef())
      .withACL(domain.getAccessAllowList(), domain.getAccessDenyList())
      .build()
    callback(null, await createResource(resource, domainDecoder))
  }

  async updateDomain (
    call: grpc.ServerUnaryCall<UpdateDomainRequest>,
    callback: grpc.sendUnaryData<Domain>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    const domain = call.request.getDomain()
    const resource = new REncoder(
      Kind.DOMAIN,
      domain.getName(),
      domain.getRef()
    )
      .withMetadata({
        createdOn: domain.getCreateTime(),
        modifiedOn: domain.getUpdateTime()
      })
      .withDomainUri(domain.getDomainUri())
      .withEgressPolicy(domain.getEgressRule(), domain.getEgressNumberRef())
      .withACL(domain.getAccessAllowList(), domain.getAccessDenyList())
      .build()
    callback(null, await updateResource(resource, domainDecoder))
  }

  async getDomain (
    call: grpc.ServerUnaryCall<GetDomainRequest>,
    callback: grpc.sendUnaryData<Domain>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    callback(
      null,
      await getResource(call.request.getRef(), Kind.DOMAIN, domainDecoder)
    )
  }

  async deleteDomain (
    call: grpc.ServerUnaryCall<DeleteDomainRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    callback(null, await deleteResource(call.request.getRef(), Kind.DOMAIN))
  }
}

export { DomainsServer as default, IDomainsService, DomainsService }
