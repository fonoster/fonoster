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
  createServiceDefinition,
  ServiceDefinitionParams
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type FonosterService = {
  definition: ServiceDefinitionParams;
  handlers: grpc.UntypedServiceImplementation;
};

async function loadServices(server: grpc.Server, services: FonosterService[]) {
  services.forEach((service) => {
    const serviceDefinition = createServiceDefinition(service.definition);
    const { serviceName, pckg, version } = service.definition;
    server.addService(serviceDefinition, service.handlers);

    logger.info("loaded service", { serviceName, pckg, version });
  });
}

export default loadServices;
