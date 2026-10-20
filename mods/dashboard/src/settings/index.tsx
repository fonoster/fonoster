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
import { TabLink } from "~/components/data/tab-link";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams
} from "react-router-dom";
import { PageHeader } from "~/app/shell/page";
import { usePrivateRegions } from "~/lib/capabilities";
import { useWorkspace } from "~/lib/workspace";
import { GeneralSettings } from "./general";
import { RegionSettings } from "~/regions";
import { MembersSettings } from "./members";

/**
 * Workspace settings, one tab per sub-route: General and Members. Billing
 * isn't in this release; it comes back as a tab when `billing.enabled`.
 */
export default function SettingsScreen() {
  const workspace = useWorkspace();
  // Links are built from the screen's own path: relative ones would resolve
  // against the splat ("settings/*") and point below the current tab.
  const { pathname } = useLocation();
  const { "*": tab = "" } = useParams();
  const privateRegions = usePrivateRegions();
  const base = pathname
    .slice(0, pathname.length - tab.length)
    .replace(/\/$/, "");

  return (
    <>
      <PageHeader
        title="Settings"
        description={`${workspace.name} workspace`}
      />
      <Routes>
        <Route
          element={<SettingsTabs base={base} privateRegions={privateRegions} />}
        >
          <Route index element={<GeneralSettings />} />
          <Route path="members" element={<MembersSettings />} />
          {privateRegions && (
            <Route path="region" element={<RegionSettings />} />
          )}
          <Route path="*" element={<Navigate to={base} replace />} />
        </Route>
      </Routes>
    </>
  );
}

function SettingsTabs({
  base,
  privateRegions
}: {
  base: string;
  privateRegions: boolean;
}) {
  const tabs = [
    { to: base, label: "General", end: true },
    { to: `${base}/members`, label: "Members" },
    // Region only when the install has private regions (capabilities.regions.private)
    ...(privateRegions ? [{ to: `${base}/region`, label: "Region" }] : [])
  ];

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8">
      <nav
        aria-label="Settings"
        className="flex gap-6 overflow-x-auto border-b border-border"
      >
        {tabs.map((tab) => (
          <TabLink key={tab.to} to={tab.to} label={tab.label} />
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
