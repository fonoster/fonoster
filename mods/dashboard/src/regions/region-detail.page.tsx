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
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { errorMessage } from "~/lib/errors";
import { REGIONS_KEY, regionKey, useRegionDetail, useRegionsApi } from "./api";
import { ConnectionDetails } from "./connection";
import { InstallCommand } from "./setup";
import { secretCommand } from "./install";
import { StartLayout } from "./start-layout";
import { ago, StatusPill } from "./status";
import type { RegionStatus, RegionToken } from "./types";

export function Row({
  label,
  value
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 font-display text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value ?? "-"}</dd>
    </div>
  );
}

export const STATUS_NOTE: Partial<
  Record<RegionStatus, { variant: "warning" | "error"; text: string }>
> = {
  offline: { variant: "error", text: "Your region is offline." },
  unsupported: { variant: "warning", text: "Your region needs an upgrade." },
  degraded: { variant: "warning", text: "Part of your region is unhealthy." }
};

const fee = (cents: number) =>
  `$${(cents / 100).toFixed(2).replace(/\.00$/, "")} / month`;

/** /regions/:ref: status, connection details, workspaces, keys and controls. */
export default function RegionDetailPage() {
  const { ref = "" } = useParams();
  const api = useRegionsApi();
  const queryClient = useQueryClient();
  const { data: region, isLoading, error } = useRegionDetail(ref);
  const [confirming, setConfirming] = useState(false);
  const [token, setToken] = useState<RegionToken>();
  const [action, setAction] = useState<{ pending?: boolean; error?: unknown }>(
    {}
  );

  if (region?.kind === "public") return <Navigate to="/workspaces" replace />;
  if (isLoading)
    return (
      <StartLayout title="Region">
        <p className="font-display text-sm text-muted-foreground">Loading…</p>
      </StartLayout>
    );
  if (error || !region)
    return (
      <StartLayout title="Region">
        <Alert variant="error">
          {errorMessage(error ?? "Couldn't load the region")}
        </Alert>
      </StartLayout>
    );

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: regionKey(ref) });
    void queryClient.invalidateQueries({ queryKey: REGIONS_KEY });
  };
  const reissue = async () => {
    setAction({ pending: true });
    try {
      setToken(await api.reissueRegionToken(ref));
      setAction({});
    } catch (e) {
      setAction({ error: e });
    }
  };
  const disconnect = async () => {
    setAction({ pending: true });
    try {
      await api.disconnectRegion(ref);
      setConfirming(false);
      setAction({});
      refresh();
    } catch (e) {
      setAction({ error: e });
    }
  };
  const note = STATUS_NOTE[region.status];
  const missing = region.secrets.filter((s) => !s.set);

  return (
    <StartLayout
      title={region.displayName}
      actions={<StatusPill status={region.status} />}
    >
      {note && <Alert variant={note.variant}>{note.text}</Alert>}
      {action.error !== undefined && !confirming && (
        <Alert variant="error">{errorMessage(action.error)}</Alert>
      )}
      <dl>
        <Row label="ID" value={region.id} />
        <Row label="Version" value={region.version} />
        <Row label="Last seen" value={ago(region.lastSeenAt)} />
        <Row label="Nodes" value={region.mediaNodes} />
        <Row label="Active calls" value={region.activeCalls} />
        <Row label="SIP domain" value={region.sipDomain} />
        {region.monthlyFeeCents !== undefined && (
          <Row label="Monthly fee" value={fee(region.monthlyFeeCents)} />
        )}
      </dl>
      <ConnectionDetails region={region} />

      <section aria-label="Workspaces" className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Workspaces using this region</h2>
        {region.workspaces.length === 0 ? (
          <p className="font-display text-[13px] text-muted-foreground">
            None yet.
          </p>
        ) : (
          <ul className="font-display text-sm">
            {region.workspaces.map((w) => (
              <li key={w.ref} className="border-b border-border py-2">
                <Link to={`/w/${w.ref}`} className="hover:underline">
                  {w.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {region.secrets.length > 0 && (
        <section aria-label="Keys" className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Keys</h2>
          <ul className="font-display text-sm">
            {region.secrets.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between border-b border-border py-2"
              >
                {s.name}
                {s.set ? (
                  <Badge variant="success">Set</Badge>
                ) : (
                  <Badge variant="warning">Missing</Badge>
                )}
              </li>
            ))}
          </ul>
          {missing.length > 0 && (
            <p className="font-display text-xs text-muted-foreground">
              On the region machine, run{" "}
              <code className="text-foreground">
                {secretCommand(missing[0].name)}
              </code>
              .
            </p>
          )}
        </section>
      )}

      {region.status === "waiting" && (
        <Button asChild variant="outline" className="self-start">
          <Link to={`/regions/${ref}/setup`}>Open setup</Link>
        </Button>
      )}
      {token && <InstallCommand enrollment={token} />}
      <div className="flex gap-2">
        <Button
          variant="outline"
          loading={action.pending && !confirming}
          onClick={() => void reissue()}
        >
          Re-issue token
        </Button>
        <Button variant="destructive" onClick={() => setConfirming(true)}>
          Disconnect
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Disconnect your region?"
        description="It stops taking calls until you connect it again with a new token."
        confirmLabel="Disconnect"
        pending={action.pending}
        error={action.error}
        onConfirm={() => void disconnect()}
      />
    </StartLayout>
  );
}
