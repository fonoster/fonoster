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
import { logsSchema, telemetrySchema } from "@fonoster/common";
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
 * Call records (add-call-record): the index, the records API (ListCalls and GetCall read the
 * index), and retention. `stores` are the record stores the API reads from (the regions' and
 * any workspace buckets), matched by the location in each index entry.
 */
const callRecordsSchema = z
  .object({
    enabled: z.boolean().default(true),
    stores: z.array(recordStoreSchema).default([]),
    retentionIntervalMinutes: z.number().int().positive().default(60),
    maintenanceTimeoutMs: z.number().int().positive().default(30000)
  })
  .default({});

/**
 * Session apps (voice-session G2): the hosted Autopilot that Autopilot apps point at, and the
 * secret AppBridge signs their sessions with (the hosted Autopilot verifies one secret for every
 * Autopilot app). Without `signingSecret` each Autopilot app gets its own random secret.
 */
const sessionAppsSchema = z
  .object({
    autopilotUrl: z.string().min(1).default("ws://autopilot:50061"),
    autopilotSigningSecret: z.string().min(1).optional(),
    /** Plain http:// webhook endpoints (local testing only). */
    allowInsecureWebhooks: z.boolean().default(false),
    /**
     * Private hosts, IPs or CIDRs app and listener URLs may use (self-hosting); default
     * FONOSTER_ALLOWED_DESTINATIONS.
     */
    allowedDestinations: z.array(z.string().min(1)).optional()
  })
  .default({});

/**
 * The provider catalog file (add-self-host-installer D7): applied to the registry tables on
 * every start with `fonoster-registry apply --store database` semantics. Listed entries are added
 * or updated; entries not in the file (operator-added) are kept. Absent: nothing is applied.
 *
 * `files` are applied after `file`, in order (a stack's own catalogs, such as the fakes'
 * mods/conformance/fakes.catalog.yaml in dev and test stacks).
 */
const catalogSchema = z
  .object({
    file: z.string().min(1),
    files: z.array(z.string().min(1)).optional()
  })
  .optional();

/**
 * Agent evaluations (EvaluateIntelligence): platform model keys by credentialRef, used when a
 * workspace has no key of its own for the provider. Values take `secret://` references (D8).
 */
const evaluationsSchema = z
  .object({ credentials: z.record(z.string().min(1)).default({}) })
  .default({});

/**
 * Workspace webhooks fan-out (add-workspace-webhooks 2.2): events producers publish on the bus
 * (`webhooks.events`) are delivered from here.
 */
const webhooksSchema = z
  .object({
    fanout: z.boolean().default(true),
    intervalMs: z.number().int().positive().default(1000),
    refreshMs: z.number().int().positive().default(10000)
  })
  .default({});

/**
 * Regions (add-private-regions). Public regions come from data (PR-10); private regions need the
 * region-signing key (ES256 PEM) and the region hub (NATS in operator mode, RG-B2), both generated
 * by `fonoster-region-hub-setup`. Without them, workspaces can only pick a public region.
 */
