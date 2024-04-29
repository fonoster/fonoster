/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { join } from "path";
import dotenv from "dotenv";
import { assertEnvsAreSet } from "./utils";

if (process.env.NODE_ENV === "dev") {
  dotenv.config({ path: join(__dirname, "..", "..", "..", ".env") });
}

const e = process.env;

assertEnvsAreSet([
  "APP_URL",
  "SMTP_HOST",
  "SMTP_SENDER",
  "SMTP_AUTH_USER",
  "SMTP_AUTH_PASS"
]);

// Frontend configurations
export const APP_URL = e.APP_URL;

// SMTP configurations
export const SMTP_HOST = e.SMTP_HOST;
export const SMTP_PORT = e.SMTP_PORT ? parseInt(e.SMTP_PORT) : 587;
export const SMTP_SECURE = e.SMTP_SECURE ?? true;
export const SMTP_AUTH_USER = e.SMTP_AUTH_USER;
export const SMTP_AUTH_PASS = e.SMTP_AUTH_PASS;
export const SMTP_SENDER = e.SMTP_SENDER;

// Custom email templates
export const EMAIL_TEMPLATES_DIR = e.EMAIL_TEMPLATES_DIR;
