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
import { join } from "path";
import dotenv from "dotenv";

if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: join(__dirname, "..", "..", "..", ".env") });
}

const e = process.env;

let rootDomain = e.APISERVER_ROOT_DOMAIN || e.ROOT_DOMAIN || "fonoster.local";

/**
 * Root SIP domain that workspace domains must end with. The API server sets it
 * from fonoster.yaml's `domain` at boot; other consumers keep the env default.
 */
export const setRootDomain = (domain: string) => {
  rootDomain = domain;
};

export const getRootDomain = () => rootDomain;

/** @deprecated read getRootDomain() so a value set at boot is honoured. */
export const ROOT_DOMAIN = rootDomain;
