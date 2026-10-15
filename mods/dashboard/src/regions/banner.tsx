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
import { Alert } from "~/components/ui/alert";
import { useRegion } from "./api";
import { ago } from "./status";

/** Shown across the app when a private workspace's region is offline or unsupported. */
export function RegionBanner() {
  const { data: region, isPrivate } = useRegion();
  if (!isPrivate || !region) return null;
  if (region.status === "offline")
    return (
      <Alert variant="error" className="rounded-none">
        Your region is offline. Last seen {ago(region.lastHeartbeatAt)}.
      </Alert>
    );
  if (region.status === "unsupported")
    return (
      <Alert variant="warning" className="rounded-none">
        Your region needs an upgrade.
      </Alert>
    );
  return null;
}
