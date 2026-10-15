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
import { logsSchema } from "@fonoster/common";
import {
  authFeaturesSchema,
  encryptionKeySchema,
  identitySectionSchema,
  smtpSchema,
  twilioSchema
} from "@fonoster/identity";
import { z } from "zod";

/** Product features. Code checks these, never an edition. Community defaults. */
const featuresSchema = z
  .object({
    auth: authFeaturesSchema,
    billing: z.object({ enabled: z.boolean().default(false) }).default({}),
    costs: z
      .object({ display: z.enum(["none", "usage", "prices"]).default("usage") })
      .default({}),
    calls: z
      .object({
        transcripts: z
          .object({
            store: z.boolean().default(true),
            retentionDays: z.number().int().positive().default(30)
          })
          .default({}),
        recordings: z.object({ store: z.boolean().default(false) }).default({})
      })
      .default({})
  })
  .default({});

/** Where call records live (add-call-record): a directory, or S3-compatible storage. */
const recordStoreSchema = z.union([
  z.object({ dir: z.string().min(1) }),
  z.object({
    s3: z.object({
      bucket: z.string().min(1),
      prefix: z.string().optional(),
      region: z.string().optional(),
      endpoint: z.string().optional(),
      forcePathStyle: z.boolean().optional(),
      credentials: z
        .object({
          accessKeyId: z.string().min(1),
          secretAccessKey: z.string().min(1)
        })
        .optional()
    })
  })
]);

/**
 * Call records (add-call-record): the index, the records API, retention, and ListCalls from the
 * index instead of InfluxDB. `stores` are the record stores the API reads from (the regions' and
 * any workspace buckets), matched by the location in each index entry.
 */
const callRecordsSchema = z
  .object({
    enabled: z.boolean().default(true),
    listCallsFromIndex: z.boolean().default(true),
    stores: z.array(recordStoreSchema).default([]),
    retentionIntervalMinutes: z.number().int().positive().default(60),
    maintenanceTimeoutMs: z.number().int().positive().default(30000)
  })
  .default({});

/**
 * Session apps (voice-session G2): the hosted Autopilot that Autopilot apps point at, and the
 * secret the gateway signs their sessions with (the hosted Autopilot verifies one secret for every
 * Autopilot app). Without `signingSecret` each Autopilot app gets its own random secret.
 */
const sessionAppsSchema = z
  .object({
    autopilotUrl: z.string().min(1).default("ws://autopilot:50061"),
    autopilotSigningSecret: z.string().min(1).optional(),
    /** Plain http:// webhook endpoints (local testing only). */
    allowInsecureWebhooks: z.boolean().default(false)
  })
  .default({});

