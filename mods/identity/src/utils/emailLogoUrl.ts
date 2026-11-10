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
import { IdentityConfig } from "../exchanges/types";

/**
 * The logo the account emails load: the dashboard's `logo-email.png`, or
 * `<issuer>/logo-email.png` when Identity was configured without an app URL.
 */
function emailLogoUrl(
  identityConfig: Pick<IdentityConfig, "emailLogoUrl" | "issuer">
) {
  return (
    identityConfig.emailLogoUrl ??
    `${identityConfig.issuer.replace(/\/+$/, "")}/logo-email.png`
  );
}

export { emailLogoUrl };
