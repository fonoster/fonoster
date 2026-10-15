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
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "~/app/shell/page";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
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
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { errorMessage, useAsync, useSessionApi } from "./api";
import type { CatalogEntry } from "./types";

type Row = CatalogEntry & { keyUpdatedAt?: string; hasKey: boolean };

const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { hour12: false }) : "";

/**
 * Bring your own vendor key (add-provider-registry P1): a key per catalog provider, stored as a
 * write-only Secret. Calls in this workspace use it instead of the platform's key.
 */
export default function VendorKeysScreen() {
  const api = useSessionApi();
  const loaded = useAsync(
    async () => ({
      catalog: await api.getCatalog(),
      keys: await api.listVendorKeys()
    }),
    [api]
  );
  const [providerId, setProviderId] = useState("");
  const [key, setKey] = useState("");
  const [removing, setRemoving] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const [saved, setSaved] = useState<string>();

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setFailure(undefined);
    setSaved(undefined);
    try {
      await work();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const providers = loaded.data?.catalog.providers ?? [];
  const keys = loaded.data?.keys ?? [];
  const rows: Row[] = providers.map((p) => {
    const k = keys.find((x) => x.providerId === p.id);
    return { ...p, hasKey: Boolean(k), keyUpdatedAt: k?.updatedAt };
  });

  const columns: Column<Row>[] = [
    { header: "Provider", cell: (r) => <NameCell name={r.id} /> },
    {
      header: "Key",
      className: "w-64",
      cell: (r) =>
        r.hasKey ? (
          <MutedCell>Your key · updated {when(r.keyUpdatedAt)}</MutedCell>
        ) : (
          <MutedCell>Platform key</MutedCell>
        )
    },
    {
      header: "",
      className: "w-40",
      cell: (r) =>
        r.hasKey ? (
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Remove key for ${r.id}`}
            onClick={() => setRemoving(r.id)}
          >
            Remove key
          </Button>
        ) : r.state === "deprecated" ? (
          <Badge variant="warning">deprecated</Badge>
        ) : null
    }
  ];

  return (
    <>
      <PageHeader
        title="Vendor keys"
        description="Use your own speech and language-model accounts. Keys are stored encrypted and can't be read back."
      />
      <div className="flex flex-col gap-6 px-4 pb-10 sm:px-8">
        {failure && <Alert variant="error">{failure}</Alert>}
        {saved && <Alert variant="success">{saved}</Alert>}
        {providers.length > 0 && (
          <section
            aria-label="Add a key"
            className="flex max-w-2xl flex-col gap-4 rounded-xl border border-border p-4"
          >
            <Field label="Provider">
              {(p) => (
                <Select
                  {...p}
                  value={providerId}
                  placeholder="Choose a provider"
                  options={providers.map((x) => ({ value: x.id, label: x.id }))}
                  onValueChange={setProviderId}
                />
              )}
            </Field>
            <Field
              label="API key"
              hint="Replaces the key you stored before for this provider."
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
            <Button
              className="self-start"
              disabled={busy || !providerId || !key.trim()}
              onClick={() =>
                void run(async () => {
                  await api.setVendorKey(providerId, key.trim());
                  setSaved(`Key saved for ${providerId}`);
                  setKey("");
                  loaded.reload();
                })
              }
            >
              Save key
            </Button>
          </section>
        )}
        <DataTable
          label="Vendor keys"
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          loading={loaded.loading}
          error={loaded.error}
          onRetry={loaded.reload}
          empty={
            <EmptyState
              icon={KeyRound}
              title="No providers in the catalog"
              description="The operator adds providers with the fonoster-registry utility."
            />
          }
        />
      </div>
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(undefined)}
        title={`Remove your ${removing ?? ""} key?`}
        description="Calls go back to the platform's key for this provider."
        confirmLabel="Remove"
        pending={busy}
        onConfirm={() =>
          removing &&
          void run(async () => {
            await api.deleteVendorKey(removing);
            setRemoving(undefined);
            loaded.reload();
          })
        }
      />
    </>
  );
}
