/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
import grpc from "@grpc/grpc-js";
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
  ResourceBuilder,
  updateResource
} from "@fonos/core";
import unmarshalDomain from "./decoder";
import decoder from "./decoder";
import isValidDomain from "is-valid-domain";

class DomainsServer implements IDomainsServer {
  [name: string]: grpc.UntypedHandleCall;
  async listDomains(
    call: grpc.ServerUnaryCall<ListDomainsRequest, ListDomainsResponse>,
    callback: grpc.sendUnaryData<ListDomainsResponse>
  ) {
    const result = await ResourceServer.listResources(Kind.DOMAIN, call);
    const response = new ListDomainsResponse();
    if (result.resources) {
      const domains = result.resources.map((resource) => decoder(resource));
      response.setNextPageToken(result.nextPageToken + "");
      response.setDomainsList(domains);
    }
    callback(null, response);
  }

  async createDomain(
    call: grpc.ServerUnaryCall<CreateDomainRequest, Domain>,
    callback: grpc.sendUnaryData<Domain>
  ) {
    const domain = call.request.getDomain();

    if (isValidDomain(domain.getDomainUri()) == false) {
      callback(new Error("Domain Uri is not a valid domain"), null);
      return;
    }

    if (!domain.getEgressRule) {
      callback(new Error("Egress Rule can't be null"), null);
      return;
    }
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
    call: grpc.ServerUnaryCall<UpdateDomainRequest, Domain>,
    callback: grpc.sendUnaryData<Domain>
  ) {
    const domain = call.request.getDomain();
    if (!domain.getEgressRule) {
      callback(new Error("Egress Rule can't be null"), null);
      return;
    }
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

      const result = await updateResource({
        resource,
        accessKeyId: getAccessKeyId(call)
      });

      callback(null, decoder(result));
    } catch (e) {
      callback(e, null);
    }
  }

  async getDomain(
    call: grpc.ServerUnaryCall<GetDomainRequest, Domain>,
    callback: grpc.sendUnaryData<Domain>
  ) {
    try {
      const result = await ResourceServer.getResource(Kind.DOMAIN, call);
      callback(null, decoder(result));
    } catch (e) {
      callback(e, null);
    }
  }

  async deleteDomain(
    call: grpc.ServerUnaryCall<DeleteDomainRequest, Empty>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      await ResourceServer.deleteResource(Kind.DOMAIN, call);
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }
}

export {DomainsServer as default, IDomainsService, DomainsService};
