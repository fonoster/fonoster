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
import { AclsClient } from "./AclsClient";
import { AgentsClient } from "./AgentsClient";
import { ApplicationsClient } from "./ApplicationsClient";
import { CallsClient } from "./CallsClient";
import { CredentialsClient } from "./CredentialsClient";
import { DomainsClient } from "./DomainsClient";
import { IdentityClient } from "./IdentityClient";
import { NumbersClient } from "./NumbersClient";
import { SecretsClient } from "./SecretsClient";
import { TrunksClient } from "./TrunksClient";

interface FonosterClient {
  getAccessToken(): string;
  getAccessKeyId(): string;
  getApplicationsClient(): ApplicationsClient;
  getCallsClient(): CallsClient;
  getIdentityClient(): IdentityClient;
  getSecretsClient(): SecretsClient;
  getAgentsClient(): AgentsClient;
  getNumbersClient(): NumbersClient;
  getCredentialsClient(): CredentialsClient;
  getDomainsClient(): DomainsClient;
  getTrunksClient(): TrunksClient;
  getAclsClient(): AclsClient;
  getMetadata(): unknown;
  refreshToken(): Promise<void>;
}

export { FonosterClient };
