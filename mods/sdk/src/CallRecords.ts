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
import {
  CallRecordAuditEntry,
  CallRecordDetail,
  ListCallRecordsRequest,
  ListCallRecordsResponse,
  RetentionPolicy
} from "@fonoster/types";
import { FonosterClient } from "./client/types";

type FetchLike = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

/** An error answer from the records API (status and its `error` code). */
class CallRecordsError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string
  ) {
    super(message ?? `records API: ${status} ${code}`);
  }
}

/**
 * @classdesc Call records (vCon) through the HTTP records API (`/api/records`): search, one
 * record (redacted unless you ask for the original and have the owner or admin role), the
 * recording, the audit log, erasure and retention.
 *
 * @example
 * const records = new SDK.CallRecords(client);
 * const { items } = await records.listRecords({ after: "2026-10-01T00:00:00Z" });
 * const record = await records.getRecord(items[0].callRef);
 */
class CallRecords {
  private readonly client: FonosterClient;
  private readonly baseUrl?: string;
  private readonly fetchFn: FetchLike;

  /**
   * @param {FonosterClient} client - A logged-in client
   * @param {object} options - `baseUrl` of the HTTP API (default: the client's), `fetch`
   */
  constructor(
    client: FonosterClient,
    options: { baseUrl?: string; fetch?: FetchLike } = {}
  ) {
    this.client = client;
    this.baseUrl = options.baseUrl?.replace(/\/+$/, "");
    // Called as a method below, so never store the global unbound: in browsers a detached
    // `fetch` throws "Illegal invocation".
    this.fetchFn =
      options.fetch ??
      (client.getFetch?.() as FetchLike | undefined) ??
      (((input, init) =>
        globalThis.fetch(input, init)) as unknown as FetchLike);
  }

  private url(path: string, query: Record<string, unknown> = {}) {
    const base =
      this.baseUrl ?? this.client.getHttpUrl?.() ?? "https://api.fonoster.ai";
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join("&");
    return `${base}/api/records${path}${qs ? `?${qs}` : ""}`;
  }

  /** Sends a request, refreshing the access token once on 401. */
  private async send(
    path: string,
    init: {
      method?: string;
      body?: unknown;
      query?: Record<string, unknown>;
    } = {}
  ) {
    const attempt = () =>
      this.fetchFn(this.url(path, init.query), {
        method: init.method ?? "GET",
        headers: {
          authorization: `Bearer ${this.client.getAccessToken()}`,
          "x-accesskey-id": this.client.getAccessKeyId(),
          ...(init.body ? { "content-type": "application/json" } : {})
        },
        body: init.body ? JSON.stringify(init.body) : undefined
      });
    let res = await attempt();
    if (res.status === 401) {
      await this.client.refreshToken();
      res = await attempt();
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      throw new CallRecordsError(
        res.status,
        body.error ?? "error",
        body.message
      );
    }
    return res;
  }

  private async json<T>(
    path: string,
    init?: { method?: string; body?: unknown; query?: Record<string, unknown> }
  ): Promise<T> {
    return (await (await this.send(path, init)).json()) as T;
  }

  /**
   * Searches the workspace's records, newest first, a page at a time; the first page's `total`
   * counts every record the query matches, on all pages.
   */
  async listRecords(
    request: ListCallRecordsRequest = {}
  ): Promise<ListCallRecordsResponse> {
    return this.json("", { query: request });
  }

  /** One record; the latest version unless `version` is given. */
  async getRecord(
    callRef: string,
    options: { version?: number; original?: boolean } = {}
  ): Promise<CallRecordDetail> {
    return this.json(`/${encodeURIComponent(callRef)}`, {
      query: {
        version: options.version,
        original: options.original ? "true" : undefined
      }
    });
  }

  /** The recording (WAV) with its content hash. */
  async getRecording(
    callRef: string,
    options: { version?: number; original?: boolean } = {}
  ): Promise<{ data: ArrayBuffer; contentType: string; contentHash: string }> {
    const res = await this.send(`/${encodeURIComponent(callRef)}/recording`, {
      query: {
        version: options.version,
        original: options.original ? "true" : undefined
      }
    });
    return {
      data: await res.arrayBuffer(),
      contentType: res.headers.get("content-type") ?? "audio/x-wav",
      contentHash: res.headers.get("x-content-hash") ?? ""
    };
  }

  /** Deletions and erasures of a record (owner or admin). */
  async getAudit(callRef: string): Promise<CallRecordAuditEntry[]> {
    const { items } = await this.json<{ items: CallRecordAuditEntry[] }>(
      `/${encodeURIComponent(callRef)}/audit`
    );
    return items;
  }

  /** Erases the call: every object is deleted and a signed tombstone remains (owner or admin). */
  async eraseRecord(callRef: string, reason?: string): Promise<unknown> {
    return this.json(`/${encodeURIComponent(callRef)}`, {
      method: "DELETE",
      body: reason ? { reason } : undefined
    });
  }

  /** Deletes one part (recording, transcript, messages) of a record (owner or admin). */
  async deletePart(
    callRef: string,
    part: string,
    reason?: string
  ): Promise<unknown> {
    return this.json(
      `/${encodeURIComponent(callRef)}/parts/${encodeURIComponent(part)}`,
      { method: "DELETE", body: reason ? { reason } : undefined }
    );
  }

  async getRetention(): Promise<RetentionPolicy[]> {
    const { items } = await this.json<{ items: RetentionPolicy[] }>(
      "/retention"
    );
    return items;
  }

  /** Sets how many days a part is kept; `null` removes the policy (owner or admin). */
  async setRetention(
    part: string,
    days: number | null
  ): Promise<RetentionPolicy> {
    return this.json("/retention", { method: "PUT", body: { part, days } });
  }
}

export { CallRecords, CallRecordsError };
