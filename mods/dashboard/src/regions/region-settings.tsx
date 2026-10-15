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
import { Link } from "react-router-dom";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import { CopyField } from "~/components/data/copy-field";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { useCapabilities } from "~/lib/capabilities";
import { formatDate } from "~/lib/format";
import { useWorkspace } from "~/lib/workspace";
import { regionKey, useRegion, useRegionsApi } from "./api";
import { composeCommand, helmCommand } from "./setup";
import { ago, remaining, StatusPill } from "./status";
import { workspaceRegion, type EnrollmentToken, type Region } from "./types";
import { errorMessage } from "~/lib/errors";

function Row({
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

const STATUS_NOTE: Partial<
  Record<
    Region["status"],
    { variant: "warning" | "error" | "info"; text: (r: Region) => string }
  >
> = {
  offline: {
    variant: "error",
    text: (r) =>
      `Your region is offline. Last heartbeat ${ago(r.lastHeartbeatAt)}. Calls on it can't run, and recordings and transcripts can't be opened until it is back.`
  },
  unsupported: {
    variant: "warning",
    text: (r) =>
      r.unsupportedReason ||
      "This version is outside the supported window. Config sync is paused and calls keep running on the last synced config. Upgrade your region."
  },
  degraded: {
    variant: "warning",
    text: () =>
      "A component of your region is unhealthy (no media node or gateway is reporting)."
  },
  waiting: {
    variant: "info",
    text: () =>
      "Your region hasn't connected yet. Use the install commands to connect it."
  }
};

/** Settings → Region. Private: status, nodes and controls. Public: read-only. */
export function RegionSettings() {
  const workspace = useWorkspace();
  const api = useRegionsApi();
  const queryClient = useQueryClient();
  const { billing } = useCapabilities();
  const { data: region, isPrivate, isLoading, error } = useRegion();
  const [confirming, setConfirming] = useState(false);
  const [token, setToken] = useState<EnrollmentToken>();
  const [action, setAction] = useState<{ pending?: boolean; error?: unknown }>(
    {}
  );

  if (!isPrivate)
    return (
      <section aria-label="Region" className="flex max-w-xl flex-col gap-3">
        <dl>
          <Row label="Region" value={workspaceRegion(workspace)} />
          <Row label="Type" value="Public" />
        </dl>
        <p className="font-display text-xs text-muted-foreground">
          The region was chosen when the workspace was created and can't be
          changed.
        </p>
      </section>
    );
  if (isLoading) return <p>Loading…</p>;
  if (error || !region)
    return (
      <Alert variant="error">
        {errorMessage(error ?? "Couldn't load the region")}
      </Alert>
    );

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: regionKey(workspace.ref) });
  const reissue = async () => {
    setAction({ pending: true });
    try {
      setToken(await api.reissueRegionToken());
      setAction({});
    } catch (e) {
      setAction({ error: e });
    }
  };
  const disconnect = async () => {
    setAction({ pending: true });
    try {
      await api.disconnectRegion();
      setConfirming(false);
      setAction({});
      await refresh();
    } catch (e) {
      setAction({ error: e });
    }
  };
  const note = STATUS_NOTE[region.status];

  return (
    <section aria-label="Region" className="flex max-w-xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-medium">{region.name}</h2>
        <StatusPill status={region.status} />
      </div>
      {note && <Alert variant={note.variant}>{note.text(region)}</Alert>}
      {action.error !== undefined && (
        <Alert variant="error">{errorMessage(action.error)}</Alert>
      )}
      <dl>
        <Row label="Region" value={region.ref} />
        <Row label="Version" value={region.version} />
        <Row label="Last heartbeat" value={ago(region.lastHeartbeatAt)} />
        <Row label="Media nodes" value={region.mediaNodes} />
        <Row label="Gateways" value={region.gateways} />
        <Row label="Active calls" value={region.activeCalls} />
        <Row
          label="Enrolled"
          value={region.enrolledAt ? formatDate(region.enrolledAt) : undefined}
        />
      </dl>
      {region.status === "waiting" && (
        <Button asChild variant="outline" className="self-start">
          <Link to="../../region-setup" relative="path">
            Open setup
          </Link>
        </Button>
      )}
      {token && (
        <div className="flex flex-col gap-3">
          <Alert variant="info">
            New token, shown once. Enrolling with it replaces your region's
            current credentials
            {remaining(token.expiresAt)
              ? ` (expires in ${remaining(token.expiresAt)})`
              : ""}
            .
          </Alert>
          <CopyField label="Enrollment token" value={token.token} />
          <CopyField
            label="Docker Compose"
            value={composeCommand(token.token)}
          />
          <CopyField label="Helm" value={helmCommand(token.token)} />
        </div>
      )}
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
      {billing.enabled && (
        <p className="font-display text-xs text-muted-foreground">
          Billing: a flat monthly fee per private region. Usage is shown, not
          billed. You pay your own carriers and vendors.
        </p>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Disconnect your region?"
        description="Its credentials are revoked and the region stops taking calls until you enroll it again with a new token. Data on your servers isn't touched."
        confirmLabel="Disconnect"
        pending={action.pending}
        error={action.error}
        onConfirm={() => void disconnect()}
      />
    </section>
  );
}
