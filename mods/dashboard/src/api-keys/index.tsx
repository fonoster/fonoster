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
import { KeyRound, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import {
  DataTable,
  MutedCell,
  type Column
} from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { RowActions } from "~/components/data/row-actions";
import { Button } from "~/components/ui/button";
import { DropdownMenuItem } from "~/components/ui/dropdown-menu";
import { PageHeader } from "~/app/shell/page";
import { formatDate, toDate } from "~/lib/format";
import { useWorkspace } from "~/lib/workspace";
import {
  ROLE_LABELS,
  type ApiKey,
  useApiKeys,
  useDeleteApiKey,
  useRegenerateApiKey
} from "./api-keys.service";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { ApiKeySecretDialog, type CreatedKey } from "./secret-dialog";

/** "Never" for keys without an expiry; "Expired" once it has passed. */
export function formatExpiry(expiresAt?: number, now = new Date()) {
  const date = toDate(expiresAt || null);
  if (!date) return "Never";
  const label = formatDate(date, now);
  return date.getTime() < now.getTime() ? `Expired ${label}` : label;
}

export default function ApiKeysScreen() {
  const workspace = useWorkspace();
  const list = useApiKeys();
  const remove = useDeleteApiKey();
  const regenerate = useRegenerateApiKey();
  const [creating, setCreating] = useState(false);
  const [shown, setShown] = useState<CreatedKey | undefined>();
  const [regenerating, setRegenerating] = useState<ApiKey | undefined>();
  const [deleting, setDeleting] = useState<ApiKey | undefined>();

  const add = (
    <Button onClick={() => setCreating(true)}>
      <Plus aria-hidden /> Create API key
    </Button>
  );

  const columns: Column<ApiKey>[] = [
    {
      header: "API key",
      cell: (k) => (
        <span className="block truncate font-mono text-[12px] text-foreground">
          {k.accessKeyId}
        </span>
      )
    },
    {
      header: "Role",
      className: "w-44",
      cell: (k) => <MutedCell>{ROLE_LABELS[k.role] ?? k.role}</MutedCell>
    },
    {
      header: "Expires",
      className: "w-36",
      cell: (k) => <MutedCell>{formatExpiry(k.expiresAt)}</MutedCell>
    },
    {
      header: "Created",
      className: "w-32",
      cell: (k) => <MutedCell>{formatDate(k.createdAt)}</MutedCell>
    },
    {
      header: "",
      className: "w-12",
      cell: (k) => (
        <RowActions label={k.accessKeyId} onDelete={() => setDeleting(k)}>
          <DropdownMenuItem onSelect={() => setRegenerating(k)}>
            <RefreshCw /> Regenerate
          </DropdownMenuItem>
        </RowActions>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="API keys"
        description="Authenticate the SDK and the ctl CLI against this workspace."
        actions={list.items.length > 0 && add}
      />
      <div className="px-4 pb-8 sm:px-8">
        <DataTable
          label="API keys"
          columns={columns}
          rows={list.items}
          rowKey={(k) => k.ref}
          loading={list.isPending}
          error={list.error}
          onRetry={() => void list.refetch()}
          hasMore={list.hasNextPage}
          loadingMore={list.isFetchingNextPage}
          onLoadMore={() => void list.fetchNextPage()}
          empty={
            <EmptyState
              icon={KeyRound}
              title="No API keys yet"
              description="Create a key to call the API from your backend with the SDK or the ctl CLI."
              action={add}
            />
          }
        />
      </div>
      <CreateApiKeyDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={setShown}
      />
      <ApiKeySecretDialog
        apiKey={shown}
        workspaceAccessKeyId={workspace.accessKeyId}
        onDone={() => setShown(undefined)}
      />
      <ConfirmDialog
        open={Boolean(regenerating)}
        onOpenChange={(open) => {
          if (!open) {
            setRegenerating(undefined);
            regenerate.reset();
          }
        }}
        title={`Regenerate ${regenerating?.accessKeyId ?? "API key"}?`}
        description="The current secret stops working right away. Anything using it needs the new one."
        confirmLabel="Regenerate"
        pending={regenerate.isPending}
        error={regenerate.error}
        onConfirm={() =>
          regenerating &&
          regenerate.mutate(regenerating.ref, {
            onSuccess: (key) => {
              setRegenerating(undefined);
              setShown(key);
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
        title={`Delete ${deleting?.accessKeyId ?? "API key"}?`}
        description="Apps and scripts using this key will stop working. This can't be undone."
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