/** fonoster.yaml: everything the API server (and embedded Identity) needs. */
const fonosterConfigSchema = z
  .object({
    /** Public hostname. Sets the defaults for appUrl, signalingServer and the SIP root domain. */
    domain: z.string().min(1),
    /** Links in emails. Defaults to https://<domain>. */
    appUrl: z.string().min(1).optional(),
    /** Browser test calls (WebRTC). Defaults to wss://<domain>:5062. */
    signalingServer: z.string().min(1).optional(),
    server: z
      .object({
        bindAddr: z.string().default("0.0.0.0:50051"),
        httpBridgePort: z.number().int().positive().default(9876),
        /** How other services reach this one. */
        host: z.string().default("apiserver")
      })
      .default({}),
    logs: logsSchema,
    database: z.object({ url: z.string().min(1) }),
    encryption: z.object({ key: encryptionKeySchema }),
    smtp: smtpSchema.optional(),
    authz: z
      .object({
        enabled: z.boolean().default(false),
        host: z.string().min(1).optional(),
        port: z.number().int().positive().default(50071),
        methods: z
          .array(z.string().min(1))
          .default(["/fonoster.calls.v1beta2.Calls/CreateCall"])
      })
      .default({}),
    features: featuresSchema,
    mediaService: z.object({
      provider: z.literal("asterisk").default("asterisk"),
      asterisk: z.object({
        ariUrl: z.string().min(1),
        ariUsername: z.string().min(1),
        ariPassword: z.string().min(1),
        systemDomain: z.string().default("sip.invalid")
      })
    }),
    amd: z
      .object({
        enabled: z.boolean().default(false),
        engine: z.enum(["native", "ml"]).default("native"),
        mode: z.enum(["compact", "full"]).default("compact")
      })
      .default({}),
    routr: z
      .object({
        apiEndpoint: z.string().default("routr:51907"),
        defaultPeer: z
          .object({
            aor: z.string().default("sip:voice@default"),
            name: z.string().default("Voice Server"),
            username: z.string().default("voice"),
            password: z.string().default("changeme")
          })
          .default({}),
        /**
         * The peer Go media nodes register under (least-sessions, add-media-node 4.1). Without a
         * password the apiserver does not create it.
         */
        mediaNodePeer: z
          .object({
            aor: z.string().default("sip:medianode@default"),
            name: z.string().default("Media Nodes"),
            username: z.string().default("medianode"),
            password: z.string().optional()
          })
          .default({}),
        /**
         * Which voice stack answers app-linked numbers during the cutover: `asterisk` (the default
         * peer) or `rebuild` (the media-node peer). Per-number pins win over app lists.
         */
        engines: z
          .object({
            default: z.enum(["asterisk", "rebuild"]).default("asterisk"),
            rebuildApps: z.array(z.string()).default([]),
            asteriskApps: z.array(z.string()).default([]),
            numbers: z
              .record(z.string(), z.enum(["asterisk", "rebuild"]))
              .default({})
          })
          .default({})
      })
      .default({}),
    nats: z.object({ url: z.string().min(1) }),
    influxdb: z.object({
      url: z.string().min(1),
      org: z.string().min(1),
      username: z.string().min(1),
      password: z.string().min(1),
      token: z.string().min(1)
    }),
    integrationsFile: z.string().default("/opt/fonoster/integrations.json"),
    templatesDir: z.string().optional(),
    audioFilters: z
      .object({
        aiCoustics: z
          .object({ license: z.string().min(1).optional() })
          .default({})
      })
      .default({}),
    twilio: twilioSchema.optional(),
    identity: identitySectionSchema,
    callRecords: callRecordsSchema,
    apps: sessionAppsSchema
  })
  .superRefine((config, ctx) => {
    if (config.authz.enabled && !config.authz.host) {
      ctx.addIssue({
        code: "custom",
        path: ["authz", "host"],
        message: "required when authz.enabled is true"
      });
    }

    if (config.features.billing.enabled && !config.authz.enabled) {
      ctx.addIssue({
        code: "custom",
        path: ["features", "billing", "enabled"],
        message: "billing needs the authorization service (authz.enabled)"
      });
    }

    if (
      config.features.auth.methods.includes("github") &&
      !config.identity.oauth2?.github
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["identity", "oauth2", "github"],
        message: "required when features.auth.methods includes github"
      });
    }

    const { security } = config.identity;
    if (
      (security.contactVerificationRequired ||
        security.twoFactorAuthenticationRequired) &&
      !config.twilio
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["twilio"],
        message:
          "required when contact verification or two-factor authentication is on"
      });
    }
  });

type FonosterConfig = z.infer<typeof fonosterConfigSchema>;

/** Paths where ${VAR} may reference a value shared with another container. */
const SHARED_VALUE_PATHS = [
  "database.url",
  "identity.database.url",
  "influxdb.*",
  "mediaService.asterisk.ariUsername",
  "mediaService.asterisk.ariPassword",
  "routr.defaultPeer.username",
  "routr.defaultPeer.password",
  "routr.mediaNodePeer.username",
  "routr.mediaNodePeer.password"
];

/** Keys people may carry over from identity.json or older drafts. */
const MOVED_KEYS = {
  encryptionKey: "encryption.key",
  defaultUser: "identity.owner",
  invite: "identity.invites",
  issuer: "identity.issuer",
  audience: "identity.audience",
  keys: "identity.keys",
  tokens: "identity.tokens",
  oauth2: "identity.oauth2",
  "smtp.auth": "smtp.user and smtp.password",
  owner: "identity.owner"
};

export {
  featuresSchema,
  fonosterConfigSchema,
  FonosterConfig,
  MOVED_KEYS,
  SHARED_VALUE_PATHS
};
