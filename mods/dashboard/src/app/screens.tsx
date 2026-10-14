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
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * The screen behind each sidebar path (see ./shell/nav.ts). Every screen lives
 * in its own folder and is loaded on first visit. Paths without an entry show
 * PendingScreen until they're rebuilt.
 */
export const SCREENS: Record<string, LazyExoticComponent<ComponentType>> = {
  "": lazy(() => import("~/overview")),
  agents: lazy(() => import("~/agents")),
  "voice-apps": lazy(() => import("~/voice-apps")),
  secrets: lazy(() => import("~/secrets")),
  "api-keys": lazy(() => import("~/api-keys")),
  settings: lazy(() => import("~/settings")),
  numbers: lazy(() => import("~/numbers")),
  trunks: lazy(() => import("~/trunks")),
  domains: lazy(() => import("~/domains")),
  "sip-users": lazy(() => import("~/sip-users")),
  acls: lazy(() => import("~/acls")),
  credentials: lazy(() => import("~/credentials")),
  calls: lazy(() => import("~/calls"))
};
