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

const propertySchema = z
  .object({
    type: z.string(),
    // NOTICE: We are adopting Gemini's format which only supports 'enum' and 'date-time'
    format: z.enum(["enum", "date-time"]).optional(),
    pattern: z.string().optional()
  })
  .refine(
    (data) => {
      return !("format" in data && "pattern" in data);
    },
    {
      message: "Property can only have either 'format' or 'pattern', not both."
    }
  );

export { propertySchema };
