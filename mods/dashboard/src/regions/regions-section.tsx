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
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "~/components/ui/button";
import { useRegions } from "./api";
import { StatusPill } from "./status";

/** "Your regions" on the start screen: the user's private regions and New region. */
export function RegionsSection() {
  const { data } = useRegions();
  const regions = (data ?? []).filter((r) => r.kind === "private");
  return (
    <section aria-label="Your regions" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[13px] font-medium">Your regions</h2>
        <Button asChild variant="outline" className="font-display">
          <Link to="/regions/new">
            <Plus className="size-4" aria-hidden /> New region
          </Link>
        </Button>
      </div>
      {regions.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-border bg-card">
          {regions.map((r) => (
            <li key={r.ref} className="border-b border-border last:border-b-0">
              <Link
                to={`/regions/${r.ref}`}
                className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-display text-[15px] font-medium">
                    {r.displayName}
                  </span>
                  <span className="font-display text-xs text-muted-foreground">
                    {r.id}
                  </span>
                </span>
                <StatusPill status={r.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
