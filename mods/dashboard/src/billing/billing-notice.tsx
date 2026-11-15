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
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSetBillingNotice } from "~/components/status/billing-notice-context";
import { useAuth } from "~/lib/auth";
import { useWorkspace } from "~/lib/workspace";
import { ownerLabel, pausedSentence } from "./calls-paused";
import { useCallsPaused } from "./calls-paused.service";

/**
 * Puts "calls are paused" in the announcement bar while billing pauses the current workspace's
 * calls: the owner gets Go to Billing, anyone else whom to ask. Mounted by WorkspaceGate, so
 * outside a workspace (and on /billing) there's no billing bar.
 */
export function BillingNotice() {
  const workspace = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const setNotice = useSetBillingNotice();
  const { paused, reason } = useCallsPaused();
  const owner = Boolean(user?.sub) && workspace.ownerRef === user?.sub;

  useEffect(() => {
    if (!paused) {
      setNotice(null);
      return;
    }
    const sentence = pausedSentence(reason);
    const billing = `/billing?from=${workspace.ref}`;
    setNotice(
      owner
        ? {
            text: sentence,
            action: {
              label: "Go to Billing",
              href: billing,
              go: () => navigate(billing)
            }
          }
        : {
            text: `${sentence} Ask ${ownerLabel(workspace)} to update billing.`
          }
    );
  }, [paused, reason, owner, workspace, navigate, setNotice]);

  useEffect(() => () => setNotice(null), [setNotice]);

  return null;
}
