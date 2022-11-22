/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import CallManager from "@fonoster/callmanager";
import Storage from "@fonoster/storage";
import Secrets from "@fonoster/secrets";
import Providers from "@fonoster/providers";
import Numbers from "@fonoster/numbers";
import Domains from "@fonoster/domains";
import Agents from "@fonoster/agents";
import Funcs from "@fonoster/funcs";
import Auth from "@fonoster/auth";
import Projects from "@fonoster/projects";
import Users from "@fonoster/users";
import Monitor from "@fonoster/monitor";
import Apps from "@fonoster/apps";

const Fonoster = {
  Secrets,
  Auth,
  Agents,
  CallManager,
  Domains,
  Funcs,
  Storage,
  Numbers,
  Providers,
  Projects,
  Users,
  Monitor,
  Apps
};

export { Fonoster as default };

// WARNING: Workaround to support commonjs clients
module.exports = Fonoster;
