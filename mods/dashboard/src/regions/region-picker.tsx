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
import { Cloud, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
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

/** Radio cards for the workspace's region; the choice is permanent (PR-1). */
export function RegionPicker({
  value,
  onChange
}: {
  value: string;
  onChange: (region: string) => void;
}) {
  const regions = usePublicRegions();
  const options = [
    ...regions.map((r) => ({
      id: r.id,
      title: r.name,
      detail: `${r.id} · Fonoster runs it for you`,
      icon: Cloud
    })),
    {
      id: PRIVATE_REGION,
      title: "Private region",
      detail:
        "Runs on your servers. Call content and provider keys stay with you.",
      icon: Server
    }
  ];
  return (
    <div role="radiogroup" aria-label="Region" className="flex flex-col gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-control border border-input p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === o.id && "border-foreground bg-muted"
          )}
        >
          <o.icon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span className="flex flex-col">
            <span className="font-display text-sm font-medium">{o.title}</span>
            <span className="font-display text-xs text-muted-foreground">
              {o.detail}
            </span>
          </span>
        </button>
      ))}
      <p className="font-display text-xs text-muted-foreground">
        The region is permanent. To use another one, create a new workspace.
      </p>
    </div>
  );
}
