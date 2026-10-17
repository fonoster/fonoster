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
 * Root SIP domain that workspace domains must end with. The API server sets it
 * from fonoster.yaml's `domain` at boot (setRootDomain); nothing reads it from
 * the environment or a .env file (fix-config-and-placement-gaps).
 */
let rootDomain = "fonoster.local";

export const setRootDomain = (domain: string) => {
  rootDomain = domain;
};

export const getRootDomain = () => rootDomain;
