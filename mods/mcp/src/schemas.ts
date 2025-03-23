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

const ListApplicationsSchema = z.object({
  page_size: z.number().optional().describe("Number of applications per page"),
  page_token: z.string().optional().describe("Token for pagination")
});

const ListNumbersSchema = z.object({
  page_size: z.number().optional().describe("Number of numbers per page"),
  page_token: z.string().optional().describe("Token for pagination")
});

const CreateCallSchema = z.object({
  from: z.string().describe("The phone number to call from"),
  to: z.string().describe("The phone number to call to"),
  app_ref: z.string().describe("The application reference to use for the call"),
  timeout: z.number().optional().describe("The timeout for the call")
});

const CreateCallBatchSchema = z.object({
  from: z.string().min(1),
  to_array: z.array(z.string().min(1)).min(1),
  app_ref: z.string().min(1),
  timeout: z.number().optional(),
  calls_per_minute: z.number().min(1).max(60).optional().default(20)
});

export {
  ListApplicationsSchema,
  CreateCallSchema,
  ListNumbersSchema,
  CreateCallBatchSchema
};
