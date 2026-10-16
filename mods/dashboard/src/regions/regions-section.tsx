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
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { usePrivateRegions } from "~/lib/capabilities";
import { errorMessage } from "~/lib/errors";
import { REGIONS_KEY, useRegions, useRegionsApi } from "./api";
import { InstallCommand } from "./install-command";
import { NewRegionDialog } from "./new-region-dialog";
import { RegionDrawer } from "./region-drawer";
import { StatusDot } from "./status";
import type { RegionToken } from "./types";

/**
 * "Your regions" on the start screen: one compact row per private region (name and status dot).
 * A waiting region shows its install command inline; More opens the details drawer
 * (`?region=<ref>`). Not rendered when the install has no private regions.
 */
export function RegionsSection() {
  return usePrivateRegions() ? <PrivateRegionsSection /> : null;
}

function PrivateRegionsSection() {
  const api = useRegionsApi();
  const queryClient = useQueryClient();
  const { data } = useRegions();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [tokens, setTokens] = useState<Record<string, RegionToken>>({});
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<unknown>();
  const regions = (data ?? []).filter((r) => r.kind === "private");

  const setToken = (ref: string, token: RegionToken) =>
    setTokens((t) => ({ ...t, [ref]: token }));
  const open = (ref: string | null) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (ref) next.set("region", ref);
        else next.delete("region");
        return next;
      },
      { replace: true }
    );
  const reissue = async (ref: string) => {
    setBusy(ref);
    setError(undefined);
    try {
      setToken(ref, await api.reissueRegionToken(ref));
      void queryClient.invalidateQueries({ queryKey: REGIONS_KEY });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <section aria-label="Your regions" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[13px] font-medium">Your regions</h2>
        <Button
          variant="outline"
          className="font-display"
          onClick={() => setCreating(true)}
        >
          <Plus className="size-4" aria-hidden /> New region
        </Button>
      </div>
      {error !== undefined && (
        <Alert variant="error">{errorMessage(error)}</Alert>
      )}
      {regions.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-border bg-card">
          {regions.map((r) => (
            <li
              key={r.ref}
              className="flex flex-col gap-3 border-b border-border px-5 py-3 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-display text-[15px] font-medium">
                  {r.displayName}
                </span>
                <span className="flex items-center gap-2">
                  <StatusDot status={r.status} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`More for ${r.displayName}`}
                    onClick={() => open(r.ref)}
                  >
                    <MoreHorizontal aria-hidden />
                  </Button>
                </span>
              </div>
              {r.status === "waiting" && (
                <InstallCommand
                  enrollment={tokens[r.ref]}
                  busy={busy === r.ref}
                  onReissue={() => void reissue(r.ref)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <NewRegionDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={({ ref, token, expiresAt }) =>
          setToken(ref, { token, expiresAt })
        }
      />
      <RegionDrawer
        regionRef={params.get("region")}
        onClose={() => open(null)}
        onToken={setToken}
      />
    </section>
  );
}
