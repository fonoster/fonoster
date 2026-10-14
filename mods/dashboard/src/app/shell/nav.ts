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
  Bot,
  Braces,
  Grid3x3,
  Headset,
  IdCard,
  KeyRound,
  LayoutDashboard,
  Lock,
  Network,
  PhoneCall,
  Server,
  Settings,
  Shield,
  type LucideIcon
} from "lucide-react";

export type NavItem = { label: string; path: string; icon: LucideIcon };
export type NavSection = { title?: string; items: NavItem[] };

/** The sidebar, as in designs/dashboard.pen (Dashboard/App shell). Paths are relative to /w/:workspaceRef. */
export const NAVIGATION: NavSection[] = [
  {
    items: [
      { label: "Overview", path: "", icon: LayoutDashboard },
      { label: "Agents", path: "agents", icon: Bot },
      { label: "Voice apps", path: "voice-apps", icon: Braces },
      { label: "Calls", path: "calls", icon: PhoneCall }
    ]
  },
  {
    title: "SIP network",
    items: [
      { label: "Numbers", path: "numbers", icon: Grid3x3 },
      { label: "Trunks", path: "trunks", icon: Network },
      { label: "Domains", path: "domains", icon: Server },
      { label: "SIP users", path: "sip-users", icon: Headset },
      { label: "ACLs", path: "acls", icon: Shield },
      { label: "Credentials", path: "credentials", icon: IdCard }
    ]
  },
  {
    title: "Workspace",
    items: [
      { label: "Secrets", path: "secrets", icon: Lock },
      { label: "API keys", path: "api-keys", icon: KeyRound },
      { label: "Settings", path: "settings", icon: Settings }
    ]
  }
];

export const DOCS_URL = "https://docs.fonoster.com/";
export const SUPPORT_URL = "https://discord.gg/4QWgSz4hTC";
