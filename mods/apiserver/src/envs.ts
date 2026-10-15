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

/** `none`: no Asterisk; ARI and the ARI call manager are not started. */
export const MEDIA_SERVICE_PROVIDER = config.mediaService.provider;

export const ASTERISK_ARI_PROXY_URL = config.mediaService.asterisk.ariUrl;

export const ASTERISK_ARI_SECRET = config.mediaService.asterisk.ariPassword;

export const ASTERISK_ARI_USERNAME = config.mediaService.asterisk.ariUsername;

export const ASTERISK_SYSTEM_DOMAIN = config.mediaService.asterisk.systemDomain;

export const ASTERISK_TRUNK = "routr";

export const CALLS_CREATE_SUBJECT = "calls.create";

export const CALLS_TRACK_CALL_SUBJECT = "calls.track";

// Answering Machine Detection (AMD) configuration
//
// When enabled, outbound calls run Asterisk's AMD() application in the dialplan
// before entering Stasis, and its verdict is attached to the session request as
// `amd`. Thresholds live in the media server's amd.conf, not here. Disabled by
// default: when on, the caller hears silence for up to amd.conf's
// total_analysis_time before the voice application is dispatched.
export const AMD_ENABLED = config.amd.enabled;

// Which detector runs behind AMD_ENABLED: Asterisk's native AMD() heuristic
// ("native", the default) or the amd sidecar's ONNX classifier ("ml"),
// selected by asterisk/config/extensions.conf's AMD_ENGINE gate. Either way
// the verdict lands in the same AMDSTATUS/AMDCAUSE channel variables, so
// nothing downstream of runCallManager.ts needs to know which one ran.
export const AMD_ENGINE = config.amd.engine;

// Feature flag for the "ml" engine only: "compact" (the default) makes
// amd report the same native-AMD-compatible AMDSTATUS/AMDCAUSE pair
// as the "native" engine above, so switching engines never changes what
// apiserver reads. "full" additionally reports AMDCONFIDENCE/AMDDETECTOR/
// AMDLATENCYMS and the classifier's own five-way status (HUMAN/MACHINE/
// VOICEMAIL/IVR/UNKNOWN) — a consumer must opt into "full" to see those.
export const AMD_MODE = config.amd.mode;

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

export const INTEGRATIONS_FILE = config.integrationsFile;

export const NATS_URL = config.nats.url;

// Default owner (if identity.owner is set, the system creates a user and a workspace)
export const OWNER_EMAIL = config.identity.owner?.email;

export const OWNER_NAME = config.identity.owner?.name ?? "Admin";

export const OWNER_PASSWORD = config.identity.owner?.password;

export const ROUTR_API_ENDPOINT = config.routr.apiEndpoint;

export const ROUTR_DEFAULT_PEER_AOR = config.routr.defaultPeer.aor;

export const ROUTR_DEFAULT_PEER_NAME = config.routr.defaultPeer.name;

export const ROUTR_DEFAULT_PEER_PASSWORD = config.routr.defaultPeer.password;

export const ROUTR_DEFAULT_PEER_USERNAME = config.routr.defaultPeer.username;

// The media-node peer and which numbers go to it during the cutover (add-media-node 4.1)
export const ROUTR_MEDIA_NODE_PEER = config.routr.mediaNodePeer;

export const ROUTR_ENGINES = config.routr.engines;

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

// Caller-audio filters
export const AI_COUSTICS_LICENSE = config.audioFilters.aiCoustics.license;

// Call records (add-call-record): index, records API, retention, ListCalls from the index.
export const CALL_RECORDS = config.callRecords;
