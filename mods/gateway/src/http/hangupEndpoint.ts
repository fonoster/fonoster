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
export function createHangupHandler(
  credentials: { accountSid: string; authToken: string },
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
    const [user, pass] = Buffer.from(auth.replace(/^Basic /, ""), "base64")
      .toString()
      .split(":");
    if (
      !auth.startsWith("Basic ") ||
      !sameText(user ?? "", credentials.accountSid) ||
      !sameText(pass ?? "", credentials.authToken) ||
      accountSid !== credentials.accountSid
    ) {
      return twilioError(res, 401, 20003, "Authenticate");
    }

    const form = await readForm(req);
    if (form.get("Status") !== "completed") {
      return twilioError(res, 400, 21218, "Only Status=completed is supported");
    }

    try {
      await nc.request(
        `gateway.calls.${callSid}`,
        sc.encode(JSON.stringify({ type: "hangup" })),
        { timeout: 2000 }
      );
    } catch {
      // No replica owns the call: it has already ended.
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
