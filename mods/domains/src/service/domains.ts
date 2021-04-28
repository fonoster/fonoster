/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
import grpc from "grpc";
import {
  Domain,
  ListDomainsRequest,
  ListDomainsResponse,
  GetDomainRequest,
  CreateDomainRequest,
  UpdateDomainRequest,
  DeleteDomainRequest
} from "./protos/domains_pb";
import {Empty} from "./protos/common_pb";
import {
  IDomainsService,
  DomainsService,
  IDomainsServer
} from "./protos/domains_grpc_pb";
import {
  createResource,
  ResourceServer,
  getAccessKeyId,
  Kind,
  ResourceBuilder
} from "@fonos/core";
import unmarshalDomain from "./decoder";

class DomainsServer extends ResourceServer implements IDomainsServer {
  async listDomains(
    call: grpc.ServerUnaryCall<ListDomainsRequest>,
    callback: grpc.sendUnaryData<ListDomainsResponse>
  ) {
    // const response = super.listResources(Kind.DOMAIN, call);
    // const 
    // callback(null, await unmarshalDomain(response))
  }

  async createDomain(
    call: grpc.ServerUnaryCall<CreateDomainRequest>,
    callback: grpc.sendUnaryData<Domain>
  ) {
    const domain = call.request.getDomain();
    try {
      const resource = new ResourceBuilder(
        Kind.DOMAIN,
        domain.getName(),
        domain.getRef()
      )
        .withDomainUri(domain.getDomainUri())
        .withEgressPolicy(domain.getEgressRule(), domain.getEgressNumberRef())
        .withACL(domain.getAccessAllowList(), domain.getAccessDenyList())
        .withMetadata({accessKeyId: getAccessKeyId(call)})
        .build();

      const response = await createResource(resource);
      callback(null, unmarshalDomain(response));
    } catch (e) {
      callback(e, null);
    }
  }

  async updateDomain(
    call: grpc.ServerUnaryCall<UpdateDomainRequest>,
    callback: grpc.sendUnaryData<Domain>
  ) {
    const domain = call.request.getDomain();

    try {
      const resource = new ResourceBuilder(
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
        .build();
      /* callback(
         null,
         //await updateResource(getAccessKeyId(call), resource, unmarshalDomain)
      );*/
    } catch (e) {
      callback(e, null);
    }
  }

  async getDomain(
    call: grpc.ServerUnaryCall<GetDomainRequest>,
    callback: grpc.sendUnaryData<Domain>
  ) {
    super.getResource(Kind.DOMAIN, call);
  }

  async deleteDomain(
    call: grpc.ServerUnaryCall<DeleteDomainRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    super.deleteResource(Kind.DOMAIN, call);
  }
}

export {DomainsServer as default, IDomainsService, DomainsService};
