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
import { formatDate } from "~/lib/format";
import { ExternalLink, KeyRound, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { DOCS_URL } from "~/app/shell/nav";
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
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DropdownMenuItem } from "~/components/ui/dropdown-menu";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { errorMessage, useSessionMutation, useSessionQuery } from "./api";
import type { CatalogEntry } from "./types";

type Row = { provider: CatalogEntry; updatedAt?: string };

/** Where the operator learns to configure vendors and their platform keys. */
const PLATFORM_KEYS_URL = `${DOCS_URL}self-hosting/install-compose#add-platform-keys`;

/** List dates read like the rest of the dashboard ("Today 14:31", "Oct 2"). */
const when = (iso?: string) => formatDate(iso);

/**
 * Bring your own vendor key (add-provider-registry P1): the keys this workspace added, one per
 * catalog provider, stored write-only. Calls use them instead of the platform's key; providers
 * without one here use the platform's key.
 */
export default function VendorKeysScreen() {
  const loaded = useSessionQuery(["vendor-keys"], async (api) => ({
    catalog: await api.getCatalog(),
    keys: await api.listVendorKeys()
  }));
  const remove = useSessionMutation(
    (api, providerId: string) => api.deleteVendorKey(providerId),
    { success: "Vendor key removed" }
  );
  const [editing, setEditing] = useState<{ providerId?: string }>();
  const [removing, setRemoving] = useState<Row>();

  // Keyless providers (the fakes, local models) take no key.
  const providers = (loaded.data?.catalog.providers ?? []).filter(
    (p) => !p.keyless
  );
  const rows: Row[] = (loaded.data?.keys ?? []).map((k) => ({
    provider: providers.find((p) => p.id === k.providerId) ?? {
      id: k.providerId,
      label: k.providerId,
      state: "active"
    },
    updatedAt: k.updatedAt
  }));
  const available = providers.filter(
    (p) => !rows.some((r) => r.provider.id === p.id)
  );

  const add = available.length > 0 && (
    <Button onClick={() => setEditing({})}>
      <Plus aria-hidden /> Add key
    </Button>
  );

  const columns: Column<Row>[] = [
    {
      header: "Provider",
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-2">
          <NameCell mono name={r.provider.label} sub={r.provider.id} />
          {r.provider.state === "deprecated" && (
            <Badge variant="warning">deprecated</Badge>
          )}
        </div>
      )
    },
    {
      header: "Updated",
      className: "w-56",
      cell: (r) => <MutedCell>{when(r.updatedAt)}</MutedCell>
    },
    {
      header: "",
      className: "w-12",
      cell: (r) => (
        <RowActions
          label={r.provider.label}
          onDelete={() => setRemoving(r)}
          deleteLabel="Remove"
        >
          <DropdownMenuItem
            onSelect={() => setEditing({ providerId: r.provider.id })}
          >
            <RefreshCw /> Replace key
          </DropdownMenuItem>
        </RowActions>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Vendor keys"
        description="Use your own speech, language-model and noise-cancelling accounts. Providers without a key here use the platform's key. Keys are stored encrypted and can't be read back."
        actions={rows.length > 0 && add}
      />
      <div className="px-4 pb-10 sm:px-8">
        <DataTable
          label="Vendor keys"
          columns={columns}
          rows={rows}
          rowKey={(r) => r.provider.id}
          onRowClick={(r) => setEditing({ providerId: r.provider.id })}
          loading={loaded.loading}
          error={loaded.error}
          onRetry={loaded.reload}
          empty={
            providers.length ? (
              <EmptyState
                icon={KeyRound}
                title="No vendor keys"
                description="Calls use the platform's keys. Add your own to use your speech, language-model and noise-cancelling accounts."
                action={add}
              />
            ) : (
              <EmptyState
                icon={KeyRound}
                title="No vendors configured"
                description="Calls need at least a text-to-speech vendor. The operator adds vendors and their platform keys to the server's config."
                action={
                  <Button variant="outline" asChild>
                    <a
                      href={PLATFORM_KEYS_URL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Add platform keys <ExternalLink aria-hidden />
                    </a>
                  </Button>
                }
              />
            )
          }
        />
      </div>
      <VendorKeyDrawer
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(undefined)}
        providerId={editing?.providerId}
        providers={editing?.providerId ? providers : available}
      />
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) {
            setRemoving(undefined);
            remove.reset();
          }
        }}
        title={`Remove your ${removing?.provider.label ?? ""} key?`}
        description="Calls go back to the platform's key for this provider."
        confirmLabel="Remove"
        pending={remove.isPending}
        error={remove.error}
        onConfirm={() =>
          removing &&
          remove.mutate(removing.provider.id, {
            onSuccess: () => setRemoving(undefined)
          })
        }
      />
    </>
  );
}

/** Add a key for a provider, or replace the stored one (providerId set). */
function VendorKeyDrawer({
  open,
  onOpenChange,
  providerId,
  providers
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId?: string;
  providers: CatalogEntry[];
}) {
  const [provider, setProvider] = useState("");
  const [key, setKey] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const label = (id: string) => providers.find((p) => p.id === id)?.label ?? id;
  const save = useSessionMutation(
    (api, input: { providerId: string; key: string }) =>
      api.setVendorKey(input.providerId, input.key),
    { success: (_, input) => `Key saved for ${label(input.providerId)}` }
  );

  useEffect(() => {
    if (!open) return;
    // With a single choice left, it's already picked.
    setProvider(providerId ?? (providers.length === 1 ? providers[0].id : ""));
    setKey("");
    setErrors({});
    save.reset();
    // Reset when the drawer opens for a (different) provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, providerId]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!provider) found.provider = "Choose a provider";
    if (!key.trim()) found.key = "Enter the API key";
    setErrors(found);
    if (Object.keys(found).length) return;
    save.mutate(
      { providerId: provider, key: key.trim() },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        monoTitle
        title={
          providerId ? `Replace ${label(providerId)} key` : "Add vendor key"
        }
        description="Calls in this workspace use it instead of the platform's key."
        footer={
          <>
            <span />
            <div className="flex gap-2.5">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="vendor-key-form"
                loading={save.isPending}
              >
                {providerId ? "Save" : "Add key"}
              </Button>
            </div>
          </>
        }
      >
        <form
          id="vendor-key-form"
          onSubmit={submit}
          className="flex flex-col gap-[22px]"
          noValidate
        >
          {save.error && (
            <Alert variant="error">{errorMessage(save.error)}</Alert>
          )}
          <Field label="Provider" error={errors.provider}>
            {(p) => (
              <Select
                {...p}
                value={provider}
                placeholder="Choose a provider"
                disabled={Boolean(providerId)}
                options={providers.map((x) => ({
                  value: x.id,
                  label: x.label
                }))}
                onValueChange={setProvider}
              />
            )}
          </Field>
          <Field
            label="API key"
            error={errors.key}
            hint="Stored encrypted. It can't be read back."
          >
            {(p) => (
              <Input
                {...p}
                type="password"
                autoComplete="off"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            )}
          </Field>
        </form>
      </SheetContent>
    </Sheet>
  );
}
