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

// Allows only letters, numbers, underscores, and hyphens
const validNameRegex = /^[a-zA-Z0-9_-]+$/;

const createSecretRequestSchema = z.object({
  name: z
    .string()
    .regex(validNameRegex, {
      message:
        "Name can only contain letters, numbers, underscores, or hyphens. No spaces allowed"
    })
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(32, { message: "Name must be at most 32 characters long" }),
  secret: z.string()
});

export { createSecretRequestSchema };
