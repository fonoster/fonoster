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
import type { Credentials } from "@fonoster/types";
import { KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import { DataTable, NameCell, type Column } from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { RowActions } from "~/components/data/row-actions";
import { Button } from "~/components/ui/button";
import { PageHeader } from "~/app/shell/page";
import { UsedByCell } from "~/acls/cells";
import { CredentialsDrawer } from "./credentials-drawer";
import {
  useCredentials,
  useCredentialsUsage,
  useDeleteCredentials
} from "./credentials.service";

export default function CredentialsScreen() {
  const list = useCredentials();
  const remove = useDeleteCredentials();
  const { usage, ready } = useCredentialsUsage();
  const [editing, setEditing] = useState<Credentials | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState<Credentials | undefined>();

  // Undefined while trunks/SIP agents load or when they can't be listed.
  const usedBy = (credentials?: Credentials) =>
    credentials && ready ? (usage.get(credentials.ref) ?? []) : undefined;

  const openDrawer = (credentials?: Credentials) => {
    setEditing(credentials);
    setDrawerOpen(true);
  };

  const add = (
    <Button onClick={() => openDrawer()}>
      <Plus aria-hidden /> Create credentials
    </Button>
  );

  const columns: Column<Credentials>[] = [
    { header: "Name", cell: (c) => <NameCell name={c.name} sub={c.ref} /> },
    {
      header: "Username",
      className: "w-44",
      cell: (c) => <span className="font-mono">{c.username}</span>
    },
    {
      header: "Password",
      className: "w-40",
      cell: () => (
        <span className="font-mono text-muted-foreground">
          <span aria-hidden>••••••••••</span>
          <span className="sr-only">Hidden</span>
        </span>
      )
    },
    {
      header: "Used by",
      className: "w-60",
      cell: (c) => <UsedByCell labels={usedBy(c)} />
    },
    {
      header: "",
      className: "w-14",
      cell: (c) => (
        <RowActions
          label={c.name}
          onEdit={() => openDrawer(c)}
          onDelete={() => setDeleting(c)}
        />
      )
    }
  ];

  const deletingUsage = usedBy(deleting) ?? [];

  return (
    <>
      <PageHeader
        title="Credentials"
        description="Username and password pairs for trunks and SIP agents. Passwords are never shown again."
        actions={list.items.length > 0 && add}
      />
      <div className="px-4 pb-8 sm:px-8">
        <DataTable
          label="Credentials"
          columns={columns}
          rows={list.items}
          rowKey={(c) => c.ref}
          onRowClick={openDrawer}
          loading={list.isPending}
          error={list.error}
          onRetry={() => void list.refetch()}
          hasMore={list.hasNextPage}
          loadingMore={list.isFetchingNextPage}
          onLoadMore={() => void list.fetchNextPage()}
          empty={
            <EmptyState
              icon={KeyRound}
              title="No credentials yet"
              description="Add the username and password a carrier gave you, or the ones your SIP agents sign in with."
              action={add}
            />
          }
        />
      </div>
      <CredentialsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        credentials={editing}
        usedBy={usedBy(editing)}
        onDelete={(credentials) => {
          setDrawerOpen(false);
          setDeleting(credentials);
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
        title={`Delete ${deleting?.name ?? "credentials"}?`}
        description={
          deletingUsage.length > 0
            ? `They're used by ${deletingUsage.join(", ")}. Those will fail to authenticate; detach them there first, or the delete may be refused.`
            : "This can't be undone."
        }
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
