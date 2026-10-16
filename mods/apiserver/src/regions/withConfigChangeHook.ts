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
import * as grpc from "@grpc/grpc-js";

/** Services whose writes change a private cell's config (PR-7). */
export const SYNCED_SERVICES = [
  "Applications",
  "Numbers",
  "Domains",
  "Agents",
  "Trunks",
  "Acls",
  "Credentials",
  "Webhooks"
];

const WRITE = /^(create|update|delete|rotate|regenerate|resend)/;

type Service = {
  definition: { serviceName: string };
  handlers: grpc.UntypedServiceImplementation;
};

/**
 * Wraps the write handlers of the synced services so a successful write marks the workspace's
 * config changed (the config sync publishes a new version for private workspaces).
 */
export function withConfigChangeHook<T extends Service>(
  services: T[],
  onChange: (accessKeyId: string) => void
): T[] {
  return services.map((service) => {
    if (!SYNCED_SERVICES.includes(service.definition.serviceName))
      return service;
    const handlers: grpc.UntypedServiceImplementation = {};
    for (const [name, handler] of Object.entries(service.handlers)) {
      if (!WRITE.test(name) || typeof handler !== "function") {
        handlers[name] = handler;
        continue;
      }
      const fn = handler as (
        call: unknown,
        cb: (...a: unknown[]) => void
      ) => unknown;
      handlers[name] = ((
        call: { metadata?: grpc.Metadata },
        cb: (...a: unknown[]) => void
      ) =>
        fn(call, (err: unknown, ...rest: unknown[]) => {
          cb(err, ...rest);
          if (err) return;
          const id = call.metadata?.get("accessKeyId")?.[0];
          if (id) onChange(String(id));
        })) as grpc.UntypedHandleCall;
    }
    return { ...service, handlers };
  });
}
