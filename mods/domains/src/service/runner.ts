#!/usr/bin/env node
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
import { Tracer as T } from "@fonoster/common";
T.init("domains-service");

import DomainsServer from "./domains";
import { DomainsService } from "./protos/domains_grpc_pb";
import { AuthMiddleware, limiterMiddleware } from "@fonoster/auth";
import { getSalt } from "@fonoster/certs";
import { runServices } from "@fonoster/common";

const services = [
  {
    name: "domains",
    version: "v1beta1",
    service: DomainsService,
    server: new DomainsServer()
  }
];

const middlewares = [
  {
    name: "authenticator",
    middlewareObj: new AuthMiddleware(getSalt()).middleware
  },
  {
    name: "limiter",
    middlewareObj: limiterMiddleware
  }
];

runServices(services, middlewares);
