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
import fs from "fs";
import { join } from "path";
import { assertEnvsAreSet } from "@fonoster/common";
import dotenv from "dotenv";

if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: join(__dirname, "..", "..", "..", ".env") });
}

const e = process.env;

assertEnvsAreSet([
  "APISERVER_APP_URL",
  "APISERVER_SIGNALING_SERVER",
  "APISERVER_ASTERISK_ARI_PROXY_URL",
  "APISERVER_ASTERISK_ARI_USERNAME",
  "APISERVER_ASTERISK_ARI_SECRET",
  "APISERVER_CLOAK_ENCRYPTION_KEY",
  "APISERVER_SMTP_HOST",
  "APISERVER_SMTP_SENDER",
  "APISERVER_SMTP_AUTH_USER",
  "APISERVER_SMTP_AUTH_PASS",
  "APISERVER_IDENTITY_ISSUER",
  "APISERVER_IDENTITY_DATABASE_URL",
  "APISERVER_IDENTITY_WORKSPACE_INVITE_URL",
  "APISERVER_IDENTITY_WORKSPACE_INVITE_FAIL_URL",
  "APISERVER_DATABASE_URL",
  "APISERVER_INFLUXDB_URL",
  "APISERVER_INFLUXDB_INIT_USERNAME",
  "APISERVER_INFLUXDB_INIT_PASSWORD",
  "APISERVER_INFLUXDB_INIT_ORG",
  "APISERVER_INFLUXDB_INIT_TOKEN",
  "APISERVER_NATS_URL"
]);

const IDENTITY_PRIVATE_KEY_PATH =
  e.APISERVER_IDENTITY_PRIVATE_KEY_PATH || "/opt/fonoster/keys/private.pem";
const IDENTITY_PUBLIC_KEY_PATH =
  e.APISERVER_IDENTITY_PUBLIC_KEY_PATH || "/opt/fonoster/keys/public.pem";

export const APISERVER_BIND_ADDR = e.APISERVER_BIND_ADDR || "0.0.0.0:50051";

export const APISERVER_HOST = e.APISERVER_HOST || "apiserver";

export const APISERVER_SIGNALING_SERVER = e.APISERVER_SIGNALING_SERVER;

// Frontend configurations
export const APP_URL = e.APISERVER_APP_URL;

export const ASTERISK_ARI_PROXY_URL = e.APISERVER_ASTERISK_ARI_PROXY_URL;

export const ASTERISK_ARI_SECRET = e.APISERVER_ASTERISK_ARI_SECRET;

export const ASTERISK_ARI_USERNAME = e.APISERVER_ASTERISK_ARI_USERNAME;

export const ASTERISK_SYSTEM_DOMAIN =
  e.APISERVER_ASTERISK_SYSTEM_DOMAIN || "sip.invalid";

export const ASTERISK_TRUNK = "routr";

export const CALLS_CREATE_SUBJECT = "calls.create";

export const CALLS_TRACK_CALL_SUBJECT = "calls.track";

// Other configurations
export const CLOAK_ENCRYPTION_KEY = e.APISERVER_CLOAK_ENCRYPTION_KEY;

export const DEFAULT_NATS_QUEUE_GROUP = "apiserver";

export const HTTP_BRIDGE_PORT = e.APISERVER_HTTP_BRIDGE_PORT
  ? parseInt(e.APISERVER_HTTP_BRIDGE_PORT)
  : 9876;

// Identity configurations
export const IDENTITY_ACCESS_TOKEN_EXPIRES_IN =
  e.APISERVER_IDENTITY_ACCESS_TOKEN_EXPIRES_IN || "15m";

export const IDENTITY_AUDIENCE = e.APISERVER_IDENTITY_AUDIENCE || "api";

export const IDENTITY_ID_TOKEN_EXPIRES_IN =
  e.APISERVER_IDENTITY_ID_TOKEN_EXPIRES_IN || "15m";

export const IDENTITY_ISSUER = e.APISERVER_IDENTITY_ISSUER;

export const IDENTITY_CONTACT_VERIFICATION_REQUIRED =
  e.APISERVER_IDENTITY_CONTACT_VERIFICATION_REQUIRED === "true";

export const IDENTITY_TWO_FACTOR_AUTHENTICATION_REQUIRED =
  e.APISERVER_IDENTITY_TWO_FACTOR_AUTHENTICATION_REQUIRED === "true";

export const IDENTITY_OAUTH2_GITHUB_ENABLED =
  e.APISERVER_IDENTITY_OAUTH2_GITHUB_ENABLED === "true";

export const IDENTITY_OAUTH2_GITHUB_CLIENT_ID =
  e.APISERVER_IDENTITY_OAUTH2_GITHUB_CLIENT_ID;

export const IDENTITY_OAUTH2_GITHUB_CLIENT_SECRET =
  e.APISERVER_IDENTITY_OAUTH2_GITHUB_CLIENT_SECRET;

export const IDENTITY_PRIVATE_KEY = fs.readFileSync(
  IDENTITY_PRIVATE_KEY_PATH,
  "utf8"
);

export const IDENTITY_PUBLIC_KEY = fs.readFileSync(
  IDENTITY_PUBLIC_KEY_PATH,
  "utf8"
);

