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
/* global structuredClone, URL */
/*
 * A stateful fake of the Graph API endpoints the WhatsApp link uses, with no transport: phone
 * numbers (with their tier and calling settings) and tokens (with their permissions and the
 * WhatsApp Business Accounts they reach) go in, `handle()` answers one request the way Meta
 * does. `graphApiFakeFetch` turns it into a `fetch`.
 *
 * PROVISIONAL: the status codes, error codes and the password behavior below are the ones the
 * prototype and Meta's docs suggest. Once the baseline recording
 * (fixtures/baseline-2026-10.jsonl, #1191) lands, each is set to what the recording shows.
 */
import { randomBytes } from "node:crypto";
import net from "node:net";

const GRAPH_API_VERSION = "v23.0";

type Permission =
  | "whatsapp_business_management"
  | "whatsapp_business_messaging";

type FakeToken = {
  token: string;
  permissions: Permission[];
  /** The WhatsApp Business Accounts this token can reach. */
  wabaIds: string[];
};

type FakeSipServer = { hostname: string; port: number };

type FakeCalling = {
  status: "ENABLED" | "DISABLED";
  srtpKeyExchange?: "SDES" | "DTLS";
  sip: {
    status: "ENABLED" | "DISABLED";
    webhookDelivery?: "ENABLED" | "DISABLED";
    servers: FakeSipServer[];
  };
  additionalCodecs?: string[];
};

type FakePhoneNumber = {
  id: string;
  wabaId: string;
  /** As Meta formats it: "+52 55 1234 5678". */
  displayPhoneNumber: string;
  verifiedName: string;
  messagingLimitTier: string;
  qualityRating: string;
  calling: FakeCalling;
  /** The SIP password Meta issued for the number; null until SIP calling is enabled. */
  sipPassword: string | null;
};

type FakeRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
};

type FakeResponse = { status: number; body: unknown };

type LoggedRequest = {
  method: string;
  path: string;
  query: Record<string, string>;
};

type FailureMode = "5xx" | "network" | null;

type GraphApiFake = {
  phoneNumbers: Record<string, FakePhoneNumber>;
  tokens: FakeToken[];
  /** Every request received: method and path, with the token stripped. */
  requests: LoggedRequest[];
  options: {
    /** Whether a re-POST with identical settings issues a new SIP password. */
    passwordRotatesOnRepost: boolean;
    /** Whether Meta refuses an IP literal as the SIP server hostname. */
    rejectsIpHostnames: boolean;
  };
  /** Makes every following request fail: a 5xx answer, or a thrown network error. */
  fail(mode: FailureMode): void;
  /** Answers one request, or returns "network" when fetch itself should throw. */
  handle(request: FakeRequest): FakeResponse | "network";
};

const fbtrace = () => randomBytes(8).toString("base64url");

function graphError(
  status: number,
  code: number,
  message: string,
  type = "OAuthException",
  subcode?: number
): FakeResponse {
  return {
    status,
    body: {
      error: {
        message,
        type,
        code,
        ...(subcode !== undefined ? { error_subcode: subcode } : {}),
        fbtrace_id: fbtrace()
      }
    }
  };
}

function callingNode(number: FakePhoneNumber, withCredentials: boolean) {
  const { calling } = number;
  return {
    status: calling.status,
    ...(calling.srtpKeyExchange
      ? { srtp_key_exchange_protocol: calling.srtpKeyExchange }
      : {}),
    sip: {
      status: calling.sip.status,
      ...(calling.sip.webhookDelivery
        ? { webhook_delivery: calling.sip.webhookDelivery }
        : {}),
      servers: calling.sip.servers.map((server) => ({
        hostname: server.hostname,
        port: server.port,
        ...(withCredentials && number.sipPassword
          ? { sip_user_password: number.sipPassword }
          : {})
      }))
    },
    ...(calling.additionalCodecs
      ? { audio: { additional_codecs: calling.additionalCodecs } }
      : {})
  };
}

type PostedCalling = {
  status?: "ENABLED" | "DISABLED";
  srtp_key_exchange_protocol?: "SDES" | "DTLS";
  sip?: {
    status?: "ENABLED" | "DISABLED";
    webhook_delivery?: "ENABLED" | "DISABLED";
    servers?: { hostname: string; port: number }[];
  };
  audio?: { additional_codecs?: string[] };
};

