/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
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
  Provider,
  ListProvidersRequest,
  ListProvidersResponse,
  GetProviderRequest,
  CreateProviderRequest,
  UpdateProviderRequest,
  DeleteProviderRequest
} from "./protos/providers_pb";
import { Empty } from "./protos/common_pb";
import {
  IProvidersService,
  ProvidersService,
  IProvidersServer
} from "./protos/providers_grpc_pb";
import { Kind, ResourceBuilder } from "@fonoster/core";
import {
  updateResource,
  createResource,
  ResourceServer,
  getAccessKeyId
} from "@fonoster/core";
import decoder from "./decoder";
import { assertIsValidHost } from "./assertions";

class ProvidersServer implements IProvidersServer {
  [name: string]: grpc.UntypedHandleCall;
  async listProviders(
    call: grpc.ServerUnaryCall<ListProvidersRequest, ListProvidersResponse>,
    callback: grpc.sendUnaryData<ListProvidersResponse>
  ) {
    const result = await ResourceServer.listResources(Kind.GATEWAY, call);
    const response = new ListProvidersResponse();
    if (result && result.resources) {
      const providers = result.resources.map((resource) => decoder(resource));
      response.setNextPageToken(result.nextPageToken + "");
      response.setProvidersList(providers);
    }
    callback(null, response);
  }

  async createProvider(
    call: grpc.ServerUnaryCall<CreateProviderRequest, Provider>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    try {
      // The host must be hostname:{port}
      assertIsValidHost(call.request.getHost());
      const resource = new ResourceBuilder(Kind.GATEWAY, call.request.getName())
        .withCredentials(call.request.getUsername(), call.request.getSecret())
        .withHost(call.request.getHost())
        .withTransport(call.request.getTransport())
        .withExpires(call.request.getExpires())
        .withMetadata({ accessKeyId: getAccessKeyId(call) })
        .build();

      const result = await createResource(resource);
      callback(null, decoder(result));
    } catch (e) {
      callback(e, null);
    }
  }

  async updateProvider(
    call: grpc.ServerUnaryCall<UpdateProviderRequest, Provider>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    try {
      assertIsValidHost(call.request.getHost());
      const provider = (await ResourceServer.getResource(
        Kind.GATEWAY,
        call
      )) as any;

      const resource = new ResourceBuilder(
        Kind.GATEWAY,
        call.request.getName(),
        provider.metadata.ref
      )
        .withMetadata({
          createdOn: provider.metadata.createdOn
        })
        .withCredentials(call.request.getUsername(), call.request.getSecret())
        .withHost(call.request.getHost())
        .withTransport(call.request.getTransport())
        .withExpires(call.request.getExpires())
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
    call: grpc.ServerUnaryCall<GetProviderRequest, Provider>,
    callback: grpc.sendUnaryData<Provider>
  ) {
    try {
      const result = await ResourceServer.getResource(Kind.GATEWAY, call);
      callback(null, decoder(result));
    } catch (e) {
      callback(e, null);
    }
  }

  async deleteProvider(
    call: grpc.ServerUnaryCall<DeleteProviderRequest, Empty>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      await ResourceServer.deleteResource(Kind.GATEWAY, call);
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }
}

export { ProvidersServer as default, IProvidersService, ProvidersService };