export const IDENTITY_REFRESH_TOKEN_EXPIRES_IN =
  e.APISERVER_IDENTITY_REFRESH_TOKEN_EXPIRES_IN || "24h";

export const IDENTITY_WORKSPACE_INVITE_FAIL_URL =
  e.APISERVER_IDENTITY_WORKSPACE_INVITE_FAIL_URL;

export const IDENTITY_WORKSPACE_INVITE_EXPIRATION =
  e.APISERVER_IDENTITY_WORKSPACE_INVITE_EXPIRATION || "1d";

export const IDENTITY_WORKSPACE_INVITE_URL =
  e.APISERVER_IDENTITY_WORKSPACE_INVITE_URL;

export const IDENTITY_DATABASE_URL = e.APISERVER_IDENTITY_DATABASE_URL;

if (e.APISERVER_IDENTITY_OAUTH2_GITHUB_ENABLED === "true") {
  assertEnvsAreSet([
    "APISERVER_IDENTITY_OAUTH2_GITHUB_CLIENT_ID",
    "APISERVER_IDENTITY_OAUTH2_GITHUB_CLIENT_SECRET"
  ]);
}

if (
  IDENTITY_CONTACT_VERIFICATION_REQUIRED ||
  IDENTITY_TWO_FACTOR_AUTHENTICATION_REQUIRED
) {
  assertEnvsAreSet([
    "APISERVER_TWILIO_ACCOUNT_SID",
    "APISERVER_TWILIO_AUTH_TOKEN",
    "APISERVER_TWILIO_PHONE_NUMBER"
  ]);
}

if (e.APISERVER_AUTHZ_SERVICE_ENABLED === "true") {
  assertEnvsAreSet(["APISERVER_AUTHZ_SERVICE_HOST"]);
}

// Authz configurations
export const AUTHZ_SERVICE_ENABLED =
  e.APISERVER_AUTHZ_SERVICE_ENABLED === "true";
export const AUTHZ_SERVICE_HOST = e.APISERVER_AUTHZ_SERVICE_HOST;
export const AUTHZ_SERVICE_PORT = e.APISERVER_AUTHZ_SERVICE_PORT || 50071;
export const AUTHZ_SERVICE_METHODS = e.APISERVER_AUTHZ_SERVICE_METHODS
  ? e.APISERVER_AUTHZ_SERVICE_METHODS.split(",")
  : ["/fonoster.calls.v1beta2.Calls/CreateCall"];

// InfluxDB configurations
export const INFLUXDB_ORG = e.APISERVER_INFLUXDB_INIT_ORG;

export const INFLUXDB_PASSWORD = e.APISERVER_INFLUXDB_INIT_PASSWORD;

export const INFLUXDB_TOKEN = e.APISERVER_INFLUXDB_INIT_TOKEN;

export const INFLUXDB_URL = e.APISERVER_INFLUXDB_URL;

export const INFLUXDB_USERNAME = e.APISERVER_INFLUXDB_INIT_USERNAME;

export const INTEGRATIONS_FILE =
  e.APISERVER_INTEGRATIONS_FILE || "/opt/fonoster/integrations.json";

export const NATS_URL = e.APISERVER_NATS_URL;

export const OWNER_EMAIL = e.APISERVER_OWNER_EMAIL;

// Default owner configurations (If OWNER_EMAIL is set, the system will create a default user and a workspace)
export const OWNER_NAME = e.APISERVER_OWNER_NAME || "Admin";

export const OWNER_PASSWORD = e.APISERVER_OWNER_PASSWORD || "changeme";

export const ROUTR_API_ENDPOINT =
  e.APISERVER_ROUTR_API_ENDPOINT || "routr:51907";

export const ROUTR_DEFAULT_PEER_AOR =
  e.APISERVER_ROUTR_DEFAULT_PEER_AOR || "sip:voice@default";

export const ROUTR_DEFAULT_PEER_NAME =
  e.APISERVER_ROUTR_DEFAULT_PEER_NAME || "Voice Server";

export const ROUTR_DEFAULT_PEER_PASSWORD =
  e.APISERVER_ROUTR_DEFAULT_PEER_PASSWORD || "changeme";

export const ROUTR_DEFAULT_PEER_USERNAME =
  e.APISERVER_ROUTR_DEFAULT_PEER_USERNAME || "voice";

export const SMTP_AUTH_PASS = e.APISERVER_SMTP_AUTH_PASS;

export const SMTP_AUTH_USER = e.APISERVER_SMTP_AUTH_USER;

// SMTP configurations
export const SMTP_HOST = e.APISERVER_SMTP_HOST;

export const SMTP_PORT = e.APISERVER_SMTP_PORT
  ? parseInt(e.APISERVER_SMTP_PORT)
  : 587;

export const SMTP_SECURE = e.APISERVER_SMTP_SECURE?.toLowerCase() === "true";

export const SMTP_SENDER = e.APISERVER_SMTP_SENDER;

// Custom templates
export const TEMPLATES_DIR = e.APISERVER_TEMPLATES_DIR;

// Twilio configurations
export const TWILIO_ACCOUNT_SID = e.APISERVER_TWILIO_ACCOUNT_SID;

export const TWILIO_AUTH_TOKEN = e.APISERVER_TWILIO_AUTH_TOKEN;

export const TWILIO_PHONE_NUMBER = e.APISERVER_TWILIO_PHONE_NUMBER;