function createGraphApiFake(seed: {
  phoneNumbers: FakePhoneNumber[];
  tokens: FakeToken[];
  options?: Partial<GraphApiFake["options"]>;
}): GraphApiFake {
  let failure: FailureMode = null;

  const fake: GraphApiFake = {
    phoneNumbers: Object.fromEntries(
      seed.phoneNumbers.map((number) => [number.id, structuredClone(number)])
    ),
    tokens: seed.tokens,
    requests: [],
    options: {
      passwordRotatesOnRepost: false,
      rejectsIpHostnames: true,
      ...seed.options
    },
    fail: (mode) => {
      failure = mode;
    },
    handle: (request) => {
      const url = new URL(request.url);
      fake.requests.push({
        method: request.method.toUpperCase(),
        path: url.pathname,
        query: Object.fromEntries(url.searchParams)
      });

      if (failure === "network") return "network";
      if (failure === "5xx") {
        return graphError(500, 1, "An unknown error has occurred.");
      }

      const authorization =
        request.headers.authorization ?? request.headers.Authorization ?? "";
      const token = fake.tokens.find(
        (t) => authorization === `Bearer ${t.token}`
      );
      if (!token) {
        return graphError(
          401,
          190,
          "Invalid OAuth access token - Cannot parse access token"
        );
      }

      const match = new RegExp(
        `^/${GRAPH_API_VERSION}/(\\d+)(/settings)?$`
      ).exec(url.pathname);
      if (!match) {
        return graphError(
          400,
          100,
          `Unsupported ${request.method.toLowerCase()} request.`,
          "GraphMethodException"
        );
      }

      const [, id, settings] = match;
      const number = fake.phoneNumbers[id];
      // Graph answers the same way for a missing object and for one the token can't see
      if (!number || !token.wabaIds.includes(number.wabaId)) {
        return graphError(
          400,
          100,
          `Unsupported ${request.method.toLowerCase()} request. Object with ID '${id}' does not exist, cannot be loaded due to missing permissions, or does not support this operation.`,
          "GraphMethodException",
          33
        );
      }

      if (!settings) {
        if (request.method.toUpperCase() !== "GET") {
          return graphError(
            400,
            100,
            "Unsupported post request.",
            "GraphMethodException"
          );
        }
        return {
          status: 200,
          body: {
            verified_name: number.verifiedName,
            display_phone_number: number.displayPhoneNumber,
            code_verification_status: "VERIFIED",
            quality_rating: number.qualityRating,
            messaging_limit_tier: number.messagingLimitTier,
            id
          }
        };
      }

      if (!token.permissions.includes("whatsapp_business_management")) {
        return graphError(
          403,
          10,
          "(#10) Application does not have permission for this action"
        );
      }

      if (request.method.toUpperCase() === "GET") {
        return {
          status: 200,
          body: {
            calling: callingNode(
              number,
              url.searchParams.get("include_sip_credentials") === "true"
            )
          }
        };
      }

      const posted = (
        JSON.parse(request.body ?? "{}") as { calling?: PostedCalling }
      ).calling;
      if (!posted) {
        return graphError(
          400,
          100,
          "(#100) The parameter calling is required."
        );
      }

      const servers = posted.sip?.servers;
      if (
        fake.options.rejectsIpHostnames &&
        servers?.some((server) => net.isIP(server.hostname) !== 0)
      ) {
        return graphError(
          400,
          100,
          "(#100) Invalid parameter: hostname must be a domain name"
        );
      }

      const { calling } = number;
      if (posted.status) calling.status = posted.status;
      if (posted.srtp_key_exchange_protocol) {
        calling.srtpKeyExchange = posted.srtp_key_exchange_protocol;
      }
      if (posted.sip?.status) calling.sip.status = posted.sip.status;
      if (posted.sip?.webhook_delivery) {
        calling.sip.webhookDelivery = posted.sip.webhook_delivery;
      }
      if (servers) {
        calling.sip.servers = servers.map((server) => ({
          hostname: server.hostname,
          port: Number(server.port)
        }));
      }
      if (posted.audio?.additional_codecs) {
        calling.additionalCodecs = posted.audio.additional_codecs;
      }

      if (calling.sip.status === "ENABLED" && calling.sip.servers.length > 0) {
        if (!number.sipPassword || fake.options.passwordRotatesOnRepost) {
          number.sipPassword = randomBytes(12).toString("base64url");
        }
      } else if (calling.sip.status === "DISABLED") {
        number.sipPassword = null;
      }

      return { status: 200, body: { success: true } };
    }
  };

  return fake;
}

export {
  createGraphApiFake,
  FakeCalling,
  FakePhoneNumber,
  FakeRequest,
  FakeToken,
  GraphApiFake,
  Permission
};
