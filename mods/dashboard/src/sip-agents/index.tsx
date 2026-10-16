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
import { Plus, Smartphone } from "lucide-react";
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
import { RowActions } from "~/components/data/row-actions";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { TableNote } from "~/domains/table-note";
import { SipUserDrawer } from "./sip-user-drawer";
import {
  sipUri,
  useDeleteSipUser,
  useSipUsers,
  useToggleSipUser,
  type SipUserRow
} from "./sip-users.service";

export default function SipUsersScreen() {
  const list = useSipUsers();
  const remove = useDeleteSipUser();
  const toggle = useToggleSipUser();
  const [editing, setEditing] = useState<SipUserRow | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState<SipUserRow | undefined>();

  const openDrawer = (sipUser?: SipUserRow) => {
    setEditing(sipUser);
    setDrawerOpen(true);
  };

  const add = (
    <Button onClick={() => openDrawer()}>
      <Plus aria-hidden /> Add SIP user
    </Button>
  );

  const columns: Column<SipUserRow>[] = [
    {
      header: "Name",
      cell: (u) => <NameCell name={u.name} sub={sipUri(u)} />
    },
    {
      header: "Username",
      className: "w-32",
      cell: (u) => <MutedCell>{u.username}</MutedCell>
    },
    {
      header: "Domain",
      cell: (u) => <MutedCell>{u.domain?.domainUri ?? "—"}</MutedCell>
    },
    {
      header: "Privacy",
      className: "w-24",
      cell: (u) => (
        <MutedCell>{u.privacy === "PRIVATE" ? "Private" : "None"}</MutedCell>
      )
    },
    {
      header: "Max contacts",
      className: "w-32",
      cell: (u) => <MutedCell>{u.maxContacts ?? "—"}</MutedCell>
    },
    {
      header: "Enabled",
      className: "w-24",
      cell: (u) => {
        const pending = toggle.isPending && toggle.variables?.ref === u.ref;
        return (
          <div onClick={(event) => event.stopPropagation()}>
            <Switch
              aria-label={`Enable ${u.name}`}
              checked={
                pending ? (toggle.variables?.enabled ?? u.enabled) : u.enabled
              }
              disabled={pending}
              onCheckedChange={(enabled) =>
                toggle.mutate({ ref: u.ref, enabled })
              }
            />
          </div>
        );
      }
    },
    {
      header: "",
      className: "w-14",
      cell: (u) => (
        <RowActions
          label={u.name}
          onEdit={() => openDrawer(u)}
          onDelete={() => setDeleting(u)}
        />
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="SIP users"
        description="Phones, softphones and agents' desks that register to your domains."
        actions={list.rows.length > 0 && add}
      />
      <div className="px-4 pb-8 sm:px-8">
        <DataTable
          label="SIP users"
          columns={columns}
          rows={list.rows}
          rowKey={(u) => u.ref}
          onRowClick={openDrawer}
          loading={list.isPending}
          error={list.error}
          onRetry={() => void list.refetch()}
          hasMore={list.hasNextPage}
          loadingMore={list.isFetchingNextPage}
          onLoadMore={() => void list.fetchNextPage()}
          empty={
            <EmptyState
              icon={Smartphone}
              title="No SIP users yet"
              description="Add a SIP user for each phone, softphone or desk that should register to one of your domains."
              action={add}
            />
          }
        />
        {list.rows.length > 0 && (
          <TableNote>
            Numbers can route straight to a SIP user. Set that on the number.
          </TableNote>
        )}
      </div>
      <SipUserDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        sipUser={editing}
        onDelete={(sipUser) => {
          setDrawerOpen(false);
          setDeleting(sipUser);
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
        title={`Delete ${deleting?.name ?? "SIP user"}?`}
        description="Devices signed in as this user will be disconnected, and numbers routed to it will stop ringing."
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
