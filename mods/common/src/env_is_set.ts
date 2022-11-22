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
import logger from "@fonoster/logger";

export default function assertEnvIsSet(name: string) {
  const register = require(process.env.SERVICES_ENVS ||
    "/home/fonoster/service_envs.json");
  const services = register.filter((service: any) => service.module === name);
  for (const value of services) {
    value.env.forEach(function (variable: string) {
      if (!(variable in process.env)) {
        logger.error(
          `The environment variable ${variable} is required but was not found`
        );
        process.exit(1);
      }
    });
  }
}
