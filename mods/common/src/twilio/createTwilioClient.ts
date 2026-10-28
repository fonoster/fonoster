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
import { TwilioCredentials } from "@fonoster/types";
import { Twilio } from "twilio";
import { z } from "zod";
import { TwilioLinkError } from "./TwilioLinkError";
import { TwilioLinkOptions } from "./types";

const accountSid = z.string().regex(/^AC[0-9a-f]{32}$/);
const secret = z.string().min(1);

const credentialsSchema = z.union([
  z.object({ accountSid, authToken: secret }).strict(),
  z
    .object({
      accountSid,
      apiKeySid: z.string().regex(/^SK[0-9a-f]{32}$/),
      apiKeySecret: secret
    })
    .strict()
]);

/**
 * Builds the Twilio client only from complete credentials: with an empty username or password,
 * twilio-node falls back to TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from the environment, which
 * the apiserver sets for SMS.
 */
function createTwilioClient(
  credentials: TwilioCredentials,
  options: TwilioLinkOptions = {}
): Twilio {
  const parsed = credentialsSchema.safeParse(credentials);

  if (!parsed.success) {
    throw new TwilioLinkError(
      "INVALID_CREDENTIALS",
      "Twilio credentials are incomplete or malformed"
    );
  }

  const creds = parsed.data as TwilioCredentials;
  const [username, password] =
    "authToken" in creds
      ? [creds.accountSid, creds.authToken]
      : [creds.apiKeySid, creds.apiKeySecret];

  return new Twilio(username, password, {
    accountSid: creds.accountSid,
    httpClient: options.httpClient
  });
}

export { createTwilioClient };
