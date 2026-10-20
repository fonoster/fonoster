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
import { buildIdentityService } from "@fonoster/identity";
import {
  buildAclsService,
  buildAgentsService,
  buildCredentialsService,
  buildDomainsService,
  buildNumbersService,
  buildTrunksService,
  createNumberRouting
} from "@fonoster/sipnet";
import { buildApplicationsService } from "../applications";
import { buildCallsService } from "../calls";
import { buildCapabilitiesService } from "../capabilities";
import { getConfig } from "../config";
import { DOMAIN_NAMES_ROOT, ROUTR_ROOMR_PEER, TRUNK_NAMES_ROOT } from "../envs";
import { buildProvidersService } from "../providers";
import { buildSecretsService } from "../secrets";
import { buildService as buildUsageService } from "../usage/buildService";
import { UsageSql } from "../usage/types";
import { createCheckNumberPreconditions } from "../utils";
import { buildWebhooksService } from "../webhooks";
import { prisma } from "./db";
import { identityConfig } from "./identityConfig";
import { workspaceRegionHooks } from "./regionHooks";
import { routrConfig } from "./routrConfig";
import { testTokenConfig } from "./testTokenConfig";

const applicationsService = buildApplicationsService(prisma, testTokenConfig);
const secretsService = buildSecretsService(prisma);
const callsService = buildCallsService();
const identityService = buildIdentityService({
  ...identityConfig,
  regions: workspaceRegionHooks
});
const agentsService = buildAgentsService(routrConfig);
const domainsService = buildDomainsService(routrConfig, {
  namesRoot: DOMAIN_NAMES_ROOT
});
const credentialsService = buildCredentialsService(routrConfig);
const trunksService = buildTrunksService(routrConfig, {
  namesRoot: TRUNK_NAMES_ROOT
});
// App-linked numbers point at the roomr peer (Asterisk is retired, cleanbreak CB-B3).
const numberRouting = createNumberRouting({
  roomrNodeAor: ROUTR_ROOMR_PEER.aor
});
const numbersService = buildNumbersService(
  routrConfig,
  createCheckNumberPreconditions(prisma),
  numberRouting
);
const aclsService = buildAclsService(routrConfig);
const capabilitiesService = buildCapabilitiesService(getConfig());
const webhooksService = buildWebhooksService(prisma);
const providersService = buildProvidersService(prisma);
const usageService = buildUsageService(prisma as unknown as UsageSql);

const services = Promise.all([
  applicationsService,
  secretsService,
  callsService,
  identityService,
  agentsService,
  credentialsService,
  aclsService,
  numbersService,
  trunksService,
  domainsService,
  capabilitiesService,
  webhooksService,
  providersService,
  usageService
]);

export default services;
