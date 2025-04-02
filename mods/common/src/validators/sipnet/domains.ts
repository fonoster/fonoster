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
import { z } from "zod";
import { ROOT_DOMAIN } from "../../envs";
import { nameSchema } from "../common";

const domainSchema = z
  .string()
  .refine(
    (domain) => {
      const domainRegex = /^[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/;
      return domainRegex.test(domain);
    },
    {
      message: `Invalid domain format. Should be like: "acme.${ROOT_DOMAIN}"`
    }
  )
  .refine(
    (domain) => {
      return domain.endsWith(ROOT_DOMAIN);
    },
    {
      message: `Domain must end with "${ROOT_DOMAIN}"`
    }
  );

const createDomainRequestSchema = z.object({
  name: nameSchema,
  domainUri: domainSchema,
  egressPolicies: z
    .array(
      z.object({
        rule: z.string()
      })
    )
    .optional()
});

const updateDomainRequestSchema = z.object({
  name: nameSchema.optional(),
  egressPolicies: z
    .array(
      z.object({
        rule: z.string()
      })
    )
    .optional()
});

export { createDomainRequestSchema, updateDomainRequestSchema };
