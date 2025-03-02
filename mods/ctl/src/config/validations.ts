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

const workspaceConfigSchema = z.object({
  endpoint: z.string().min(1, "The endpoint value is required"),
  workspaceAccessKeyId: z
    .string()
    .min(1, "The workspaceAccessKeyId value is required"),
  accessKeyId: z.string().min(1, "The accessKeyId value is required"),
  accessKeySecret: z.string().min(1, "The accessKeySecret value is required"),
  workspaceRef: z.string().min(1, "The workspaceRef value is required"),
  workspaceName: z.string().min(1, "The workspaceName value is required"),
  active: z.boolean().optional()
});

export { workspaceConfigSchema };
