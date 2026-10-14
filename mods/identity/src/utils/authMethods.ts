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
import { status } from "@grpc/grpc-js";
import { IdentityConfig } from "../exchanges/types";

type AuthMethod = "password" | "email_code" | "github";

/** Whether a sign-in method is enabled (features.auth.methods). */
function isMethodEnabled(config: IdentityConfig, method: AuthMethod): boolean {
  return config.auth.methods.includes(method);
}

/** Whether people may create their own account (features.auth.signup: open). */
function isOpenSignup(config: IdentityConfig): boolean {
  return config.auth.signup === "open";
}

const METHOD_LABELS: Record<AuthMethod, string> = {
  password: "Password",
  email_code: "Email code",
  github: "GitHub"
};

/** The error an exchange returns when its method is disabled. */
function methodDisabledError(method: AuthMethod) {
  return {
    code: status.PERMISSION_DENIED,
    message: `${METHOD_LABELS[method]} sign-in is disabled`
  };
}

export { AuthMethod, isMethodEnabled, isOpenSignup, methodDisabledError };
