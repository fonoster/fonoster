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

/**
 * A service's NATS connection settings (add-platform 4.1): the URL plus, when the server has
 * per-service users, the service's user and password. The password is usually a `secret://`
 * reference, resolved by the config loader like any other value.
 */
export const natsConnectionSchema = z
  .object({
    url: z.string().min(1),
    user: z.string().min(1).optional(),
    password: z.string().min(1).optional()
  })
  .strict();

export type NatsConnectionConfig = z.infer<typeof natsConnectionSchema>;

/** A NATS URL or full connection settings. */
export type NatsTarget = string | NatsConnectionConfig;

/**
 * The inbox prefix of a NATS user: replies to its requests (and JetStream deliveries) arrive
 * under `_INBOX_<user>.`, the only inbox its permissions let it subscribe to, so no service can
 * read another's replies (nats-permissions/*.conf).
 */
export function natsInboxPrefix(user: string): string {
  return `_INBOX_${user}`;
}

/** nats.js `connect` options for a URL or a `{ url, user, password }` setting. */
export function natsConnectOptions(nats: NatsTarget): {
  servers: string;
  user?: string;
  pass?: string;
  inboxPrefix?: string;
} {
  if (typeof nats === "string") return { servers: nats };
  return nats.user
    ? {
        servers: nats.url,
        user: nats.user,
        pass: nats.password ?? "",
        inboxPrefix: natsInboxPrefix(nats.user)
      }
    : { servers: nats.url };
}
