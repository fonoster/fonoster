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
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CopyField } from "~/components/data/copy-field";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { errorMessage } from "~/lib/errors";
import { regionKey, useRegionDetail, useRegionsApi } from "./api";
import { composeCommand, helmCommand, secretCommand } from "./install";
import { StartLayout } from "./start-layout";
import { remaining, StatusPill } from "./status";
import type { RegionToken } from "./types";

/** Re-renders every `ms` so countdowns move. */
function useNow(ms = 30_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

/** The install command with its token: Compose or Helm, and the expiry. */
export function InstallCommand({ enrollment }: { enrollment: RegionToken }) {
  const [tab, setTab] = useState<"compose" | "helm">("compose");
  const left = remaining(enrollment.expiresAt, useNow());
  return (
    <section aria-label="Install" className="flex flex-col gap-3">
      <div role="tablist" className="flex gap-2">
        {(["compose", "helm"] as const).map((t) => (
          <Button
            key={t}
            role="tab"
            aria-selected={tab === t}
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
          >
            {t === "compose" ? "Compose" : "Helm"}
          </Button>
        ))}
      </div>
      <CopyField
        label={tab === "compose" ? "Docker Compose" : "Helm"}
        value={
          tab === "compose"
            ? composeCommand(enrollment.token)
            : helmCommand(enrollment.token)
        }
      />
      <p className="font-display text-xs text-muted-foreground">
        {left ? `Expires in ${left}.` : "This token has expired."}
      </p>
    </section>
  );
}

/** /regions/:ref/setup: connect the region with a one-time token. */
export default function RegionSetup() {
  const { ref } = useParams();
  const api = useRegionsApi();
  const queryClient = useQueryClient();
  const { state } = useLocation();
  const [enrollment, setEnrollment] = useState<RegionToken | undefined>(
    (state as { enrollment?: RegionToken } | null)?.enrollment
  );
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const { data: region } = useRegionDetail(ref, 3_000);

  const reissue = async () => {
    setBusy(true);
    setError(undefined);
    try {
      setEnrollment(await api.reissueRegionToken(ref!));
      void queryClient.invalidateQueries({ queryKey: regionKey(ref!) });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const connected =
    region?.status === "connected" || region?.status === "degraded";
  const missing = region?.secrets.filter((k) => !k.set) ?? [];

  return (
    <StartLayout
      title={connected ? "Region connected" : "Connect your region"}
      actions={region && <StatusPill status={region.status} />}
    >
      {error && <Alert variant="error">{error}</Alert>}
      {enrollment ? (
        <InstallCommand enrollment={enrollment} />
      ) : (
        <p className="font-display text-sm text-muted-foreground">
          The command is only shown once. Re-issue the token to see it again.
        </p>
      )}
      <div>
        <Button variant="outline" loading={busy} onClick={() => void reissue()}>
          Re-issue token
        </Button>
      </div>
      {missing.length > 0 && (
        <section aria-label="Keys" className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Keys to set</h2>
          <ul className="flex flex-col gap-1">
            {missing.map((k) => (
              <li key={k.name}>
                <code className="rounded bg-muted px-2 py-1 text-[13px]">
                  {secretCommand(k.name)}
                </code>
              </li>
            ))}
          </ul>
        </section>
      )}
      {connected && (
        <div>
          <Button asChild>
            <Link to={`/regions/${ref}`}>View region</Link>
          </Button>
        </div>
      )}
    </StartLayout>
  );
}
