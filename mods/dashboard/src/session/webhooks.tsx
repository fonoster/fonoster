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
import { Plus, RefreshCw, Webhook as WebhookIcon } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "~/app/shell/page";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import {
  DataTable,
  MutedCell,
  NameCell,
  type Column
} from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { RowActions } from "~/components/data/row-actions";
import { SecretDialog } from "~/components/data/secret-dialog";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { DropdownMenuItem } from "~/components/ui/dropdown-menu";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { errorMessage, useSessionMutation, useSessionQuery } from "./api";
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

/** A signing secret shown once, after creating a webhook or rotating its secret. */
type Shown = { url: string; secret: string };

export default function WebhooksScreen() {
  const endpoints = useSessionQuery(["webhooks"], (api) => api.listWebhooks());
  const deliveries = useSessionQuery(["webhook-deliveries"], (api) =>
    api.listDeliveries()
  );
  const rotate = useSessionMutation(
    (api, ref: string) => api.rotateWebhookSecret(ref),
    { success: "Signing secret rotated" }
  );
  const remove = useSessionMutation(
    (api, ref: string) => api.deleteWebhook(ref),
    { success: "Webhook deleted" }
  );
  const resend = useSessionMutation(
    (api, ref: string) => api.resendDelivery(ref),
    { success: "Delivery resent", toastErrors: true }
  );
  const [editing, setEditing] = useState<{ webhook?: Webhook }>();
  const [shown, setShown] = useState<Shown>();
  const [rotating, setRotating] = useState<Webhook>();
  const [deleting, setDeleting] = useState<Webhook>();

  const webhooks = endpoints.data ?? [];
  const urlOf = (ref: string) => webhooks.find((w) => w.ref === ref)?.url;

  const add = (
    <Button onClick={() => setEditing({})}>
      <Plus aria-hidden /> Create webhook
    </Button>
  );

  const columns: Column<Webhook>[] = [
    {
      header: "Endpoint",
      cell: (w) => <NameCell name={w.url} sub={w.events.join(", ")} />
    },
    {
      header: "Secret",
      className: "w-72",
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
      className: "w-12",
      cell: (w) => (
        <RowActions
          label={w.url}
          onEdit={() => setEditing({ webhook: w })}
          onDelete={() => setDeleting(w)}
        >
          <DropdownMenuItem onSelect={() => setRotating(w)}>
            <RefreshCw /> Rotate secret
          </DropdownMenuItem>
        </RowActions>
      )
    }
  ];

  const deliveryColumns: Column<WebhookDelivery>[] = [
    {
      header: "Event",
      cell: (d) => <NameCell name={d.eventType} sub={d.eventId} />
    },
    {
      header: "Endpoint",
      className: "w-72",
      cell: (d) => (
        <span className="block truncate text-muted-foreground">
          {urlOf(d.webhookRef) ?? "Deleted webhook"}
        </span>
      )
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
          disabled={resend.isPending}
          aria-label={`Resend ${d.eventId}`}
          onClick={() => resend.mutate(d.ref)}
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
        actions={webhooks.length > 0 && add}
      />
      <div className="flex flex-col gap-6 px-4 pb-10 sm:px-8">
        <DataTable
          label="Webhooks"
          columns={columns}
          rows={webhooks}
          rowKey={(w) => w.ref}
          onRowClick={(w) => setEditing({ webhook: w })}
          loading={endpoints.loading}
          error={endpoints.error}
          onRetry={endpoints.reload}
          empty={
            <EmptyState
              icon={WebhookIcon}
              title="No webhooks yet"
              description="Get call.ended, call_record.sealed and other events at your HTTPS endpoint."
              action={add}
            />
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
      <WebhookDrawer
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(undefined)}
        webhook={editing?.webhook}
        onCreated={setShown}
        onDelete={(w) => {
          setEditing(undefined);
          setDeleting(w);
        }}
      />
      <SecretDialog
        title="Save your signing secret"
        description={`This is the only time we'll show it. Use it to verify the X-Fonoster-Signature header on ${shown?.url ?? ""}.`}
        fields={shown && [{ label: "Signing secret", value: shown.secret }]}
        onDone={() => setShown(undefined)}
      />
      <ConfirmDialog
        open={Boolean(rotating)}
        onOpenChange={(open) => {
          if (!open) {
            setRotating(undefined);
            rotate.reset();
          }
        }}
        title="Rotate the signing secret?"
        description="The previous secret keeps verifying for 24 hours, so you can roll out the new one."
        confirmLabel="Rotate"
        pending={rotate.isPending}
        error={rotate.error}
        onConfirm={() =>
          rotating &&
          rotate.mutate(rotating.ref, {
            onSuccess: ({ secret }) => {
              setShown({ url: rotating.url, secret });
              setRotating(undefined);
            }
          })
        }
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(undefined);
            remove.reset();
          }
        }}
        title="Delete this webhook?"
        description={`${deleting?.url ?? ""} stops receiving events. Pending deliveries fail.`}
        pending={remove.isPending}
        error={remove.error}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.ref, {
            onSuccess: () => setDeleting(undefined)
          })
        }
      />
    </>
  );
}

