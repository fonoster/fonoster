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
import { withErrorHandling, withValidation } from "@fonoster/common";
import { withAccess } from "@fonoster/identity";
import { z } from "zod";

function withErrorHandlingAndValidationAndAccess<T, A>(
  handler: (call: T) => Promise<A>,
  getFn: (ref: string) => Promise<unknown>,
  schema: z.ZodSchema
) {
  // Start by applying access logic, then validation, and finally error handling
  const withAccessHandler = withAccess(handler, getFn);
  const withValidationHandler = withValidation(withAccessHandler, schema);
  return withErrorHandling(withValidationHandler);
}

export { withErrorHandlingAndValidationAndAccess };
