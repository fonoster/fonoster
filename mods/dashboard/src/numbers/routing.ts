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
import type { Agent, Application, INumber } from "@fonoster/types";

/**
 * Where a number sends its calls. In this UI "agents" are AI agents
 * (Autopilot applications), "voice apps" are the other applications, and
 * "SIP users" are sipnet Agents, reached through their address of record.
 */
export type RouteKind = "agent" | "app" | "sip";

export type Route = { kind: RouteKind; to: string };

export const ROUTE_KINDS: { value: RouteKind; label: string; noun: string }[] =
  [
    { value: "agent", label: "Agent", noun: "agents" },
    { value: "app", label: "App", noun: "apps" },
    { value: "sip", label: "SIP user", noun: "SIP users" }
  ];

export function applicationKind(app: Pick<Application, "type">): RouteKind {
  return String(app.type) === "AUTOPILOT" ? "agent" : "app";
}

/** A SIP user's address of record, e.g. sip:maria@acme.sip.fonoster.io. */
export function sipUserAor(user: Agent): string | undefined {
  const domain = user.domain?.domainUri;
  return domain ? `sip:${user.username}@${domain}` : undefined;
}

export function routeOf(
  number: Pick<INumber, "appRef" | "agentAor">,
  apps: Application[]
): Route | undefined {
  if (number.appRef) {
    const app = apps.find((a) => a.ref === number.appRef);
    return {
      kind: app ? applicationKind(app) : "agent",
      to: number.appRef
    };
  }
  if (number.agentAor) return { kind: "sip", to: number.agentAor };
  return undefined;
}

/** What the ROUTES TO column shows, or undefined when not routed. */
export function routeLabel(
  number: Pick<INumber, "appRef" | "agentAor">,
  apps: Application[],
  sipUsers: Agent[]
): { kind: RouteKind; label: string } | undefined {
  const route = routeOf(number, apps);
  if (!route) return undefined;
  if (route.kind === "sip") {
    const user = sipUsers.find((u) => sipUserAor(u) === route.to);
    const name = user?.username ?? route.to.replace(/^sips?:/, "");
    return { kind: "sip", label: `${name} · SIP user` };
  }
  const app = apps.find((a) => a.ref === route.to);
  return { kind: route.kind, label: app?.name ?? route.to };
}

export { formatNumber } from "~/lib/format";

/** "+1 (809) 555-0177" → "tel:+18095550177". */
export function toTelUrl(input: string): string {
  const digits = input.replace(/^tel:/, "").replace(/[\s().-]/g, "");
  return `tel:${digits}`;
}

export function formatLocation(
  number: Pick<INumber, "city" | "country" | "countryIsoCode">
) {
  const place = number.countryIsoCode || number.country;
  return [number.city, place].filter(Boolean).join(", ") || "—";
}
