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
import isISO31661Alpha2 from "validator/lib/isISO31661Alpha2";
import { z } from "zod";

const sipUriRegex = /^sip:[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+$/;
const sipUriSchema = z.string().regex(sipUriRegex, "Invalid SIP URI");

const countryIsoCodeSchema = z.string().refine((val) => isISO31661Alpha2(val), {
  message: "Invalid ISO country code"
});

const createNumberRequestSchema = z
  .object({
    agentAor: sipUriSchema.optional(),
    appRef: z.string().optional(),
    countryIsoCode: countryIsoCodeSchema
  })
  .refine(
    (data) =>
      (data.agentAor && !data.appRef) || (!data.agentAor && data.appRef),
    {
      message: "Either 'agentAor' or 'appRef' must be present, but not both"
    }
  );

export { createNumberRequestSchema };