const regionsSchema = z
  .object({
    public: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          name: z.string().min(1),
          default: z.boolean().optional(),
          /** Where carriers and softphones reach this region (contract §3a). */
          endpoints: z
            .object({
              sip: z
                .array(
                  z.object({
                    host: z.string().min(1),
                    // coerce: usually "${SIP_PORT}", a string until resolved.
                    port: z.coerce.number().int().min(1).max(65535),
                    transport: z.enum(["udp", "tcp", "tls", "ws", "wss"])
                  })
                )
                .default([]),
              signalingAddresses: z.array(z.string().min(1)).default([]),
              mediaAddresses: z.array(z.string().min(1)).default([]),
              rtpPorts: z
                .object({
                  min: z.coerce.number().int().min(1).max(65535),
                  max: z.coerce.number().int().min(1).max(65535)
                })
                .optional()
            })
            .optional()
        })
      )
      .min(1)
      .default([{ id: "default", name: "Default", default: true }]),
    /**
     * The operator key (PR-19): the only credential of the region admin API (create, list,
     * publish, revoke public regions). `secret://` references are resolved. Absent: admin API off.
     */
    operatorKey: z.string().min(16).optional(),
    /** The flat monthly fee per private region (PR-11), shown when billing is on. */
    privateRegionMonthlyFeeCents: z.number().int().nonnegative().optional(),
    /** `cp` in enrollment tokens. Defaults to appUrl. */
    controlPlaneUrl: z.string().min(1).optional(),
    /** `leaf` in enrollment tokens. Defaults to tls://<domain>:7422. */
    leafUrl: z.string().min(1).optional(),
    /** Allows a plain nats:// leaf URL (local stacks only). */
    allowInsecureLeaf: z.boolean().default(false),
    signingKey: z
      .object({ file: z.string().min(1), kid: z.string().min(1).optional() })
      .optional(),
    hub: z
      .object({
        url: z.string().min(1),
        credentialsFile: z.string().min(1),
        systemCredentialsFile: z.string().min(1),
        operatorSeedFile: z.string().min(1),
        accountSeedFile: z.string().min(1)
      })
      .optional(),
    relay: z
      .object({
        firstChunkTimeoutMs: z.number().int().positive().default(5000),
        idleTimeoutMs: z.number().int().positive().default(10000),
        maxBytes: z
          .number()
          .int()
          .positive()
          .default(256 * 1024 * 1024),
        /** Relays in flight per region (HTTP 429 beyond). */
        maxConcurrent: z.number().int().positive().default(8)
      })
      .default({}),
    /** The release cells are measured against (default: this apiserver's version). */
    currentVersion: z.string().optional(),
    configDebounceMs: z.number().int().nonnegative().default(500)
  })
  .default({});

/** fonoster.yaml: everything the API server (and embedded Identity) needs. */
const fonosterConfigSchema = z
  .object({
    /** Public hostname. Sets the defaults for appUrl, signalingServer and the SIP root domain. */
    domain: z.string().min(1),
    /** Links in emails. Defaults to https://<domain>. */
    appUrl: z.string().min(1).optional(),
    /** Browser test calls: SIP over WebSocket. Defaults to ws(s)://<appUrl host>/sip. */
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
    /** OTLP export (empty = off): `otlpEndpoint: "${OTEL_EXPORTER_OTLP_ENDPOINT:-}"`. */
    telemetry: telemetrySchema,
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
    routr: z
      .object({
        apiEndpoint: z.string().default("routr:51907"),
        /**
         * host:port of Routr's SIP listener: API-originated calls are dialed through it
         * (CreateCall's to.proxy), as the roomr peer below (to.auth).
         */
        sipProxy: z.string().default("routr:5060"),
        /**
         * The peer Go Roomr nodes register under (least-sessions, add-roomr 4.1). Without a
         * password the apiserver does not create it.
         */
        roomrPeer: z
          .object({
            aor: z.string().default("sip:roomr@default"),
            name: z.string().default("Roomr nodes"),
            username: z.string().default("roomr"),
            password: z.string().optional()
          })
          .default({})
      })
      .default({}),
    // user/password: the apiserver's NATS user when the server has per-service users
    // (add-platform 4.1); password is usually a secret:// reference.
    nats: z.object({
      url: z.string().min(1),
      user: z.string().min(1).optional(),
      password: z.string().min(1).optional()
    }),
    evaluations: evaluationsSchema,
    templatesDir: z.string().optional(),
    twilio: twilioSchema.optional(),
    identity: identitySectionSchema,
    callRecords: callRecordsSchema,
    apps: sessionAppsSchema,
    webhooks: webhooksSchema,
    catalog: catalogSchema,
    regions: regionsSchema
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

    // PR-17: the default public region's id is always `default`.
    const publicRegions = config.regions.public;
    const dflt = publicRegions.find((r) => r.default) ?? publicRegions[0];
    if (dflt && dflt.id !== "default") {
      ctx.addIssue({
        code: "custom",
        path: ["regions", "public"],
        message:
          "the default public region's id must be `default` (put the geography in its name)"
      });
    }

    const leaf = config.regions.leafUrl;
    if (
      leaf &&
      !leaf.startsWith("tls://") &&
      !config.regions.allowInsecureLeaf
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["regions", "leafUrl"],
        message: "must be tls:// unless regions.allowInsecureLeaf is true"
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
/**
 * Where `${VAR}` may appear: every key (unify-config-placeholders). Secrets stay in `.env` and
 * reach the container through Compose's env_file.
 */
const SHARED_VALUE_PATHS = ["*"];

export {
  featuresSchema,
  fonosterConfigSchema,
  FonosterConfig,
  SHARED_VALUE_PATHS
};
