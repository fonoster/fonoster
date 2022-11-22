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
T.init("auth-service");

import { LimiterService } from "@fonoster/auth/dist/service/protos/auth_grpc_pb";
import { runServices } from "@fonoster/common";
import LimiterServer from "./limiter";

const services = [
  {
    name: "limiter",
    version: "v1beta1",
    service: LimiterService,
    server: new LimiterServer()
  }
];

runServices(services);
