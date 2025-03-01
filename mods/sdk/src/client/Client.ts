/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import {
  ChannelCredentials,
  credentials,
  Interceptor,
  Metadata
} from "@grpc/grpc-js";
import { AclsClient } from "../generated/node/acls_grpc_pb";
import { AgentsClient } from "../generated/node/agents_grpc_pb";
import { ApplicationsClient } from "../generated/node/applications_grpc_pb";
import { CallsClient } from "../generated/node/calls_grpc_pb";
import { CredentialsServiceClient } from "../generated/node/credentials_grpc_pb";
import { DomainsClient } from "../generated/node/domains_grpc_pb";
import { IdentityClient } from "../generated/node/identity_grpc_pb";
import { NumbersClient } from "../generated/node/numbers_grpc_pb";
import { SecretsClient } from "../generated/node/secrets_grpc_pb";
import { TrunksClient } from "../generated/node/trunks_grpc_pb";
import { AbstractClient } from "./AbstractClient";
import { TokenRefresherNode } from "./TokenRefresherNode";

const DEFAULT_ENDPOINT = "api.fonoster.com";

export class Client extends AbstractClient {
  private readonly endpoint: string;
  private readonly tokenRefresherInterceptor: Interceptor;
  private readonly channelCredentials: ChannelCredentials;

  constructor(
    config: {
      endpoint?: string;
      accessKeyId: string;
      allowInsecure?: boolean;
      withoutInterceptors?: boolean;
    } = {
      endpoint: DEFAULT_ENDPOINT,
      accessKeyId: "",
      allowInsecure: false,
      withoutInterceptors: false
    }
  ) {
    const channelCredentials = config.allowInsecure
      ? credentials.createInsecure()
      : credentials.createSsl();

    super({
      accessKeyId: config.accessKeyId,
      identityClient: new IdentityClient(
        config.endpoint ?? DEFAULT_ENDPOINT,
        channelCredentials
      )
    });

    this.channelCredentials = channelCredentials;
    this.endpoint = config?.endpoint ?? DEFAULT_ENDPOINT;

    this.tokenRefresherInterceptor = config.withoutInterceptors
      ? null
      : new TokenRefresherNode(this).createInterceptor().bind(this);
  }

  getMetadata(): Metadata {
    const metadata = new Metadata();
    metadata.set("token", this.getAccessToken());
    metadata.set("accessKeyId", this.getAccessKeyId());
    return metadata;
  }

  getApplicationsClient() {
    return new ApplicationsClient(this.endpoint, this.channelCredentials, {
      interceptors: [this.tokenRefresherInterceptor]
    });
  }

  getCallsClient() {
    return new CallsClient(this.endpoint, this.channelCredentials, {
      interceptors: [this.tokenRefresherInterceptor]
    });
  }

  getIdentityClient() {
    return new IdentityClient(this.endpoint, this.channelCredentials);
  }

  getSecretsClient() {
    return new SecretsClient(this.endpoint, this.channelCredentials, {
      interceptors: [this.tokenRefresherInterceptor]
    });
  }

  getAgentsClient() {
    return new AgentsClient(this.endpoint, this.channelCredentials, {
      interceptors: [this.tokenRefresherInterceptor]
    });
  }

  getAclsClient() {
    return new AclsClient(this.endpoint, this.channelCredentials, {
      interceptors: [this.tokenRefresherInterceptor]
    });
  }

  getDomainsClient() {
    return new DomainsClient(this.endpoint, this.channelCredentials, {
      interceptors: [this.tokenRefresherInterceptor]
    });
  }

  getTrunksClient() {
    return new TrunksClient(this.endpoint, this.channelCredentials, {
      interceptors: [this.tokenRefresherInterceptor]
    });
  }

  getNumbersClient() {
    return new NumbersClient(this.endpoint, this.channelCredentials, {
      interceptors: [this.tokenRefresherInterceptor]
    });
  }

  getCredentialsClient() {
    return new CredentialsServiceClient(
      this.endpoint,
      this.channelCredentials,
      {
        interceptors: [this.tokenRefresherInterceptor]
      }
    );
  }
}
