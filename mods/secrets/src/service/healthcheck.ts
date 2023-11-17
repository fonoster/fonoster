#!/usr/bin/env node
/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import { healthcheck } from "@fonoster/common";
import axios from "axios";
import logger from "@fonoster/logger";

// First checks the grpc health
healthcheck();

// Next, ensure vault is up
axios
  .get(`${process.env.VAULT_ADDR}/v1/sys/health`)
  .then((result) => {
    if (!result.data || result.data.sealed) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch((e) => {
    logger.error(e);
    process.exit(1);
  });
