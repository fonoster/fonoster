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
import { Mail, Plus, UserMinus, Users } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import {
  DataTable,
  MutedCell,
  NameCell,
  type Column
} from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { RowActions } from "~/components/data/row-actions";
import { Avatar, AvatarFallback, initials } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenuSeparator
} from "~/components/ui/dropdown-menu";
import { useWorkspace } from "~/lib/workspace";
import { InviteMemberDialog } from "./invite-member-dialog";
import {
  type Member,
  useMembers,
  useRemoveMember,
  useResendInvite
} from "./settings.service";

const ROLE_LABELS: Record<string, string> = {
  WORKSPACE_OWNER: "Owner",
  WORKSPACE_ADMIN: "Admin",
  WORKSPACE_MEMBER: "Member"
};

const isPending = (m: Member) => m.status === "PENDING";

/** "4 members · 1 pending" */
export function memberSummary(members: Member[]) {
  const pending = members.filter(isPending).length;
  const count = `${members.length} ${members.length === 1 ? "member" : "members"}`;
  return pending > 0 ? `${count} · ${pending} pending` : count;
}

export function MembersSettings() {
  const workspace = useWorkspace();
  const list = useMembers();
  const resend = useResendInvite();
  const remove = useRemoveMember();
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<Member | undefined>();

  const isOwner = (m: Member) =>
    m.role === "WORKSPACE_OWNER" || m.userRef === workspace.ownerRef;

  const invite = (
    <Button onClick={() => setInviting(true)}>
      <Plus aria-hidden /> Invite member
    </Button>
  );

  const columns: Column<Member>[] = [
    {
      header: "Member",
      cell: (m) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar>
            <AvatarFallback>{initials(m.name || m.email)}</AvatarFallback>
          </Avatar>
          <NameCell
            name={m.name || m.email}
            sub={m.name ? m.email : undefined}
          />
        </div>
      )
    },
    {
      header: "Role",
      className: "w-36",
      cell: (m) => (
        <MutedCell>
          {isOwner(m) ? "Owner" : (ROLE_LABELS[m.role] ?? m.role)}
        </MutedCell>
      )
    },
    {
      header: "Status",
      className: "w-36",
      cell: (m) =>
        isPending(m) ? (
          <Badge variant="warning">Invite sent</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        )
    },
    {
      header: "",
      className: "w-14",
      cell: (m) =>
        isOwner(m) ? null : (
          <RowActions label={m.name || m.email}>
            {isPending(m) && (
              <>
                <DropdownMenuItem onSelect={() => resend.mutate(m.userRef)}>
                  <Mail /> Resend invite
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setRemoving(m)}
            >
              <UserMinus /> Remove
            </DropdownMenuItem>
          </RowActions>
        )
    }
  ];

  return (
    <div className="flex flex-col gap-4">
      {list.items.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-sm text-muted-foreground">
            {memberSummary(list.items)}
          </p>
          {invite}
        </div>
      )}
      <DataTable
        label="Members"
        columns={columns}
        rows={list.items}
        rowKey={(m) => m.ref}
        loading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        hasMore={list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onLoadMore={() => void list.fetchNextPage()}
        empty={
          <EmptyState
            icon={Users}
            title="Just you so far"
            description="Invite teammates to build and run agents in this workspace."
            action={invite}
          />
        }
      />
      <InviteMemberDialog open={inviting} onOpenChange={setInviting} />
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) {
            setRemoving(undefined);
            remove.reset();
          }
        }}
        title={`Remove ${removing?.name || removing?.email || "member"}?`}
        description={
          removing && isPending(removing)
            ? "Their invite stops working."
            : "They lose access to this workspace right away."
        }
        confirmLabel="Remove"
        pending={remove.isPending}
        error={remove.error}
        onConfirm={() =>
          removing &&
          remove.mutate(removing.userRef, {
            onSuccess: () => setRemoving(undefined)
          })
        }
      />
    </div>
  );
}
