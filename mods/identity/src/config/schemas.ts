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
import { z } from "zod";

const DEFAULT_PRIVATE_KEY_PATH = "/opt/fonoster/keys/private.pem";
const DEFAULT_PUBLIC_KEY_PATH = "/opt/fonoster/keys/public.pem";

/** RS256 keys, inline or by path. Paths default to the container mount. */
const keysSchema = z
  .object({
    privateKey: z.string().optional(),
    publicKey: z.string().optional(),
    privateKeyPath: z.string().optional(),
    publicKeyPath: z.string().optional()
  })
  .prefault({})
  .transform((keys) => ({
    privateKey: keys.privateKey,
    publicKey: keys.publicKey,
    privateKeyPath:
      keys.privateKey === undefined
        ? (keys.privateKeyPath ?? DEFAULT_PRIVATE_KEY_PATH)
        : undefined,
    publicKeyPath:
      keys.publicKey === undefined
        ? (keys.publicKeyPath ?? DEFAULT_PUBLIC_KEY_PATH)
        : undefined
  }));

/**
 * Key for the encrypted database fields (prisma-field-encryption / cloak):
 * `k1.aesgcm256.<base64url of 32 bytes>`. Generate one with
 * `npx @47ng/cloak generate`. The pattern is cloak's own `cloakKeyRegex`
 * (@47ng/cloak 1.x): base64url (`-` and `_`, never `+` or `/`), 43 characters,
 * optional `=` padding. A key that fails it would crash at startup with
 * "Unknown key format", so it is rejected here instead.
 */
const CLOAK_KEY_REGEX = /^k1\.aesgcm256\.[A-Za-z0-9_-]{43}=?$/;

const encryptionKeySchema = z.string().regex(CLOAK_KEY_REGEX, {
  message:
    'must look like "k1.aesgcm256.<43 base64url characters>" (A-Z a-z 0-9 - _, no + or /); generate one with `npx @47ng/cloak generate`'
});

/** Outgoing email. Optional: without it, anything that sends email fails clearly. */
const smtpSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive().default(587),
  secure: z.boolean().default(false),
  sender: z.string().min(1),
  user: z.string().default(""),
  password: z.string().default("")
});

/** SMS for phone verification. */
const twilioSchema = z.object({
  phoneNumber: z.string().min(1),
  accountSid: z.string().min(1),
  authToken: z.string().min(1)
});

/** How people sign in and who may create an account. Community defaults. */
const authFeaturesSchema = z
  .object({
    methods: z
      .array(z.enum(["password", "email_code", "github"]))
      .nonempty()
      .default(["password"]),
    signup: z.enum(["invite", "open"]).default("invite")
  })
  .prefault({});

const tokensSchema = z
  .object({
    accessTokenExpiresIn: z.string().default("15m"),
    idTokenExpiresIn: z.string().default("15m"),
    refreshTokenExpiresIn: z.string().default("24h")
  })
  .prefault({});

const securitySchema = z
  .object({
    contactVerificationRequired: z.boolean().default(false),
    twoFactorAuthenticationRequired: z.boolean().default(false)
  })
  .prefault({});

const invitesSchema = z
  .object({
    /** Defaults to <appUrl>/invites. */
    url: z.string().optional(),
    /** Defaults to <appUrl>/invites/failed. */
    failUrl: z.string().optional(),
    expiration: z.string().default("1d")
  })
  .prefault({});

const oauth2Schema = z
  .object({
    github: z.object({
      clientId: z.string().min(1),
      clientSecret: z.string().min(1),
      /** Where users authorize and codes are exchanged. Change only for tests (a fake GitHub). */
      url: z
        .string()
        .url()
        .default("https://github.com")
        .transform((v) => v.replace(/\/+$/, "")),
      /** GitHub's REST API, for the user and their emails. */
      apiUrl: z
        .string()
        .url()
        .default("https://api.github.com")
        .transform((v) => v.replace(/\/+$/, ""))
    })
  })
  .optional();

/** First admin, created on first boot. */
const ownerSchema = z
  .object({
    name: z.string().default("Admin"),
    email: z.string().email(),
    password: z.string().min(8)
  })
  .optional();

/**
 * fonoster.yaml's `identity:` section. Standalone Identity's identity.json has
 * the same fields at its root (see server/config.ts).
 */
const identitySectionSchema = z
  .object({
    /** Defaults to the top-level database. */
    database: z.object({ url: z.string().min(1) }).optional(),
    /** Defaults to the app URL. */
    issuer: z.string().min(1).optional(),
    audience: z.string().min(1).default("api"),
    keys: keysSchema,
    tokens: tokensSchema,
    security: securitySchema,
    invites: invitesSchema,
    oauth2: oauth2Schema
  })
  .prefault({});

type IdentitySection = z.infer<typeof identitySectionSchema>;
type SmtpConfigSection = z.infer<typeof smtpSchema>;
type TwilioConfigSection = z.infer<typeof twilioSchema>;
type AuthFeatures = z.infer<typeof authFeaturesSchema>;

export {
  authFeaturesSchema,
  encryptionKeySchema,
  invitesSchema,
  oauth2Schema,
  ownerSchema,
  securitySchema,
  tokensSchema,
  AuthFeatures,
  identitySectionSchema,
  IdentitySection,
  keysSchema,
  smtpSchema,
  SmtpConfigSection,
  twilioSchema,
  TwilioConfigSection
};
