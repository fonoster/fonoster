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
import type { INumber } from "@fonoster/types";
import { Ban, ChevronDown, Phone, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu";
import { LinkTwilioDrawer } from "./link-twilio-drawer";
import { LinkWhatsAppDrawer } from "./link-whatsapp-drawer";
import { useApplicationOptions, useSipAgentOptions } from "./lookups";
import { NumberDrawer } from "./number-drawer";
import { useDeleteNumber, useNumbers } from "./numbers.service";
import { ROUTE_ICONS } from "./route-picker";
import {
  asLinkFlow,
  formatLocation,
  formatNumber,
  LINK_FLOWS,
  routeLabel,
  type LinkFlow
} from "./routing";

export default function NumbersScreen() {
  const list = useNumbers();
  const remove = useDeleteNumber();
  const apps = useApplicationOptions();
  const sipAgents = useSipAgentOptions();
  const [editing, setEditing] = useState<INumber | undefined>();
  // ?new=1 (the Overview checklist) opens the create drawer.
  const [search] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(search.get("new") === "1");
  const [deleting, setDeleting] = useState<INumber | undefined>();
  // ?link=twilio (the Overview checklist) opens that flow's drawer.
  const [linking, setLinking] = useState<LinkFlow | undefined>(
    asLinkFlow(search.get("link"))
  );
  const linkTrigger = useRef<HTMLButtonElement>(null);

  const openDrawer = (number?: INumber) => {
    setEditing(number);
    setDrawerOpen(true);
  };

  const actions = (align: "center" | "end") => (
    <>
      <Button onClick={() => openDrawer()}>
        <Plus aria-hidden /> Create number
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={linkTrigger} variant="outline">
            Link number <ChevronDown aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          {LINK_FLOWS.map((flow) => (
            <DropdownMenuItem
              key={flow.value}
              onSelect={() => setLinking(flow.value)}
            >
              {flow.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  const columns: Column<INumber>[] = [
    {
      header: "Number",
      cell: (n) => (
        <NameCell
          mono
          name={formatNumber(n.telUrl)}
          sub={n.name || undefined}
        />
      )
    },
    {
      header: "Routes to",
      cell: (n) => {
        const route = routeLabel(n, apps.data ?? [], sipAgents.data ?? []);
        if (!route)
          return (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Ban className="size-3.5" aria-hidden /> Not routed
            </span>
          );
        const Icon = ROUTE_ICONS[route.kind];
        return (
          <span className="flex min-w-0 items-center gap-2">
            <Icon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="truncate">{route.label}</span>
          </span>
        );
      }
    },
    {
      header: "Trunk",
      className: "w-36",
      cell: (n) => <MutedCell>{n.trunk?.name ?? "—"}</MutedCell>
    },
    {
      header: "Location",
      className: "w-48",
      cell: (n) => <MutedCell>{formatLocation(n)}</MutedCell>
    },
    {
      header: "",
      className: "w-14",
      cell: (n) => (
        <RowActions
          label={formatNumber(n.telUrl)}
          onEdit={() => openDrawer(n)}
          onDelete={() => setDeleting(n)}
        />
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Numbers"
        description="Phone numbers from your trunks, and where each one sends calls."
        actions={list.items.length > 0 && actions("end")}
      />
      <div className="px-4 pb-8 sm:px-8">
        <DataTable
          label="Numbers"
          columns={columns}
          rows={list.items}
          rowKey={(n) => n.ref}
          onRowClick={openDrawer}
          loading={list.isPending}
          error={list.error}
          onRetry={() => void list.refetch()}
          hasMore={list.hasNextPage}
          loadingMore={list.isFetchingNextPage}
          onLoadMore={() => void list.fetchNextPage()}
          empty={
            <EmptyState
              icon={Phone}
              title="No numbers yet"
              description="Add a number from one of your trunks, then send its calls to an agent, an app or a SIP agent."
              action={actions("center")}
            />
          }
        />
      </div>
      <NumberDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        number={editing}
        onDelete={(number) => {
          setDrawerOpen(false);
          setDeleting(number);
        }}
      />
      <LinkTwilioDrawer
        open={linking === "twilio"}
        onOpenChange={(open) => !open && setLinking(undefined)}
        returnFocusTo={linkTrigger}
      />
      <LinkWhatsAppDrawer
        open={linking === "whatsapp"}
        onOpenChange={(open) => !open && setLinking(undefined)}
        returnFocusTo={linkTrigger}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(undefined);
            remove.reset();
          }
        }}
        title={`Remove ${deleting ? formatNumber(deleting.telUrl) : "number"}?`}
        description="Calls to this number will stop reaching Fonoster. The number stays with your carrier."
        confirmLabel="Remove"
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
