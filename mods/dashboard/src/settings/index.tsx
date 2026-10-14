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
import { CreditCard } from "lucide-react";
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams
} from "react-router-dom";
import { EmptyState } from "~/components/data/empty-state";
import { PageHeader } from "~/app/shell/page";
import { useCapabilities } from "~/lib/capabilities";
import { cn } from "~/lib/utils";
import { useWorkspace } from "~/lib/workspace";
import { GeneralSettings } from "./general";
import { MembersSettings } from "./members";

/** Workspace settings, one tab per sub-route: General, Members, Billing. */
export default function SettingsScreen() {
  const workspace = useWorkspace();
  const billing = useCapabilities().billing.enabled;
  // Links are built from the screen's own path: relative ones would resolve
  // against the splat ("settings/*") and point below the current tab.
  const { pathname } = useLocation();
  const { "*": tab = "" } = useParams();
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
        <Route element={<SettingsTabs base={base} billing={billing} />}>
          <Route index element={<GeneralSettings />} />
          <Route path="members" element={<MembersSettings />} />
          <Route
            path="billing"
            element={billing ? <BillingSoon /> : <Navigate to={base} replace />}
          />
          <Route path="*" element={<Navigate to={base} replace />} />
        </Route>
      </Routes>
    </>
  );
}

function SettingsTabs({ base, billing }: { base: string; billing: boolean }) {
  const tabs = [
    { to: base, label: "General", end: true },
    { to: `${base}/members`, label: "Members" },
    ...(billing ? [{ to: `${base}/billing`, label: "Billing" }] : [])
  ];

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8">
      <nav
        aria-label="Settings"
        className="inline-flex items-center gap-1 self-start rounded-full bg-muted p-1"
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 font-display text-sm font-medium text-text-secondary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive && "bg-background text-foreground"
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

function BillingSoon() {
  return (
    <EmptyState
      icon={CreditCard}
      title="Billing moves here soon"
      description="Plans, usage and invoices for this workspace will live in this tab."
    />
  );
}
