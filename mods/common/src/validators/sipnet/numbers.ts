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
import isISO31661Alpha2 from "validator/lib/isISO31661Alpha2";
import { z } from "zod";
import { nameSchema } from "../common";

const sipUriRegex = /^sip:[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+$/;
const sipUriSchema = z.string().regex(sipUriRegex, "Invalid SIP URI");

const countryIsoCodeSchema = z.string().refine((val) => isISO31661Alpha2(val), {
  message: "Invalid country ISO code"
});

const createNumberRequestSchema = z
  .object({
    name: nameSchema,
    telUrl: z.string(),
    city: z.string(),
    country: z.string(),
    agentAor: sipUriSchema.optional(),
    appRef: z.string().optional(),
    countryIsoCode: countryIsoCodeSchema
  })
  .refine(
    ({ agentAor, appRef }) => !(agentAor !== undefined && appRef !== undefined),
    {
      message:
        "You can only provide one of the following fields: 'agentAor' or 'appRef'"
    }
  );

const updateNumberRequestSchema = z
  .object({
    name: nameSchema.optional(),
    agentAor: sipUriSchema.optional(),
    appRef: z.string().optional()
  })
  .refine(
    ({ agentAor, appRef }) => !(agentAor !== undefined && appRef !== undefined),
    {
      message:
        "You can only provide one of the following fields: 'agentAor' or 'appRef'"
    }
  );

const twilioCredentialsSchema = z
  .object({
    accountSid: z
      .string()
      .regex(/^AC[0-9a-f]{32}$/, "Invalid Twilio Account SID"),
    authToken: z.string().min(1, "Value required").optional(),
    apiKeySid: z
      .string()
      .regex(/^SK[0-9a-f]{32}$/, "Invalid Twilio API key SID")
      .optional(),
    apiKeySecret: z.string().min(1, "Value required").optional()
  })
  .refine(
    ({ authToken, apiKeySid, apiKeySecret }) =>
      authToken !== undefined
        ? apiKeySid === undefined && apiKeySecret === undefined
        : apiKeySid !== undefined && apiKeySecret !== undefined,
    {
      message:
        "Provide either 'authToken' or both 'apiKeySid' and 'apiKeySecret'"
    }
  );

const linkTwilioRequestSchema = z
  .object({
    phoneNumber: z
      .string()
      .regex(/^\+[1-9]\d{1,14}$/, "Must be an E.164 number"),
    name: nameSchema.optional(),
    credentials: twilioCredentialsSchema,
    agentAor: sipUriSchema.optional(),
    appRef: z.string().optional()
  })
  .refine(
    ({ agentAor, appRef }) => !(agentAor !== undefined && appRef !== undefined),
    {
      message:
        "You can only provide one of the following fields: 'agentAor' or 'appRef'"
    }
  );

// Meta's SIP password travels in a digest header; whitespace or a control character would break it
const sipPasswordSchema = z
  .string()
  .min(1)
  .max(128)
  .refine(
    (value) =>
      !/\s/.test(value) &&
      [...value].every((char) => {
        const code = char.charCodeAt(0);
        return code > 31 && code !== 127;
      }),
    { message: "The SIP password can't contain spaces or control characters" }
  );

const E164 = /^\+[1-9]\d{1,14}$/;

/**
 * Two shapes: `{ phoneNumberId, accessToken }` (Fonoster configures Meta) or `{ phoneNumber,
 * sipPassword? }` (the caller does). gRPC sends an absent string as "", so empty counts as absent.
 */
const linkWhatsAppRequestSchema = z
  .object({
    phoneNumber: z.string().optional(),
    sipPassword: sipPasswordSchema.optional(),
    phoneNumberId: z.string().optional(),
    accessToken: z.string().optional(),
    name: nameSchema.optional(),
    agentAor: sipUriSchema.optional(),
    appRef: z.string().optional()
  })
  .refine(
    ({ agentAor, appRef }) => !(agentAor !== undefined && appRef !== undefined),
    {
      message:
        "You can only provide one of the following fields: 'agentAor' or 'appRef'"
    }
  )
  .superRefine((request, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

    if (request.accessToken) {
      if (/\s/.test(request.accessToken)) {
        issue("accessToken", "Must be a Meta access token");
      }
      if (!/^\d{5,32}$/.test(request.phoneNumberId ?? "")) {
        issue("phoneNumberId", "Must be Meta's id of the phone number");
      }
      if (request.sipPassword) {
        issue(
          "sipPassword",
          "Not allowed with an access token: Meta supplies the SIP password"
        );
      }
      return;
    }
    if (request.phoneNumberId) {
      issue("accessToken", "Required with a phone number id");
    }
    if (!E164.test(request.phoneNumber ?? "")) {
      issue("phoneNumber", "Must be an E.164 number");
    }
  });

export {
  createNumberRequestSchema,
  linkTwilioRequestSchema,
  linkWhatsAppRequestSchema,
  updateNumberRequestSchema
};
