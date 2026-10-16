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
import { Plus, Webhook as WebhookIcon } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "~/app/shell/page";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import { CopyField } from "~/components/data/copy-field";
import {
  DataTable,
  MutedCell,
  NameCell,
  type Column
} from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { errorMessage, useAsync, useSessionApi } from "./api";
import type { Webhook, WebhookDelivery, WebhookEventType } from "./types";

export const EVENT_TYPES: { value: WebhookEventType; label: string }[] = [
  { value: "call.started", label: "Call started" },
  { value: "call.ended", label: "Call ended" },
  { value: "call.failed", label: "Call failed (never reached an app)" },
  { value: "call_record.sealed", label: "Call record sealed" },
  { value: "provider.deprecated", label: "Provider deprecated" }
];

export function validateWebhook(input: { url: string; events: string[] }) {
  const errors: Record<string, string> = {};
  if (!/^https:\/\/.+/.test(input.url.trim()))
    errors.url = "Webhook URLs must use https://";
  if (!input.events.length) errors.events = "Choose at least one event";
  return errors;
}

const DELIVERY_BADGE: Record<string, "success" | "warning" | "error"> = {
  succeeded: "success",
  pending: "warning",
  failed: "error"
};

const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { hour12: false }) : "";

export default function WebhooksScreen() {
  const api = useSessionApi();
  const endpoints = useAsync(() => api.listWebhooks(), [api]);
  const deliveries = useAsync(() => api.listDeliveries(), [api]);
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["call.ended"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<{ label: string; secret: string }>();
  const [rotating, setRotating] = useState<Webhook>();
  const [deleting, setDeleting] = useState<Webhook>();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setFailure(undefined);
    try {
      await work();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const create = () => {
    const found = validateWebhook({ url, events });
    setErrors(found);
    if (Object.keys(found).length) return;
    void run(async () => {
      const { secret } = await api.createWebhook({ url: url.trim(), events });
      setShown({ label: `Signing secret for ${url.trim()}`, secret });
      setAdding(false);
      setUrl("");
      setEvents(["call.ended"]);
      endpoints.reload();
    });
  };

  const add = (
    <Button onClick={() => setAdding(true)}>
      <Plus aria-hidden /> Add webhook
    </Button>
  );

  const columns: Column<Webhook>[] = [
    {
      header: "Endpoint",
      cell: (w) => <NameCell name={w.url} sub={w.events.join(", ")} />
    },
    {
      header: "Secret",
      className: "w-48",
      cell: (w) => (
        <MutedCell>
          {w.secretHint}
          {w.previousSecretUntil &&
            ` · previous valid until ${when(w.previousSecretUntil)}`}
        </MutedCell>
      )
    },
    {
      header: "",
      className: "w-56",
      cell: (w) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="outline"
            aria-label={`Rotate secret of ${w.url}`}
            onClick={() => setRotating(w)}
          >
            Rotate secret
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Delete ${w.url}`}
            onClick={() => setDeleting(w)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const deliveryColumns: Column<WebhookDelivery>[] = [
    {
      header: "Event",
      cell: (d) => <NameCell name={d.eventType} sub={d.eventId} />
    },
    {
      header: "Created",
      className: "w-44",
      cell: (d) => <MutedCell>{when(d.createdAt)}</MutedCell>
    },
    {
      header: "Attempts",
      className: "w-36",
      cell: (d) => (
        <MutedCell>
          {d.attempts} · last {d.lastStatus || "no response"}
        </MutedCell>
      )
    },
    {
      header: "Status",
      className: "w-28",
      cell: (d) => (
        <Badge variant={DELIVERY_BADGE[d.status] ?? "neutral"}>
          {d.status}
        </Badge>
      )
    },
    {
      header: "",
      className: "w-24",
      cell: (d) => (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          aria-label={`Resend ${d.eventId}`}
          onClick={() =>
            void run(async () => {
              await api.resendDelivery(d.ref);
              deliveries.reload();
            })
          }
        >
          Resend
        </Button>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Webhooks"
        description="Signed HTTPS callbacks for call events. Verify the X-Fonoster-Signature header with the endpoint's secret."
        actions={(endpoints.data?.length ?? 0) > 0 && !adding && add}
      />
      <div className="flex flex-col gap-6 px-4 pb-10 sm:px-8">
        {shown && (
          <Alert variant="warning">
            <CopyField
              label={`${shown.label} (shown once)`}
              value={shown.secret}
            />
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={() => setShown(undefined)}
            >
              I copied it
            </Button>
          </Alert>
        )}
        {failure && <Alert variant="error">{failure}</Alert>}
        {adding && (
          <section
            aria-label="New webhook"
            className="flex max-w-2xl flex-col gap-4 rounded-xl border border-border p-4"
          >
            <Field label="URL" error={errors.url}>
              {(p) => (
                <Input
                  {...p}
                  placeholder="https://example.com/fonoster/events"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              )}
            </Field>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Events</legend>
              {EVENT_TYPES.map((t) => (
                <label
                  key={t.value}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={events.includes(t.value)}
                    onCheckedChange={(on) =>
                      setEvents((list) =>
                        on
                          ? [...list, t.value]
                          : list.filter((x) => x !== t.value)
                      )
                    }
                  />
                  {t.label}
                  <span className="font-mono text-xs text-muted-foreground">
                    {t.value}
                  </span>
                </label>
              ))}
              {errors.events && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.events}
                </p>
              )}
            </fieldset>
            <div className="flex gap-2">
              <Button disabled={busy} onClick={create}>
                Create webhook
              </Button>
              <Button variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </section>
        )}
        <DataTable
          label="Webhooks"
          columns={columns}
          rows={endpoints.data ?? []}
          rowKey={(w) => w.ref}
          loading={endpoints.loading}
          error={endpoints.error}
          onRetry={endpoints.reload}
          empty={
            !adding && (
              <EmptyState
                icon={WebhookIcon}
                title="No webhooks yet"
                description="Get call.ended, call_record.sealed and other events at your HTTPS endpoint."
                action={add}
              />
            )
          }
        />
        <section aria-label="Deliveries" className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Recent deliveries</h2>
          <DataTable
            label="Deliveries"
            columns={deliveryColumns}
            rows={deliveries.data ?? []}
            rowKey={(d) => d.ref}
            loading={deliveries.loading}
            error={deliveries.error}
            onRetry={deliveries.reload}
            empty={
              <p className="p-4 text-xs text-muted-foreground">
                No deliveries yet.
              </p>
            }
          />
        </section>
      </div>
      <ConfirmDialog
        open={Boolean(rotating)}
        onOpenChange={(open) => !open && setRotating(undefined)}
        title="Rotate the signing secret?"
        description="The previous secret keeps verifying for 24 hours, so you can roll out the new one."
        confirmLabel="Rotate"
        pending={busy}
        onConfirm={() =>
          rotating &&
          void run(async () => {
            const { secret } = await api.rotateWebhookSecret(rotating.ref);
            setShown({
              label: `New signing secret for ${rotating.url}`,
              secret
            });
            setRotating(undefined);
            endpoints.reload();
          })
        }
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Delete this webhook?"
        description={`${deleting?.url ?? ""} stops receiving events. Pending deliveries fail.`}
        pending={busy}
        onConfirm={() =>
          deleting &&
          void run(async () => {
            await api.deleteWebhook(deleting.ref);
            setDeleting(undefined);
            endpoints.reload();
          })
        }
      />
    </>
  );
}
