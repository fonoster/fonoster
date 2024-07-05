/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { ChannelCredentials, Metadata, credentials } from "@grpc/grpc-js";
import { AbstractClient } from "./AbstractClient";
import { DomainsClient } from "../generated/node/domains_grpc_pb";
import { IdentityClient } from "../generated/node/identity_grpc_pb";

const DEFAULT_ENDPOINT = "api.fonoster.io:50051";

export class Client extends AbstractClient {
  private endpoint: string;
  channelCredentials: ChannelCredentials;

  constructor(config: {
    endpoint?: string;
    accessKeyId: string;
    allowInsecure?: boolean;
  }) {
    const channelCredentials = config.allowInsecure
      ? credentials.createInsecure()
      : credentials.createSsl();

    super({
      accessKeyId: config.accessKeyId,
      identityClient: new IdentityClient(config.endpoint, channelCredentials)
    });

    this.channelCredentials = channelCredentials;
    this.endpoint = config?.endpoint || DEFAULT_ENDPOINT;
  }

  getMetadata(): Metadata {
    const metadata = new Metadata();
    metadata.set("token", this.getAccessToken());
    metadata.set("accessKeyId", this.getAccessKeyId());
    return metadata;
  }

  getDomainsClient() {
    return new DomainsClient(this.endpoint, this.channelCredentials);
  }

  getIdentityClient() {
    return new IdentityClient(this.endpoint, this.channelCredentials);
  }
}
