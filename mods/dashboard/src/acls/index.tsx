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
import type { Acl } from "@fonoster/types";
import { Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import { DataTable, NameCell, type Column } from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { RowActions } from "~/components/data/row-actions";
import { Button } from "~/components/ui/button";
import { PageHeader } from "~/app/shell/page";
import { AclDrawer } from "./acl-drawer";
import { useAclUsage, useAcls, useDeleteAcl } from "./acls.service";
import { AllowChips, UsedByCell } from "./cells";

export default function AclsScreen() {
  const list = useAcls();
  const remove = useDeleteAcl();
  const { usage, ready } = useAclUsage();
  const [editing, setEditing] = useState<Acl | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState<Acl | undefined>();

  // Undefined while trunks/domains load or when they can't be listed.
  const usedBy = (acl?: Acl) =>
    acl && ready ? (usage.get(acl.ref) ?? []) : undefined;

  const openDrawer = (acl?: Acl) => {
    setEditing(acl);
    setDrawerOpen(true);
  };

  const add = (
    <Button onClick={() => openDrawer()}>
      <Plus aria-hidden /> Create ACL
    </Button>
  );

  const columns: Column<Acl>[] = [
    { header: "Name", cell: (a) => <NameCell name={a.name} sub={a.ref} /> },
    {
      header: "Allow",
      className: "w-[38%]",
      cell: (a) => <AllowChips allow={a.allow ?? []} />
    },
    {
      header: "Used by",
      className: "w-56",
      cell: (a) => <UsedByCell labels={usedBy(a)} />
    },
    {
      header: "",
      className: "w-14",
      cell: (a) => (
        <RowActions
          label={a.name}
          onEdit={() => openDrawer(a)}
          onDelete={() => setDeleting(a)}
        />
      )
    }
  ];

  const deletingUsage = usedBy(deleting) ?? [];

  return (
    <>
      <PageHeader
        title="Access control lists"
        description="IP allowlists for trunks and domains. Anything not listed is rejected."
        actions={list.items.length > 0 && add}
      />
      <div className="px-4 pb-8 sm:px-8">
        <DataTable
          label="Access control lists"
          columns={columns}
          rows={list.items}
          rowKey={(a) => a.ref}
          onRowClick={openDrawer}
          loading={list.isPending}
          error={list.error}
          onRetry={() => void list.refetch()}
          hasMore={list.hasNextPage}
          loadingMore={list.isFetchingNextPage}
          onLoadMore={() => void list.fetchNextPage()}
          empty={
            <EmptyState
              icon={ShieldCheck}
              title="No ACLs yet"
              description="Add the IP addresses your carrier or office sends traffic from, then attach the list to a trunk or domain."
              action={add}
            />
          }
        />
      </div>
      <AclDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        acl={editing}
        usedBy={usedBy(editing)}
        onDelete={(acl) => {
          setDrawerOpen(false);
          setDeleting(acl);
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
        title={`Delete ${deleting?.name ?? "ACL"}?`}
        description={
          deletingUsage.length > 0
            ? `It's attached to ${deletingUsage.join(", ")}. Detach it there first, or the delete may be refused.`
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
