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
/**
 * The API server's settings, as constants. They come from fonoster.yaml (see
 * ./config), loaded once on first import; the names are kept from the
 * env-var era so modules that import them didn't change.
 */
import { natsConnectOptions } from "@fonoster/common";
import {
  getAppUrl,
  getConfig,
  getIdentityConfig,
  getSignalingServer
} from "./config";

const config = getConfig();
const identity = getIdentityConfig();

export const APISERVER_BIND_ADDR = config.server.bindAddr;

export const APISERVER_HOST = config.server.host;

export const APISERVER_SIGNALING_SERVER = getSignalingServer(config);

// Frontend configurations
export const APP_URL = getAppUrl(config);

export const CALLS_CREATE_SUBJECT = "calls.create";

/**
 * A call's status events, keyed by the call (TrackCall on any replica subscribes to them all):
 * TRYING and FAILED from the control plane that places the call, and the media node's
 * call.progress, call.answered and room.ended for the call's room.
 */
export const callEventsSubject = (ref: string) => `calls.${ref}.events`;

/** Every call's status events (TrackCall's subscription). */
export const CALL_EVENTS_WILDCARD = "calls.*.events";

// Other configurations
export const CLOAK_ENCRYPTION_KEY = config.encryption.key;

export const DATABASE_URL = config.database.url;

export const DEFAULT_NATS_QUEUE_GROUP = "apiserver";

export const HTTP_BRIDGE_PORT = config.server.httpBridgePort;

// Identity configurations (from the identity: section)
export const IDENTITY_ACCESS_TOKEN_EXPIRES_IN = identity.accessTokenExpiresIn;

export const IDENTITY_AUDIENCE = identity.audience;

export const IDENTITY_ID_TOKEN_EXPIRES_IN = identity.idTokenExpiresIn;

export const IDENTITY_ISSUER = identity.issuer;

export const IDENTITY_CONTACT_VERIFICATION_REQUIRED =
  identity.contactVerificationRequired;

export const IDENTITY_TWO_FACTOR_AUTHENTICATION_REQUIRED =
  identity.twoFactorAuthenticationRequired;

export const IDENTITY_OAUTH2_GITHUB_ENABLED =
  config.features.auth.methods.includes("github");

export const IDENTITY_OAUTH2_GITHUB_CLIENT_ID =
  identity.githubOauth2Config?.clientId;

export const IDENTITY_OAUTH2_GITHUB_CLIENT_SECRET =
  identity.githubOauth2Config?.clientSecret;

export const IDENTITY_PRIVATE_KEY = identity.privateKey;

export const IDENTITY_PUBLIC_KEY = identity.publicKey;

export const IDENTITY_REFRESH_TOKEN_EXPIRES_IN = identity.refreshTokenExpiresIn;

export const IDENTITY_WORKSPACE_INVITE_FAIL_URL =
  identity.workspaceInviteFailUrl;

export const IDENTITY_WORKSPACE_INVITE_EXPIRATION =
  identity.workspaceInviteExpiration;

export const IDENTITY_WORKSPACE_INVITE_URL = identity.workspaceInviteUrl;

export const IDENTITY_DATABASE_URL = identity.dbUrl;

// Authz configurations
export const AUTHZ_SERVICE_ENABLED = config.authz.enabled;
export const AUTHZ_SERVICE_HOST = config.authz.host;
export const AUTHZ_SERVICE_PORT = config.authz.port;
export const AUTHZ_SERVICE_METHODS = config.authz.methods;

// InfluxDB configurations
export const INFLUXDB_ORG = config.influxdb.org;

export const INFLUXDB_PASSWORD = config.influxdb.password;

export const INFLUXDB_TOKEN = config.influxdb.token;

export const INFLUXDB_URL = config.influxdb.url;

export const INFLUXDB_USERNAME = config.influxdb.username;

// Platform model keys for assistant evaluations, by credentialRef (rework-autopilot 8.2).
export const EVALUATIONS = config.evaluations;

export const NATS_URL = config.nats.url;

/** The `nats` setting itself (URL, user, password), for helpers that take a NatsTarget. */
export const NATS_CONNECTION = config.nats;

/** nats.js connect options: the URL plus the apiserver's NATS user, when set (add-platform 4.1). */
export const NATS = natsConnectOptions(config.nats);

// Default owner (if identity.owner is set, the system creates a user and a workspace)
export const OWNER_EMAIL = config.identity.owner?.email;

export const OWNER_NAME = config.identity.owner?.name ?? "Admin";

export const OWNER_PASSWORD = config.identity.owner?.password;

export const ROUTR_API_ENDPOINT = config.routr.apiEndpoint;

// The media-node peer every app-linked number points at (add-media-node 4.1)
export const ROUTR_MEDIA_NODE_PEER = config.routr.mediaNodePeer;

// SMTP configurations (optional; email features fail clearly without it)
export const SMTP_AUTH_PASS = config.smtp?.password;

export const SMTP_AUTH_USER = config.smtp?.user;

export const SMTP_HOST = config.smtp?.host;

export const SMTP_PORT = config.smtp?.port ?? 587;

export const SMTP_SECURE = config.smtp?.secure ?? false;

export const SMTP_SENDER = config.smtp?.sender;

// Custom templates
export const TEMPLATES_DIR = config.templatesDir;

// Twilio configurations
export const TWILIO_ACCOUNT_SID = config.twilio?.accountSid;

export const TWILIO_AUTH_TOKEN = config.twilio?.authToken;

export const TWILIO_PHONE_NUMBER = config.twilio?.phoneNumber;

// Call records (add-call-record): index, records API, retention, ListCalls from the index.
export const CALL_RECORDS = config.callRecords;

// Session apps (rebuild: control): hosted Autopilot URL and signing secret, webhook URL policy
export const SESSION_APPS = config.apps;
export const WEBHOOKS = config.webhooks;
export const REGISTRY = config.registry;

// Regions (add-private-regions): public regions, the region-signing key and the region hub
export const REGIONS = config.regions;

export const DOMAIN = config.domain;
