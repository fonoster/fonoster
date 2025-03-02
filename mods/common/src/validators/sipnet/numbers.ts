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
import isISO31661Alpha2 from "validator/lib/isISO31661Alpha2";
import { z } from "zod";
import { nameSchema } from "../common";

const sipUriRegex = /^sip:[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+$/;
const sipUriSchema = z.string().regex(sipUriRegex, "Invalid SIP URI");

const countryIsoCodeSchema = z.string().refine((val) => isISO31661Alpha2(val), {
  message: "Invalid country ISO code"
});

const createNumberRequestSchema = z
  .object({
    name: nameSchema,
    telUrl: z.string(),
    city: z.string(),
    country: z.string(),
    agentAor: sipUriSchema.optional(),
    appRef: z.string().optional(),
    countryIsoCode: countryIsoCodeSchema
  })
  .refine(
    ({ agentAor, appRef }) => !(agentAor !== undefined && appRef !== undefined),
    {
      message:
        "You can only provide one of the following fields: 'agentAor' or 'appRef'"
    }
  );

const updateNumberRequestSchema = z
  .object({
    name: nameSchema.optional(),
    agentAor: sipUriSchema.optional(),
    appRef: z.string().optional()
  })
  .refine(
    ({ agentAor, appRef }) => !(agentAor !== undefined && appRef !== undefined),
    {
      message:
        "You can only provide one of the following fields: 'agentAor' or 'appRef'"
    }
  );

export { createNumberRequestSchema, updateNumberRequestSchema };
