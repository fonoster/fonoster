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
import { Globe, Plus } from "lucide-react";
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
import { DomainDrawer } from "./domain-drawer";
import {
  phoneOf,
  useDeleteDomain,
  useDomains,
  useNumberLookup,
  type DomainRow
} from "./domains.service";
import { TableNote } from "./table-note";

export default function DomainsScreen() {
  const list = useDomains();
  const numbers = useNumberLookup();
  const remove = useDeleteDomain();
  const [editing, setEditing] = useState<DomainRow | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState<DomainRow | undefined>();

  const numberLabel = (ref: string) =>
    phoneOf(numbers.items.find((number) => number.ref === ref)) ?? ref;

  const openDrawer = (domain?: DomainRow) => {
    setEditing(domain);
    setDrawerOpen(true);
  };

  const add = (
    <Button onClick={() => openDrawer()}>
      <Plus aria-hidden /> Create domain
    </Button>
  );

  const columns: Column<DomainRow>[] = [
    { header: "Domain", cell: (d) => <NameCell name={d.name} sub={d.ref} /> },
    {
      header: "URI",
      cell: (d) => <MutedCell>{d.domainUri}</MutedCell>
    },
    {
      header: "Access control",
      className: "w-44",
      cell: (d) => <MutedCell>{d.accessControlList?.name ?? "—"}</MutedCell>
    },
    {
      header: "Egress rules",
      cell: (d) =>
        d.egressPolicies.length === 0 ? (
          <MutedCell>—</MutedCell>
        ) : (
          <ul className="flex flex-col gap-0.5 text-muted-foreground">
            {d.egressPolicies.map((policy, index) => (
              <li key={index} className="truncate">
                <span className="font-mono">{policy.rule}</span> →{" "}
                {numberLabel(policy.numberRef)}
              </li>
            ))}
          </ul>
        )
    },
    {
      header: "",
      className: "w-14",
      cell: (d) => (
        <RowActions
          label={d.name}
          onEdit={() => openDrawer(d)}
          onDelete={() => setDeleting(d)}
        />
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Domains"
        description="SIP domains your phones and softphones register to."
        actions={list.rows.length > 0 && add}
      />
      <div className="px-4 pb-8 sm:px-8">
        <DataTable
          label="Domains"
          columns={columns}
          rows={list.rows}
          rowKey={(d) => d.ref}
          onRowClick={openDrawer}
          loading={list.isPending}
          error={list.error}
          onRetry={() => void list.refetch()}
          hasMore={list.hasNextPage}
          loadingMore={list.isFetchingNextPage}
          onLoadMore={() => void list.fetchNextPage()}
          empty={
            <EmptyState
              icon={Globe}
              title="No domains yet"
              description="Add a SIP domain so your phones and softphones have somewhere to register."
              action={add}
            />
          }
        />
        {list.rows.length > 0 && (
          <TableNote>
            Egress rules pick the caller ID when a SIP agent dials out: a regex
            on the dialed number, mapped to one of your numbers.
          </TableNote>
        )}
      </div>
      <DomainDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        domain={editing}
        onDelete={(domain) => {
          setDrawerOpen(false);
          setDeleting(domain);
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
        title={`Delete ${deleting?.name ?? "domain"}?`}
        description="SIP agents on this domain will no longer be able to register or make calls."
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
