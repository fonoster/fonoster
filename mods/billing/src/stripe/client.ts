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
import { URL } from "url";
import Stripe from "stripe";

/** The Stripe SDK at the API version the fake pins; `apiBase` points it at the fake. */
export function createStripe(config: {
  secretKey: string;
  apiBase?: string;
}): Stripe {
  const options: Stripe.StripeConfig = { maxNetworkRetries: 2 };
  if (config.apiBase) {
    const u = new URL(config.apiBase);
    options.host = u.hostname;
    options.port = Number(u.port || (u.protocol === "https:" ? 443 : 80));
    options.protocol = u.protocol.replace(":", "") as "http" | "https";
  }
  return new Stripe(config.secretKey, options);
}
