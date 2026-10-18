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
import type { ContactType } from "@fonoster/types";
import { z } from "zod";

export const EMAIL_CONTACT = "EMAIL" as unknown as ContactType;

export const email = z
  .string()
  .trim()
  .min(1, "Enter your email")
  .email("Enter a valid email");

export const newPassword = z.string().min(8, "Use at least 8 characters");

/** A new password typed twice. */
export const newPasswordForm = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "The passwords don't match"
  });

/** Invitees replace the one-time password, which they must enter again. */
export const setPasswordForm = z
  .object({
    currentPassword: z.string().min(1, "Enter the one-time password"),
    password: newPassword,
    confirm: z.string()
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "The passwords don't match"
  });
