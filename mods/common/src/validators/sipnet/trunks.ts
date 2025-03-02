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
import { Transport } from "@fonoster/types";
import * as Validator from "validator";
import { z } from "zod";
import { nameSchema } from "../common";

const hostOrIPSchema = z
  .string()
  .refine((host) => Validator.isIP(host, 4) || Validator.isFQDN(host), {
    message: "Must be a valid IP or FQDN"
  });

const createTrunkRequestSchema = z.object({
  name: nameSchema,
  sendRegister: z.boolean(),
  inboundUri: hostOrIPSchema,
  uris: z.array(
    z.object({
      host: hostOrIPSchema,
      port: z.number(),
      transport: z.nativeEnum(Transport, { message: "Invalid transport" }),
      user: z.string().optional(),
      weight: z.number(),
      priority: z.number(),
      enabled: z.boolean()
    })
  )
});

const updateTrunkRequestSchema = z.object({});

export { createTrunkRequestSchema, updateTrunkRequestSchema };
