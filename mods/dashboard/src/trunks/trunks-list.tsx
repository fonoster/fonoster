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
import type { Trunk } from "@fonoster/types";
import { Network, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useAllNumbers } from "~/numbers/numbers.service";
import { trunkRefs } from "./trunk-form";
import { useDeleteTrunk, useTrunks } from "./trunks.service";

function outbound(trunk: Trunk) {
  const uri = trunk.uris?.[0];
  if (!uri) return "—";
  const host =
    uri.port && uri.port !== 5060 ? `${uri.host}:${uri.port}` : uri.host;
  const more =
    (trunk.uris?.length ?? 0) > 1 ? ` +${trunk.uris!.length - 1}` : "";
  return `${host} · ${uri.transport}${more}`;
}

function security(trunk: Trunk) {
  const refs = trunkRefs(trunk);
  return [
    refs.accessControlListRef && "ACL",
    (refs.inboundCredentialsRef || refs.outboundCredentialsRef) &&
      "Credentials",
    trunk.sendRegister && "REGISTER"
  ].filter((badge): badge is string => Boolean(badge));
}

export function TrunksList() {
  const navigate = useNavigate();
  const list = useTrunks();
  const numbers = useAllNumbers();
  const remove = useDeleteTrunk();
  const [deleting, setDeleting] = useState<Trunk | undefined>();

  const counts = new Map<string, number>();
  for (const n of numbers.data ?? []) {
    if (n.trunk?.ref)
      counts.set(n.trunk.ref, (counts.get(n.trunk.ref) ?? 0) + 1);
  }

  const open = (trunk: Trunk) => navigate(trunk.ref);

  const add = (
    <Button onClick={() => navigate("new")}>
      <Plus aria-hidden /> Add trunk
    </Button>
  );

  const columns: Column<Trunk>[] = [
    { header: "Trunk", cell: (t) => <NameCell name={t.name} sub={t.ref} /> },
    {
      header: "Inbound URI",
      cell: (t) => <MutedCell>{t.inboundUri || "—"}</MutedCell>
    },
    { header: "Outbound", cell: (t) => <MutedCell>{outbound(t)}</MutedCell> },
    {
      header: "Security",
      className: "w-56",
      cell: (t) => {
        const badges = security(t);
        return badges.length ? (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <Badge key={badge}>{badge}</Badge>
            ))}
          </div>
        ) : (
          <MutedCell>None</MutedCell>
        );
      }
    },
    {
      header: "Numbers",
      className: "w-24",
      cell: (t) =>
        numbers.isSuccess ? (
          <span>{counts.get(t.ref) ?? 0}</span>
        ) : (
          <MutedCell>—</MutedCell>
        )
    },
    {
      header: "",
      className: "w-14",
      cell: (t) => (
        <RowActions
          label={t.name}
          onEdit={() => open(t)}
          onDelete={() => setDeleting(t)}
        />
      )
    }
  ];

  const inUse = deleting ? (counts.get(deleting.ref) ?? 0) : 0;

  return (
    <>
      <PageHeader
        title="Trunks"
        description="Connections to your carriers. Numbers ride on trunks."
        actions={list.items.length > 0 && add}
      />
      <div className="px-4 pb-8 sm:px-8">
        <DataTable
          label="Trunks"
          columns={columns}
          rows={list.items}
          rowKey={(t) => t.ref}
          onRowClick={open}
          loading={list.isPending}
          error={list.error}
          onRetry={() => void list.refetch()}
          hasMore={list.hasNextPage}
          loadingMore={list.isFetchingNextPage}
          onLoadMore={() => void list.fetchNextPage()}
          empty={
            <EmptyState
              icon={Network}
              title="No trunks yet"
              description="Connect a carrier with a SIP trunk, then add its numbers and route them to agents."
              action={add}
            />
          }
        />
      </div>
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleting(undefined);
            remove.reset();
          }
        }}
        title={`Delete ${deleting?.name ?? "trunk"}?`}
        description={
          inUse > 0
            ? `${inUse} ${inUse === 1 ? "number uses" : "numbers use"} this trunk and will stop receiving calls through it.`
            : "Calls to and from this carrier will stop."
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
