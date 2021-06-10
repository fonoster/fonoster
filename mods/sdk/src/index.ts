/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import CallManager from "@fonos/callmanager";
import Storage from "@fonos/storage";
import Secrets from "@fonos/secrets";
import Providers from "@fonos/providers";
import Numbers from "@fonos/numbers";
import Domains from "@fonos/domains";
import Agents from "@fonos/agents";
import Funcs from "@fonos/funcs";
import Auth from "@fonos/auth";
import {mute} from "@fonos/logger";

mute();

export {
  Secrets,
  Auth,
  Agents,
  CallManager,
  Domains,
  Funcs,
  Storage,
  Numbers,
  Providers
};
