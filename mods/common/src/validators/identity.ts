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
import { Role } from "@fonoster/types";
import { z } from "zod";
import { POSITIVE_INTEGER_MESSAGE } from "../messages";

const MIN_NAME_MESSAGE = "The name is required";
const MAX_NAME_MESSAGE = "Name must contain at most 50 characters";
const EMAIL_MESSAGE = "Invalid email";
const PASSWORD_MESSAGE = "Password must contain at least 8 characters";
const USER_REF_MESSAGE = "Invalid user reference";
const WORKSPACE_REF_MESSAGE = "Invalid workspace reference";

const createWorkspaceRequestSchema = z.object({
  name: z
    .string()
    .min(1, { message: MIN_NAME_MESSAGE })
    .max(50, { message: MAX_NAME_MESSAGE })
});

const createApiKeyRequestSchema = z.object({
  role: z.enum([Role.WORKSPACE_ADMIN]),
  expiresAt: z
    .number()
    .int({ message: POSITIVE_INTEGER_MESSAGE })
    .positive({ message: POSITIVE_INTEGER_MESSAGE })
    .optional()
});

const exchangeApiKeysRequestSchema = z.object({
  accessKeyId: z.string(),
  accessKeySecret: z.string()
});

const exchangeCredentialsRequestSchema = z.object({
  username: z
    .string()
    .email({ message: "Invalid username. Must be an email address" }),
  password: z.string(),
  twoFactorCode: z.string().optional()
});

const exchangeOauth2RequestSchema = z.object({
  provider: z.enum(["GITHUB"]).default("GITHUB"),
  code: z.string()
});

const exchangeRefreshTokenRequestSchema = z.object({
  refreshToken: z.string()
});

const createUserRequestSchema = z.object({
  name: z.string().max(50, { message: MAX_NAME_MESSAGE }),
  email: z.string().email({ message: EMAIL_MESSAGE }),
  password: z.string().min(8, { message: PASSWORD_MESSAGE }).max(100),
  avatar: z
    .string()
    .url()
    .max(255, { message: "Invalid avatar URL" })
    .optional()
});

const createUserWithOauth2CodeRequestSchema = z.object({
  code: z.string()
});

const updateUserRequestSchema = z.object({
  ref: z.string().uuid({ message: USER_REF_MESSAGE }),
  name: z
    .string()
    .max(50, { message: MAX_NAME_MESSAGE })
    .or(z.string().optional()),
  password: z
    .string()
    .min(8, { message: PASSWORD_MESSAGE })
    .or(z.string().optional()),
  avatar: z.string().url().or(z.string().optional())
});

const inviteUserToWorkspaceRequestSchema = z.object({
  email: z.string().email({ message: EMAIL_MESSAGE }),
  name: z.string().max(50, { message: MAX_NAME_MESSAGE }),
  role: z.enum([Role.WORKSPACE_ADMIN, Role.WORKSPACE_MEMBER]),
  password: z.string().min(8, { message: PASSWORD_MESSAGE }).or(z.undefined())
});

const resendWorkspaceMembershipInvitationRequestSchema = z.object({
  userRef: z.string().uuid({ message: USER_REF_MESSAGE })
});

const updateWorkspaceRequestSchema = z.object({
  ref: z.string().uuid({ message: WORKSPACE_REF_MESSAGE }),
  name: z
    .string()
    .min(1, { message: MIN_NAME_MESSAGE })
    .max(50, { message: MAX_NAME_MESSAGE })
    .or(z.string().optional())
});

const removeUserFromWorkspaceRequestSchema = z.object({
  userRef: z.string().uuid({ message: USER_REF_MESSAGE })
});

const sendVerificationCodeRequestSchema = z.object({
  contactType: z.enum(["EMAIL", "PHONE"]).default("EMAIL"),
  value: z.string()
});

const verifyCodeRequestSchema = z.object({
  username: z.string(),
  contactType: z.enum(["EMAIL", "PHONE"]).default("EMAIL"),
  value: z.string(),
  verificationCode: z.string()
});

const sendResetPasswordCodeRequestSchema = z.object({
  username: z
    .string()
    .email({ message: "Invalid username. Must be an email address" }),
  resetPasswordUrl: z.string()
});

const resetPasswordRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
  verificationCode: z.string()
});

export {
  createApiKeyRequestSchema,
  createUserRequestSchema,
  createWorkspaceRequestSchema,
  exchangeApiKeysRequestSchema,
  exchangeCredentialsRequestSchema,
  exchangeOauth2RequestSchema,
  exchangeRefreshTokenRequestSchema,
  inviteUserToWorkspaceRequestSchema,
  removeUserFromWorkspaceRequestSchema,
  resendWorkspaceMembershipInvitationRequestSchema,
  sendVerificationCodeRequestSchema,
  updateUserRequestSchema,
  updateWorkspaceRequestSchema,
  verifyCodeRequestSchema,
  sendResetPasswordCodeRequestSchema,
  resetPasswordRequestSchema,
  createUserWithOauth2CodeRequestSchema
};
