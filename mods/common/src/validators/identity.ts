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
import { ApiRoleEnum } from "@fonoster/types";
import { z } from "zod";

const createApiKeyRequestSchema = z.object({
  role: z.enum([ApiRoleEnum.WORKSPACE_ADMIN]),
  expiresAt: z
    .number()
    .transform((value) => (value === 0 ? null : value))
    .optional()
});

const exchangeApiKeysRequestSchema = z.object({
  accessKeyId: z.string(),
  accessKeySecret: z.string()
});

const exchangeCredentialsRequestSchema = z.object({
  username: z.string(),
  password: z.string()
});

const exchangeRefreshTokenRequestSchema = z.object({
  refreshToken: z.string()
});

const createUserRequestSchema = z.object({
  name: z.string().min(3, "Name must contain at least 3 characters").max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  avatar: z.string().url()
});

const updateUserRequestSchema = z.object({
  ref: z.string(),
  name: z.string().min(3).max(50).or(z.string().optional().nullable()),
  password: z.string().min(8).max(50).or(z.string().optional().nullable()),
  avatar: z.string().url().or(z.string().optional().nullable())
});

export {
  createApiKeyRequestSchema,
  createUserRequestSchema,
  exchangeApiKeysRequestSchema,
  exchangeCredentialsRequestSchema,
  exchangeRefreshTokenRequestSchema,
  updateUserRequestSchema
};
