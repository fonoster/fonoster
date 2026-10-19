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
import type { Secret } from "@fonoster/types";
import { Lock, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import {
  DataTable,
  MutedCell,
  NameCell,
  type Column
} from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { RowActions } from "~/components/data/row-actions";
import { Button } from "~/components/ui/button";
import { PageHeader } from "~/app/shell/page";
import { formatDate } from "~/lib/format";
import { useWorkspace } from "~/lib/workspace";
import { PrivateSecrets, useRegion } from "~/regions";
import { SecretDrawer } from "./secret-drawer";
import { useDeleteSecret, useSecrets } from "./secrets.service";

export default function SecretsScreen() {
  const { isPrivate } = useRegion();
  return isPrivate ? <PrivateSecrets /> : <WorkspaceSecrets />;
}

function WorkspaceSecrets() {
  const workspace = useWorkspace();
  const list = useSecrets();
  const remove = useDeleteSecret();
  const [editing, setEditing] = useState<Secret | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState<Secret | undefined>();

  const openDrawer = (secret?: Secret) => {
    setEditing(secret);
    setDrawerOpen(true);
  };

  const add = (
    <Button onClick={() => openDrawer()}>
      <Plus aria-hidden /> Create secret
    </Button>
  );

  const columns: Column<Secret>[] = [
    { header: "Name", cell: (s) => <NameCell name={s.name} sub={s.ref} /> },
    {
      header: "Value",
      className: "w-56",
      cell: () => <MutedCell>••••••••••••</MutedCell>
    },
    {
      header: "Updated",
      className: "w-40",
      cell: (s) => (
        <MutedCell>{formatDate(s.updatedAt || s.createdAt)}</MutedCell>
      )
    },
    {
      header: "",
      className: "w-14",
      cell: (s) => (
        <RowActions
          label={s.name}
          onEdit={() => openDrawer(s)}
          onDelete={() => setDeleting(s)}
        />
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Secrets"
        description="Encrypted values for your agents' tools, like a CRM or helpdesk token. Your stream apps can reference them too. Values can't be read back."
        actions={list.items.length > 0 && add}
      />
      <div className="px-4 pb-8 sm:px-8">
        <DataTable
          label="Secrets"
          columns={columns}
          rows={list.items}
          rowKey={(s) => s.ref}
          onRowClick={openDrawer}
          loading={list.isPending}
          error={list.error}
          onRetry={() => void list.refetch()}
          hasMore={list.hasNextPage}
          loadingMore={list.isFetchingNextPage}
          onLoadMore={() => void list.fetchNextPage()}
          empty={
            <EmptyState
              icon={Lock}
              title="No secrets yet"
              description={
                <>
                  Store the tokens your agents&apos; tools need, then reference
                  them by name; your stream apps can use them too. For speech
                  and language models, use{" "}
                  <Link
                    to={`/w/${workspace.ref}/vendor-keys`}
                    className="text-foreground underline"
                  >
                    Vendor keys
                  </Link>
                  .
                </>
              }
              action={add}
            />
          }
        />
      </div>
      <SecretDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        secret={editing}
        onDelete={(secret) => {
          setDrawerOpen(false);
          setDeleting(secret);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(undefined);
            remove.reset();
          }
        }}
        title={`Delete ${deleting?.name ?? "secret"}?`}
        description="Agents and streams that use it will stop working until you add it again."
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
