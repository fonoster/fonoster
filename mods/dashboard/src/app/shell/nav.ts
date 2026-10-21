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
import type { ComponentType, SVGProps } from "react";
import {
  Badge,
  CallLog,
  Code,
  DataUsage,
  Extension,
  Dialpad,
  Dns,
  HeadsetMic,
  Lan,
  Lock,
  Settings,
  Shield,
  SmartToy,
  SpaceDashboard,
  Key,
  Webhook
} from "~/components/icons/material";

/** Material Symbols. */
export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;
export type NavItem = { label: string; path: string; icon: NavIcon };

export type NavSection = { title?: string; items: NavItem[] };

/** The sidebar, as in designs/dashboard.pen (Dashboard/App shell). Paths are relative to /w/:workspaceRef. */
export const NAVIGATION: NavSection[] = [
  {
    items: [
      { label: "Overview", path: "", icon: SpaceDashboard },
      { label: "Agents", path: "agents", icon: SmartToy },
      { label: "Apps", path: "apps", icon: Code },
      { label: "Calls", path: "calls", icon: CallLog }
    ]
  },
  {
    title: "SIP network",
    items: [
      { label: "Numbers", path: "numbers", icon: Dialpad },
      { label: "Trunks", path: "trunks", icon: Lan },
      { label: "Domains", path: "domains", icon: Dns },
      { label: "SIP agents", path: "sip-agents", icon: HeadsetMic },
      { label: "ACLs", path: "acls", icon: Shield },
      { label: "Credentials", path: "credentials", icon: Badge }
    ]
  },
  {
    title: "Workspace",
    items: [
      { label: "Webhooks", path: "webhooks", icon: Webhook },
      { label: "Vendor keys", path: "vendor-keys", icon: Extension },
      { label: "Secrets", path: "secrets", icon: Lock },
      { label: "API keys", path: "api-keys", icon: Key },
      { label: "Usage", path: "usage", icon: DataUsage },
      { label: "Settings", path: "settings", icon: Settings }
    ]
  }
];

export const DOCS_URL = "https://docs.fonoster.com/";
export const SUPPORT_URL = "https://discord.gg/4QWgSz4hTC";
