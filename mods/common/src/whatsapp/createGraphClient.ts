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
import { URL } from "node:url";
import { WhatsAppCredentials } from "@fonoster/types";
import { z } from "zod";
import { WhatsAppLinkOptions } from "./types";
import { WhatsAppLinkError } from "./WhatsAppLinkError";

/** The Graph API version the link is written against. */
const GRAPH_API_VERSION = "v23.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// A token with whitespace or a control character would make fetch throw a raw TypeError from
// inside the header, before any WhatsAppLinkError could name the step
const isHeaderSafe = (token: string) =>
  token.length > 0 &&
  !/\s/.test(token) &&
  [...token].every((char) => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  });
const credentialsSchema = z
  .object({ accessToken: z.string().refine(isHeaderSafe) })
  .strict();
const phoneNumberIdSchema = z.string().regex(/^\d{1,20}$/);

/** Graph's error envelope, as every refusal carries it. */
type GraphErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

/** A non-2xx answer from Graph. It never leaves the module (see runStep). */
class GraphResponseError extends Error {
  readonly status: number;
  readonly body: GraphErrorBody;

  constructor(status: number, body: GraphErrorBody) {
    super(`Graph answered ${status}`);
    this.name = "GraphResponseError";
    this.status = status;
    this.body = body;
  }
}

type GraphClient = {
  phoneNumberId: string;
  get(path: string, query?: Record<string, string>): Promise<unknown>;
  post(path: string, body: unknown): Promise<unknown>;
};

/**
 * Builds the Graph API client only from a complete token and a well-formed phone number id, so
 * nothing is ever sent with an empty or malformed credential. The token travels only as
 * `Authorization: Bearer`, never as a query parameter, and never follows a redirect.
 */
function createGraphClient(
  credentials: WhatsAppCredentials,
  phoneNumberId: string,
  options: WhatsAppLinkOptions = {}
): GraphClient {
  const parsedCredentials = credentialsSchema.safeParse(credentials);
  const parsedId = phoneNumberIdSchema.safeParse(phoneNumberId);

  if (!parsedCredentials.success || !parsedId.success) {
    throw new WhatsAppLinkError(
      "INVALID_CREDENTIALS",
      "The WhatsApp access token or phone number id is incomplete or malformed"
    );
  }

  const token = parsedCredentials.data.accessToken;
  const doFetch = options.fetch ?? globalThis.fetch;

  async function request(
    method: "GET" | "POST",
    path: string,
    query?: Record<string, string>,
    body?: unknown
  ): Promise<unknown> {
    const url = new URL(`${GRAPH_API_BASE}${path}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, value);
    }

    const response = await doFetch(url.toString(), {
      method,
      redirect: "error",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new GraphResponseError(response.status, {});
    }

    if (!response.ok) {
      throw new GraphResponseError(
        response.status,
        (json ?? {}) as GraphErrorBody
      );
    }

    return json;
  }

  return {
    phoneNumberId: parsedId.data,
    get: (path, query) => request("GET", path, query),
    post: (path, body) => request("POST", path, undefined, body)
  };
}

export {
  createGraphClient,
  GraphClient,
  GraphResponseError,
  GRAPH_API_VERSION
};
