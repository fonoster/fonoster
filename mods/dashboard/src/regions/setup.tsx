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
import { Link, useLocation } from "react-router-dom";
import { PageHeader } from "~/app/shell/page";
import { CopyField } from "~/components/data/copy-field";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { errorMessage } from "~/lib/errors";
import { useWorkspace } from "~/lib/workspace";
import { regionKey, useRegion, useRegionsApi } from "./api";
import { remaining, StatusPill } from "./status";
import type { EnrollmentToken } from "./types";

export const composeCommand = (token: string) =>
  `FONOSTER_ENROLLMENT_TOKEN=${token} docker compose -f fonoster-region.yml up -d`;
export const helmCommand = (token: string) =>
  `helm install fonoster-region fonoster/region --set enrollment.token=${token}`;

/** Re-renders every `ms` so countdowns move. */
function useNow(ms = 30_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

/** /w/:workspaceRef/region-setup: connect the cell with a one-time token (PR-3). */
export default function RegionSetup() {
  const workspace = useWorkspace();
  const api = useRegionsApi();
  const queryClient = useQueryClient();
  const { state } = useLocation();
  const [enrollment, setEnrollment] = useState<EnrollmentToken | undefined>(
    (state as { enrollment?: EnrollmentToken } | null)?.enrollment
  );
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const { data: region } = useRegion(3_000);
  const now = useNow();

  const reissue = async () => {
    setBusy(true);
    setError(undefined);
    try {
      setEnrollment(await api.reissueRegionToken());
      void queryClient.invalidateQueries({
        queryKey: regionKey(workspace.ref)
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const connected =
    region?.status === "connected" || region?.status === "degraded";
  const left = enrollment ? remaining(enrollment.expiresAt, now) : undefined;

  return (
    <>
      <PageHeader
        title="Connect your region"
        description={`${workspace.name} runs on your servers. Install the region, then it connects to Fonoster by itself; no inbound ports are needed.`}
        actions={region && <StatusPill status={region.status} />}
      />
      <div className="flex max-w-3xl flex-col gap-6 px-4 pb-10 sm:px-8">
        {error && <Alert variant="error">{error}</Alert>}
        {connected ? (
          <Alert variant="success">
            Your region is connected
            {region?.version ? ` (version ${region.version})` : ""}. Set its
            provider keys below, then you can take calls.
          </Alert>
        ) : (
          <Alert variant="info">
            Waiting for the first heartbeat from your region…
          </Alert>
        )}

        <section aria-label="Install" className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">1. Install with your token</h2>
          {enrollment ? (
            <>
              <CopyField label="Enrollment token" value={enrollment.token} />
              <p className="font-display text-xs text-muted-foreground">
                {left
                  ? `Expires in ${left}. It works once.`
                  : "This token has expired."}
              </p>
              <CopyField
                label="Docker Compose"
                value={composeCommand(enrollment.token)}
              />
              <CopyField label="Helm" value={helmCommand(enrollment.token)} />
            </>
          ) : (
            <Alert variant="note">
              The token is only shown when it is issued. Re-issue one to see the
              install commands again.
            </Alert>
          )}
          <div>
            <Button
              variant="outline"
              loading={busy}
              onClick={() => void reissue()}
            >
              Re-issue token
            </Button>
          </div>
        </section>

        <section aria-label="Provider keys" className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">2. Set your provider keys</h2>
          <p className="font-display text-xs text-muted-foreground">
            Keys never leave your region. Run this on the server for each key:
          </p>
          {region?.secrets.length ? (
            <ul className="flex flex-col gap-2">
              {region.secrets.map((s) => (
                <li key={s.name} className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-[13px]">
                    fonoster-region secrets set {s.name}
                  </code>
                  <span className="font-display text-xs text-muted-foreground">
                    {s.set ? "set" : "missing"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-display text-xs text-muted-foreground">
              No keys are needed yet. They appear here as you add apps.
            </p>
          )}
        </section>

        {connected && (
          <div>
            <Button asChild>
              <Link to="..">Go to the dashboard</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
