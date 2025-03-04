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
import { AclsClient } from "../generated/web/AclsServiceClientPb";
import { AgentsClient } from "../generated/web/AgentsServiceClientPb";
import { ApplicationsClient } from "../generated/web/ApplicationsServiceClientPb";
import { CallsClient } from "../generated/web/CallsServiceClientPb";
import { CredentialsServiceClient } from "../generated/web/CredentialsServiceClientPb";
import { DomainsClient } from "../generated/web/DomainsServiceClientPb";
import { IdentityClient } from "../generated/web/IdentityServiceClientPb";
import { NumbersClient } from "../generated/web/NumbersServiceClientPb";
import { SecretsClient } from "../generated/web/SecretsServiceClientPb";
import { TrunksClient } from "../generated/web/TrunksServiceClientPb";
import { AbstractClient } from "./AbstractClient";
import { TokenRefresherWeb } from "./TokenRefresherWeb";

const DEFAULT_URL = "https://api.fonoster.com";

export class WebClient extends AbstractClient {
  private url: string;

  constructor(
    config: { url?: string; accessKeyId: string } = {
      url: DEFAULT_URL,
      accessKeyId: ""
    }
  ) {
    const { url, accessKeyId } = config;

    super({
      accessKeyId,
      identityClient: new IdentityClient(url ?? DEFAULT_URL, null, null)
    });

    this.url = url ?? DEFAULT_URL;
  }

  getMetadata() {
    return {
      token: this.getAccessToken(),
      accessKeyId: this.getAccessKeyId()
    };
  }

  getApplicationsClient() {
    return new ApplicationsClient(this.url, null, {
      streamInterceptors: [new TokenRefresherWeb(this)]
    });
  }

  getCallsClient() {
    return new CallsClient(this.url, null, {
      streamInterceptors: [new TokenRefresherWeb(this)]
    });
  }

  getIdentityClient() {
    return new IdentityClient(this.url, null, null);
  }

  getSecretsClient() {
    return new SecretsClient(this.url, null, {
      streamInterceptors: [new TokenRefresherWeb(this)]
    });
  }

  getAgentsClient() {
    return new AgentsClient(this.url, null, {
      streamInterceptors: [new TokenRefresherWeb(this)]
    });
  }

  getAclsClient() {
    return new AclsClient(this.url, null, {
      streamInterceptors: [new TokenRefresherWeb(this)]
    });
  }

  getDomainsClient() {
    return new DomainsClient(this.url, null, {
      streamInterceptors: [new TokenRefresherWeb(this)]
    });
  }

  getTrunksClient() {
    return new TrunksClient(this.url, null, {
      streamInterceptors: [new TokenRefresherWeb(this)]
    });
  }

  getNumbersClient() {
    return new NumbersClient(this.url, null, {
      streamInterceptors: [new TokenRefresherWeb(this)]
    });
  }

  getCredentialsClient() {
    return new CredentialsServiceClient(this.url, null, {
      streamInterceptors: [new TokenRefresherWeb(this)]
    });
  }
}
