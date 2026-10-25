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
import { BillingClient } from "../generated/node/billing_grpc_pb";
import { CallsClient } from "../generated/node/calls_grpc_pb";
import { CapabilitiesClient } from "../generated/node/capabilities_grpc_pb";
import { CredentialsServiceClient } from "../generated/node/credentials_grpc_pb";
import { DomainsClient } from "../generated/node/domains_grpc_pb";
import { IdentityClient } from "../generated/node/identity_grpc_pb";
import { NumbersClient } from "../generated/node/numbers_grpc_pb";
import { ProvidersClient } from "../generated/node/providers_grpc_pb";
import { SecretsClient } from "../generated/node/secrets_grpc_pb";
import { TrunksClient } from "../generated/node/trunks_grpc_pb";
import { UsageClient } from "../generated/node/usage_grpc_pb";
import { WebhooksClient } from "../generated/node/webhooks_grpc_pb";
import { AbstractClient } from "./AbstractClient";
import {
  CaFetch,
  createCaFetch,
  readCaFile,
  resolveCaFile,
  trustedRoots
} from "./caTrust";
import { TokenRefresherNode } from "./TokenRefresherNode";

const DEFAULT_ENDPOINT = "api.fonoster.ai";

export class Client extends AbstractClient {
  private readonly endpoint: string;
  private readonly httpUrl?: string;
  private readonly interceptors: Interceptor[];
  private readonly channelCredentials: ChannelCredentials;
  private readonly caFetch?: CaFetch;

  constructor(
    config: {
      endpoint?: string;
      accessKeyId: string;
      /**
       * A PEM file of certificate authorities to trust besides the system's, such as an
       * install's generated `config/tls/ca.pem`. Default: the FONOSTER_CA_FILE environment
       * variable. Host names are still verified.
       */
      caFile?: string;
      /**
       * Connects without TLS. Only for plain connections inside a private network (service to
       * service, in-process tests); never needed to reach an install over HTTPS: use `caFile`.
       */
      allowInsecure?: boolean;
      withoutInterceptors?: boolean;
      /** The HTTP API (call records); default https://<endpoint host>. */
      httpUrl?: string;
    } = {
      endpoint: DEFAULT_ENDPOINT,
      accessKeyId: "",
      allowInsecure: false,
      withoutInterceptors: false
    }
  ) {
    const caFile = config.allowInsecure
      ? undefined
      : resolveCaFile(config.caFile);
    // Read before any connection, so a missing file fails here, naming the path.
    const ca = caFile ? readCaFile(caFile) : undefined;
    const channelCredentials = config.allowInsecure
      ? credentials.createInsecure()
      : credentials.createSsl(
          ca ? Buffer.from(trustedRoots(ca).join("\n")) : undefined
        );

    super({
      accessKeyId: config.accessKeyId,
      identityClient: new IdentityClient(
        config.endpoint ?? DEFAULT_ENDPOINT,
        channelCredentials
      )
    });

    this.channelCredentials = channelCredentials;
    this.caFetch = ca ? createCaFetch(ca) : undefined;
    this.endpoint = config?.endpoint ?? DEFAULT_ENDPOINT;
    this.httpUrl = config?.httpUrl;

    this.interceptors = config.withoutInterceptors
      ? []
      : [new TokenRefresherNode(this).createInterceptor().bind(this)];
  }

  getMetadata(): Metadata {
    const metadata = new Metadata();
    metadata.set("token", this.getAccessToken());
    metadata.set("accessKeyId", this.getAccessKeyId());
    return metadata;
  }

  getApplicationsClient() {
    return new ApplicationsClient(this.endpoint, this.channelCredentials, {
      interceptors: this.interceptors
    });
  }

  getCallsClient() {
    return new CallsClient(this.endpoint, this.channelCredentials, {
      interceptors: this.interceptors
    });
  }

  getIdentityClient() {
    return new IdentityClient(this.endpoint, this.channelCredentials);
  }

  getCapabilitiesClient() {
    return new CapabilitiesClient(this.endpoint, this.channelCredentials);
  }

  getSecretsClient() {
    return new SecretsClient(this.endpoint, this.channelCredentials, {
      interceptors: this.interceptors
    });
  }

  getAgentsClient() {
    return new AgentsClient(this.endpoint, this.channelCredentials, {
      interceptors: this.interceptors
    });
  }

  getAclsClient() {
    return new AclsClient(this.endpoint, this.channelCredentials, {
      interceptors: this.interceptors
    });
  }

  getDomainsClient() {
    return new DomainsClient(this.endpoint, this.channelCredentials, {
      interceptors: this.interceptors
    });
  }

  getTrunksClient() {
    return new TrunksClient(this.endpoint, this.channelCredentials, {
      interceptors: this.interceptors
    });
  }

  getNumbersClient() {
    return new NumbersClient(this.endpoint, this.channelCredentials, {
      interceptors: this.interceptors
    });
  }

  getWebhooksClient() {
    return new WebhooksClient(this.endpoint, this.channelCredentials, {
      interceptors: this.interceptors
    });
  }

  getProvidersClient() {
    return new ProvidersClient(this.endpoint, this.channelCredentials, {
      interceptors: this.interceptors
    });
  }

  getUsageClient() {
    return new UsageClient(this.endpoint, this.channelCredentials, {
      interceptors: this.interceptors
    });
  }

  getBillingClient() {
    return new BillingClient(this.endpoint, this.channelCredentials, {
      interceptors: this.interceptors
    });
  }

  /** The fetch for the HTTP API when a CA file is trusted; otherwise the global fetch is used. */
  getFetch(): CaFetch | undefined {
    return this.caFetch;
  }

  getHttpUrl() {
    return (
      this.httpUrl ?? `https://${this.endpoint.replace(/:\d+$/, "")}`
    ).replace(/\/+$/, "");
  }

  getCredentialsClient() {
    return new CredentialsServiceClient(
      this.endpoint,
      this.channelCredentials,
      {
        interceptors: this.interceptors
      }
    );
  }
}
