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
import { useRegions } from "./api";
import { DEFAULT_REGION, isUsable, type RegionStatus } from "./types";

const SUFFIX: Partial<Record<RegionStatus, string>> = {
  waiting: " (waiting)",
  offline: " (offline)",
  unsupported: " (needs upgrade)"
};

/** One select: Default plus the user's regions; waiting or offline ones are disabled. */
export function RegionPicker({
  value,
  onChange
}: {
  value: string;
  onChange: (region: string) => void;
}) {
  const { data } = useRegions();
  const regions = data?.length ? data : [DEFAULT_REGION];
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="workspace-region"
        className="font-display text-sm font-medium"
      >
        Region
      </label>
      <select
        id="workspace-region"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-control border border-input bg-background px-3 font-display text-sm"
      >
        {regions.map((r) => (
          <option key={r.id} value={r.id} disabled={!isUsable(r)}>
            {r.displayName}
            {SUFFIX[r.status] ?? ""}
          </option>
        ))}
      </select>
      <p className="font-display text-xs text-muted-foreground">
        You can't change the region later.
      </p>
    </div>
  );
}
