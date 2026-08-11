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
import { POSITIVE_INTEGER_MESSAGE } from "../../messages";
import { nameSchema } from "../common";

const hostOrIPSchema = z
  .string()
  .refine((host) => Validator.isIP(host, 4) || Validator.isFQDN(host), {
    message: "Must be a valid IP or FQDN"
  });

// Scalars holding their zero value (`false`, `0`) are not serialized by proto3,
// and the loader is configured with `defaults: false` (see `utils/createService`),
// so they reach the handler as missing rather than as the value the client sent.
// Declaring the zero value as the schema default restores what the wire dropped,
// instead of rejecting a well-formed request with `Required at "<field>"`.
const createTrunkRequestSchema = z.object({
  name: nameSchema,
  sendRegister: z.boolean().default(false),
  inboundUri: hostOrIPSchema,
  uris: z.array(
    z.object({
      host: hostOrIPSchema,
      // Zero is not a usable SIP port, so this default never stands on its own;
      // it exists so a missing or zero port fails with an accurate message.
      port: z
        .number()
        .positive({ message: POSITIVE_INTEGER_MESSAGE })
        .default(0),
      transport: z.nativeEnum(Transport, { message: "Invalid transport" }),
      user: z.string().optional(),
      weight: z.number().default(0),
      priority: z.number().default(0),
      enabled: z.boolean().default(false)
    })
  )
});

const updateTrunkRequestSchema = z.object({});

export { createTrunkRequestSchema, updateTrunkRequestSchema };