/** Create a webhook, or change an existing one's URL and events (its secret stays). */
function WebhookDrawer({
  open,
  onOpenChange,
  webhook,
  onCreated,
  onDelete
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The webhook to edit; creates a new one when absent. */
  webhook?: Webhook;
  onCreated: (shown: Shown) => void;
  onDelete: (webhook: Webhook) => void;
}) {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useSessionMutation(
    (api, input: { url: string; events: string[] }) => api.createWebhook(input),
    { success: "Webhook created" }
  );
  const update = useSessionMutation(
    (api, input: { ref: string; url: string; events: string[] }) =>
      api.updateWebhook(input),
    { success: "Webhook saved" }
  );
  const mutation = webhook ? update : create;

  useEffect(() => {
    if (!open) return;
    setUrl(webhook?.url ?? "");
    setEvents(webhook?.events ?? ["call.ended"]);
    setErrors({});
    create.reset();
    update.reset();
    // Reset when the drawer opens for a (different) webhook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, webhook?.ref]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateWebhook({ url, events });
    setErrors(found);
    if (Object.keys(found).length) return;
    const input = { url: url.trim(), events };
    if (webhook) {
      update.mutate(
        { ref: webhook.ref, ...input },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      create.mutate(input, {
        onSuccess: ({ secret }) => {
          onOpenChange(false);
          onCreated({ url: input.url, secret });
        }
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={webhook ? webhook.url : "New webhook"}
        description={
          webhook
            ? `Signing secret ${webhook.secretHint}. Saving keeps the same secret.`
            : "We sign every delivery. You'll see the signing secret once, after you create it."
        }
        footer={
          <>
            {webhook ? (
              <button
                type="button"
                className="cursor-pointer font-display text-[13px] text-destructive hover:underline"
                onClick={() => onDelete(webhook)}
              >
                Delete webhook
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2.5">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="webhook-form"
                loading={mutation.isPending}
              >
                {webhook ? "Save" : "Create webhook"}
              </Button>
            </div>
          </>
        }
      >
        <form
          id="webhook-form"
          onSubmit={submit}
          className="flex flex-col gap-[22px]"
          noValidate
        >
          {mutation.error && (
            <Alert variant="error">{errorMessage(mutation.error)}</Alert>
          )}
          <Field label="URL" error={errors.url}>
            {(p) => (
              <Input
                {...p}
                placeholder="https://example.com/fonoster/events"
                autoComplete="off"
                spellCheck={false}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            )}
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-display text-[13px] font-medium">
              Events
            </legend>
            {EVENT_TYPES.map((t) => (
              <label
                key={t.value}
                className="flex items-center gap-2 font-display text-[13px]"
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
        </form>
      </SheetContent>
    </Sheet>
  );
}
