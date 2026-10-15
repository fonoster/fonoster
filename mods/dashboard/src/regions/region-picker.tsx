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
import { useEffect, useState } from "react";
import { useRegionsApi } from "./api";
import { DEFAULT_REGION, PRIVATE_REGION, type PublicRegion } from "./types";

/** Public regions come from the API; the default is us-east-1 (PR-10). */
export function usePublicRegions(): PublicRegion[] {
  const api = useRegionsApi();
  const [regions, setRegions] = useState<PublicRegion[]>([DEFAULT_REGION]);
  useEffect(() => {
    let live = true;
    api
      .listRegions()
      .then((r) => live && r?.length && setRegions(r))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [api]);
  return regions;
}

/** Region select for a new workspace; the choice is permanent (PR-1). */
export function RegionPicker({
  value,
  onChange
}: {
  value: string;
  onChange: (region: string) => void;
}) {
  const regions = usePublicRegions();
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
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
        <option value={PRIVATE_REGION}>Private region</option>
      </select>
      <p className="font-display text-xs text-muted-foreground">
        You can't change the region later.
      </p>
    </div>
  );
}
