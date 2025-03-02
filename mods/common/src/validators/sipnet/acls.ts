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
import * as Validator from "validator";
import { z } from "zod";
import { nameSchema } from "../common";

const IP_OR_CIDR_MESSAGE = "Must be a valid IP or CIDR range";
const AT_LEAST_ONE_MESSAGE = "At least one IP or CIDR range is required";

const ipOrCidr = z
  .string()
  .refine(
    (value) => Validator.isIP(value, 4) || Validator.isIPRange(value, 4),
    {
      message: IP_OR_CIDR_MESSAGE
    }
  );

const createAclRequestSchema = z.object({
  name: nameSchema,
  allow: z.array(ipOrCidr).nonempty({ message: AT_LEAST_ONE_MESSAGE })
});

const updateAclRequestSchema = z.object({
  name: nameSchema,
  allow: z
    .array(ipOrCidr)
    .nonempty({ message: AT_LEAST_ONE_MESSAGE })
    .optional()
});

export { createAclRequestSchema, updateAclRequestSchema };
