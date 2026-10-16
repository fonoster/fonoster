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
import { timingSafeEqual } from "crypto";
import * as http from "http";
import { URLSearchParams } from "url";
import { NatsConnection, StringCodec } from "nats";

const sc = StringCodec();
const PATH = /^\/2010-04-01\/Accounts\/([^/]+)\/Calls\/([^/]+)\.json$/;

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function twilioError(
  res: http.ServerResponse,
  status: number,
  code: number,
  message: string
) {
  json(res, status, {
    code,
    message,
    more_info: `https://www.twilio.com/docs/errors/${code}`,
    status
  });
}

function sameText(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

async function readForm(req: http.IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return new URLSearchParams(Buffer.concat(chunks).toString());
}

/**
 * twilio-media-streams-flavor, "Hanging up from a Twilio-flavor app":
 * POST /2010-04-01/Accounts/{accountSid}/Calls/{callSid}.json with Status=completed and HTTP Basic
 * auth. The request is forwarded over NATS to whichever gateway replica owns the call.
 */
/**
 * Checks Basic credentials for an account (workspace). Returns true when the key pair belongs to
 * that account.
 */
export type HangupAuthenticator = (
  accountSid: string,
  user: string,
  secret: string
) => Promise<boolean>;

/** One operator-set pair (self-hosting fallback). */
export function configPairAuthenticator(credentials: {
  accountSid: string;
  authToken: string;
}): HangupAuthenticator {
  return async (accountSid, user, secret) =>
    sameText(user, credentials.accountSid) &&
    sameText(secret, credentials.authToken) &&
    accountSid === credentials.accountSid;
}

/**
 * Workspace API keys checked by Identity (owner decision): the URL's AccountSid is the workspace's
 * access key id and Basic auth carries one of its API keys. Identity's ExchangeApiKey verifies the
 * pair and its access token names the workspaces the key may act on.
 */
export function identityAuthenticator(identity: {
  exchangeApiKey(
    accessKeyId: string,
    accessKeySecret: string
  ): Promise<{ accessToken: string }>;
}): HangupAuthenticator {
  return async (accountSid, user, secret) => {
    try {
      const { accessToken } = await identity.exchangeApiKey(user, secret);
      // The token comes straight from Identity in answer to these credentials; reading its claims
      // is enough here (the endpoint does not accept tokens from callers).
      const claims = JSON.parse(
        Buffer.from(accessToken.split(".")[1] ?? "", "base64url").toString()
      );
      return (claims.access ?? []).some(
        (a: { accessKeyId?: string }) => a.accessKeyId === accountSid
      );
    } catch {
      return false;
    }
  };
}

export function createHangupHandler(
  authenticate: HangupAuthenticator,
  nc: NatsConnection
): http.RequestListener {
  return async (req, res) => {
    const match = PATH.exec(req.url?.split("?")[0] ?? "");
    if (req.method !== "POST" || !match)
      return twilioError(
        res,
        404,
        20404,
        "The requested resource was not found"
      );

    const [, accountSid, callSid] = match;
    const auth = req.headers.authorization ?? "";
    const [user = "", pass = ""] = Buffer.from(
      auth.replace(/^Basic /, ""),
      "base64"
    )
      .toString()
      .split(":");
    if (
      !auth.startsWith("Basic ") ||
      !(await authenticate(accountSid, user, pass))
    ) {
      return twilioError(res, 401, 20003, "Authenticate");
    }

    const form = await readForm(req);
    if (form.get("Status") !== "completed") {
      return twilioError(res, 400, 21218, "Only Status=completed is supported");
    }

    let owned = false;
    try {
      const reply = await nc.request(
        `gateway.calls.${callSid}`,
        sc.encode(JSON.stringify({ type: "hangup", accountSid })),
        { timeout: 2000 }
      );
      owned = JSON.parse(sc.decode(reply.data)).type === "ack";
    } catch {
      owned = false;
    }
    // No replica owns the call (it ended), or it belongs to another workspace: same answer.
    if (!owned) {
      return twilioError(
        res,
        404,
        20404,
        `The requested resource /2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json was not found`
      );
    }
    json(res, 200, {
      sid: callSid,
      account_sid: accountSid,
      status: "completed"
    });
  };
}
