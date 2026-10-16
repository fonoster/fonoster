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
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { useCapabilities } from "~/lib/capabilities";
import { errorMessage } from "~/lib/errors";
import { REGIONS_KEY, regionKey, useRegionDetail, useRegionsApi } from "./api";
import { ConnectionDetails } from "./connection";
import { secretCommand } from "./install";
import { ago, Row, STATUS_NOTE, StatusDot } from "./status";
import type { RegionToken } from "./types";

/** The right-side panel behind a region's More button. */
export function RegionDrawer({
  regionRef,
  onClose,
  onToken
}: {
  regionRef: string | null;
  onClose: () => void;
  onToken: (ref: string, token: RegionToken) => void;
}) {
  return (
    <Sheet open={!!regionRef} onOpenChange={(open) => !open && onClose()}>
      {regionRef && (
        <DrawerBody regionRef={regionRef} onToken={onToken} onClose={onClose} />
      )}
    </Sheet>
  );
}

function DrawerBody({
  regionRef: ref,
  onToken,
  onClose
}: {
  regionRef: string;
  onToken: (ref: string, token: RegionToken) => void;
  onClose: () => void;
}) {
  const api = useRegionsApi();
  const { billing } = useCapabilities();
  const queryClient = useQueryClient();
  const { data: region, error } = useRegionDetail(ref);
  const [confirming, setConfirming] = useState(false);
  const [action, setAction] = useState<{ pending?: boolean; error?: unknown }>(
    {}
  );

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: regionKey(ref) });
    void queryClient.invalidateQueries({ queryKey: REGIONS_KEY });
  };
  const run = async (fn: () => Promise<void>) => {
    setAction({ pending: true });
    try {
      await fn();
      setAction({});
    } catch (e) {
      setAction({ error: e });
    }
  };
  const reissue = () =>
    run(async () => {
      onToken(ref, await api.reissueRegionToken(ref));
      onClose();
    });
  const disconnect = () =>
    run(async () => {
      await api.disconnectRegion(ref);
      setConfirming(false);
      refresh();
    });

  const note = region && STATUS_NOTE[region.status];
  const missing = region?.secrets.filter((s) => !s.set) ?? [];

  return (
    <SheetContent
      title={region?.displayName ?? "Region"}
      description={region?.id}
      footer={
        region && (
          <>
            {confirming ? (
              <div className="flex w-full items-center justify-between gap-3">
                <span className="font-display text-[13px]">
                  Stops taking calls until you connect it again.
                </span>
                <span className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirming(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    loading={action.pending}
                    onClick={() => void disconnect()}
                  >
                    Confirm disconnect
                  </Button>
                </span>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  loading={action.pending}
                  onClick={() => void reissue()}
                >
                  Re-issue token
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setConfirming(true)}
                >
                  Disconnect
                </Button>
              </>
            )}
          </>
        )
      }
    >
      {error && !region && <Alert variant="error">{errorMessage(error)}</Alert>}
      {!region && !error && (
        <p className="font-display text-sm text-muted-foreground">Loading…</p>
      )}
      {region && (
        <>
          {note && <Alert variant={note.variant}>{note.text}</Alert>}
          {action.error !== undefined && (
            <Alert variant="error">{errorMessage(action.error)}</Alert>
          )}
          <dl>
            <div className="flex justify-between gap-4 border-b border-border py-2 font-display text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusDot status={region.status} />
              </dd>
            </div>
            <Row label="Version" value={region.version} />
            <Row label="Last seen" value={ago(region.lastSeenAt)} />
            <Row label="SIP domain" value={region.sipDomain} />
            {/* Cloud only (PR-11, AO-B5): the flat monthly fee; usage is shown, not billed. */}
            {billing.enabled && region.monthlyFeeCents != null && (
              <Row
                label="Monthly fee"
                value={`${formatFee(region.monthlyFeeCents)} / month${
                  region.minutesThisMonth != null
                    ? ` · ${Math.round(region.minutesThisMonth).toLocaleString("en-US")} min this month`
                    : ""
                }`}
              />
            )}
          </dl>
          <ConnectionDetails region={region} />
          <section aria-label="Workspaces" className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">
              Workspaces using this region
            </h3>
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
              <h3 className="text-sm font-medium">Keys</h3>
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
        </>
      )}
    </SheetContent>
  );
}

/** USD cents as "$49" or "$49.50". */
export function formatFee(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
}
