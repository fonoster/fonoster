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
// The cloud side of `fonoster-region` (PR-19, PR-21): the operator's admin API for public regions
// (contract 0), authorized only by the operator key in `x-operator-key`. Never prints the key.

export const DEFAULT_API_URL = "https://api.fonoster.ai";

export type AdminOptions = {
  /** The control plane's API base URL (the same one the dashboard and SDK use). */
  api: string;
  operatorKey: string;
  fetch?: typeof fetch;
};

export class AdminError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

const HINTS: Record<number, string> = {
  401: "the operator key was refused (check --operator-key or FONOSTER_OPERATOR_KEY)",
  404: "not found (or the admin API is off: set regions.operatorKey on the API server)"
};

/** One admin API call; the answer's JSON, or an AdminError with the API's code. */
export async function adminRequest<T = Record<string, unknown>>(
  options: AdminOptions,
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<T> {
  if (!options.operatorKey)
    throw new AdminError(
      0,
      "operator_key_missing",
      "the operator key is required (--operator-key or FONOSTER_OPERATOR_KEY)"
    );
  const http = options.fetch ?? fetch;
  const url = `${options.api.replace(/\/+$/, "")}/api/admin/regions${path}`;
  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await http(url, {
      method,
      headers: {
        "x-operator-key": options.operatorKey,
        ...(body ? { "content-type": "application/json" } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (e) {
    throw new AdminError(
      0,
      "unreachable",
      `${url} could not be reached: ${(e as Error).message}`
    );
  }
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { error: text.trim() };
  }
  if (!res.ok) {
    const code = String(json.error ?? "error");
    const said = json.message ? `: ${json.message}` : "";
    throw new AdminError(
      res.status,
      code,
      `${res.status} ${code}${said}${HINTS[res.status] && !said ? ` (${HINTS[res.status]})` : ""}`
    );
  }
  return json as T;
}

type AdminRegion = {
  ref?: string;
  id: string;
  kind?: string;
  displayName?: string;
  name?: string;
  status?: string;
  published?: boolean;
  default?: boolean;
  ownerRef?: string;
  workspaceCount?: number;
  workspaces?: unknown[] | number;
  sipDomain?: string | null;
};

/** `fonoster-region list` as a table. */
export function formatRegions(items: AdminRegion[]): string {
  const rows = items.map((r) => [
    r.id,
    r.kind ?? "",
    r.status ?? "",
    r.kind === "public"
      ? r.ref
        ? r.published
          ? "yes"
          : "no"
        : "configured"
      : "",
    String(
      r.workspaceCount ??
        (Array.isArray(r.workspaces) ? r.workspaces.length : r.workspaces) ??
        ""
    ),
    r.sipDomain ?? "",
    r.displayName ?? r.name ?? ""
  ]);
  const head = [
    "ID",
    "KIND",
    "STATUS",
    "PUBLISHED",
    "WORKSPACES",
    "SIP DOMAIN",
    "NAME"
  ];
  const all = [head, ...rows];
  const widths = head.map((_, i) => Math.max(...all.map((r) => r[i].length)));
  return all
    .map((r) =>
      r
        .map((c, i) => (i === r.length - 1 ? c : c.padEnd(widths[i])))
        .join("  ")
        .trimEnd()
    )
    .join("\n");
}

export const admin = {
  list: (o: AdminOptions) =>
    adminRequest<{ items: AdminRegion[] }>(o, "GET", ""),
  create: (
    o: AdminOptions,
    body: { id: string; displayName: string; sipDomain?: string }
  ) =>
    adminRequest<{ ref: string; id: string; token: string; expiresAt: string }>(
      o,
      "POST",
      "",
      body
    ),
  token: (o: AdminOptions, id: string) =>
    adminRequest<{ token: string; expiresAt: string }>(
      o,
      "POST",
      `/${encodeURIComponent(id)}/token`
    ),
  publish: (o: AdminOptions, id: string) =>
    adminRequest<AdminRegion>(o, "POST", `/${encodeURIComponent(id)}/publish`),
  revoke: (o: AdminOptions, id: string) =>
    adminRequest<AdminRegion>(o, "POST", `/${encodeURIComponent(id)}/revoke`)
};
