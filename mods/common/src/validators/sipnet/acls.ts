/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import * as Validator from "validator";
import { z } from "zod";
import { nameField } from "../common";

const ipOrCidr = z
  .string()
  .refine(
    (value) => Validator.isIP(value, 4) || Validator.isIPRange(value, 4),
    {
      message: "Must be a valid IP or CIDR range"
    }
  );

const createAclRequestSchema = z.object({
  name: nameField,
  allow: z
    .array(ipOrCidr)
    .nonempty({ message: "At least one IP or CIDR is required" }),
  deny: z
    .array(ipOrCidr)
    .nonempty({ message: "At least one IP or CIDR is required" })
});

const updateAclRequestSchema = z.object({
  name: nameField,
  allow: z.array(ipOrCidr).optional(),
  deny: z.array(ipOrCidr).optional()
});

export { createAclRequestSchema, updateAclRequestSchema };
