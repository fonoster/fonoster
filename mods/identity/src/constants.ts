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
export const SIGN_ALGORITHM = "RS256";
export const VERIFICATION_CODE_EXPIRATION = 5 * 60 * 1000;
/** Wrong guesses allowed before a code stops working. */
export const VERIFICATION_CODE_MAX_ATTEMPTS = 5;
/** Codes sent per email, and per client IP, within the window. */
export const VERIFICATION_CODE_SEND_LIMITS = {
  perEmail: 3,
  perIp: 20,
  windowMs: 10 * 60 * 1000
};
/** ResetPassword attempts per email, and per client IP, within the window. */
export const RESET_PASSWORD_ATTEMPT_LIMITS = {
  perEmail: 10,
  perIp: 30,
  windowMs: 10 * 60 * 1000
};
/**
 * How long a just-used refresh token may be used again (concurrent renewals,
 * e.g. two browser tabs). Later reuse revokes the token's family.
 */
export const REFRESH_TOKEN_REUSE_GRACE_MS = 30 * 1000;
