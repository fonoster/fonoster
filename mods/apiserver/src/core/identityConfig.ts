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
import {
  CLOAK_ENCRYPTION_KEY,
  IDENTITY_ACCESS_TOKEN_EXPIRES_IN,
  IDENTITY_AUDIENCE,
  IDENTITY_CONTACT_VERIFICATION_REQUIRED,
  IDENTITY_DATABASE_URL,
  IDENTITY_ID_TOKEN_EXPIRES_IN,
  IDENTITY_ISSUER,
  IDENTITY_OAUTH2_GITHUB_CLIENT_ID,
  IDENTITY_OAUTH2_GITHUB_CLIENT_SECRET,
  IDENTITY_PRIVATE_KEY,
  IDENTITY_PUBLIC_KEY,
  IDENTITY_REFRESH_TOKEN_EXPIRES_IN,
  IDENTITY_TWO_FACTOR_AUTHENTICATION_REQUIRED,
  IDENTITY_WORKSPACE_INVITE_EXPIRATION,
  IDENTITY_WORKSPACE_INVITE_FAIL_URL,
  IDENTITY_WORKSPACE_INVITE_URL,
  SMTP_AUTH_PASS,
  SMTP_AUTH_USER,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_SENDER,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} from "../envs";

const identityConfig = {
  dbUrl: IDENTITY_DATABASE_URL,
  issuer: IDENTITY_ISSUER,
  audience: IDENTITY_AUDIENCE,
  privateKey: IDENTITY_PRIVATE_KEY,
  publicKey: IDENTITY_PUBLIC_KEY,
  encryptionKey: CLOAK_ENCRYPTION_KEY,
  accessTokenExpiresIn: IDENTITY_ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresIn: IDENTITY_REFRESH_TOKEN_EXPIRES_IN,
  idTokenExpiresIn: IDENTITY_ID_TOKEN_EXPIRES_IN,
  workspaceInviteExpiration: IDENTITY_WORKSPACE_INVITE_EXPIRATION,
  workspaceInviteUrl: IDENTITY_WORKSPACE_INVITE_URL,
  workspaceInviteFailUrl: IDENTITY_WORKSPACE_INVITE_FAIL_URL,
  contactVerificationRequired: IDENTITY_CONTACT_VERIFICATION_REQUIRED,
  twoFactorAuthenticationRequired: IDENTITY_TWO_FACTOR_AUTHENTICATION_REQUIRED,
  smtpConfig: {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    sender: SMTP_SENDER,
    auth: {
      user: SMTP_AUTH_USER,
      pass: SMTP_AUTH_PASS
    }
  },
  twilioSmsConfig: {
    accountSid: TWILIO_ACCOUNT_SID,
    authToken: TWILIO_AUTH_TOKEN,
    sender: TWILIO_PHONE_NUMBER
  },
  githubOauth2Config: {
    clientId: IDENTITY_OAUTH2_GITHUB_CLIENT_ID,
    clientSecret: IDENTITY_OAUTH2_GITHUB_CLIENT_SECRET
  }
};

export { identityConfig };
