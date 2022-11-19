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
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("@fonoster/common").Tracer.init("projects-service");
import ProjectsServer from "./projects";
import { ProjectsService } from "./protos/projects_grpc_pb";
import { AuthMiddleware, limiterMiddleware } from "@fonoster/auth";
import { getSalt } from "@fonoster/certs";
import { runServices } from "@fonoster/common";

const services = [
  {
    name: "projects",
    version: "v1beta1",
    service: ProjectsService,
    server: new ProjectsServer()
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
