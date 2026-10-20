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
import type { Obj } from "../api";
import { credits, dollars, number, shortDate, time } from "../format";
import { Mono, Muted, PageHeader, Section, Table, Tile } from "../ui";
import {
  DeliveryStatus,
  eventCustomer,
  eventsById,
  type ScreenProps
} from "./common";

/** The licensed (flat) price of a subscription: the plan. */
const planOf = (sub?: Obj) =>
  (sub?.items?.data as Obj[] | undefined)?.find(
    (i) => i.price?.recurring?.usage_type !== "metered"
  )?.price;

export function Customers({ state, customer, selectCustomer }: ScreenProps) {
  if (!customer)
    return (
      <>
        <PageHeader title="Customers" />
        <Muted>
          No customers yet. They appear here as soon as billing creates them.
        </Muted>
      </>
    );

  const id = customer.id as string;
  const balance = state.balances[id] ?? {
    promotional: 0,
    paid: 0,
    available: 0
  };
  const sub = state.subscriptions.find(
    (s) => s.customer === id && s.status !== "canceled"
  );
  const plan = planOf(sub);
  const at =
    (state.clocks.find((c) => c.id === customer.test_clock)
      ?.frozen_time as number) ?? state.now;
  const grants = state.creditGrants.filter(
    (g) =>
      g.customer === id &&
      !g.voided_at &&
      g.effective_at <= at &&
      (g.expires_at === null || g.expires_at > at)
  );
  const promotionalTotal = grants
    .filter((g) => g.category === "promotional")
    .reduce((n, g) => n + g.amount.monetary.value, 0);
  const nextExpiry = (category: string) =>
    grants
      .filter(
        (g) =>
          g.category === category &&
          g.expires_at &&
          state.grantRemaining[g.id] > 0
      )
      .map((g) => g.expires_at as number)
      .sort()[0];

  // This period: the subscription's, or everything without one.
  const item = sub?.items?.data?.[0];
  const from = (item?.current_period_start as number) ?? 0;
  const to = (item?.current_period_end as number) ?? Infinity;
  const totals = state.meters.map((m) => ({
    meter: m,
    total: state.meterEvents
      .filter(
        (e) =>
          e.status === "accepted" &&
          e.customer === id &&
          e.eventName === m.event_name &&
          e.timestamp >= from &&
          e.timestamp < to
      )
      .reduce((n, e) => n + e.value, 0)
  }));

  const events = eventsById(state);
  const deliveries = state.deliveries
    .filter((d) => eventCustomer(events.get(d.event)) === id)
    .slice(-5)
    .reverse();

  const year = new Date(at * 1000).getUTCFullYear();
  const planExpiry = nextExpiry("promotional");
  const topupExpiry = nextExpiry("paid");

  return (
    <>
      <PageHeader
        breadcrumb={<>Customers / {id}</>}
        title={
          <>
            {customer.name ?? customer.email ?? "Customer"} · {id}
          </>
        }
        sub={
          <>
            {customer.metadata?.owner_ref ? (
              <>owner {customer.metadata.owner_ref} · </>
            ) : null}
            {plan ? (
              <>
                Subscribed, {dollars(plan.unit_amount)}/
                {plan.recurring.interval}
              </>
            ) : (
              "No subscription"
            )}
          </>
        }
      />
      <div className="flex gap-4">
        <Tile
          label="Credit balance"
          value={<>{credits(balance.available)} credits</>}
          sub={dollars(balance.available)}
        />
        <Tile
          label="Plan credits left"
          value={
            promotionalTotal ? (
              <>
                {credits(balance.promotional)} of {credits(promotionalTotal)}
              </>
            ) : (
              credits(balance.promotional)
            )
          }
          sub={planExpiry ? <>expire {shortDate(planExpiry, year)}</> : "none"}
          bar={
            promotionalTotal
              ? balance.promotional / promotionalTotal
              : undefined
          }
        />
        <Tile
          label="Top-up credits"
          value={credits(balance.paid)}
          sub={
            topupExpiry ? <>expire {shortDate(topupExpiry, year)}</> : "none"
          }
        />
      </div>
      <Section title="Meter totals this period">
        <Table
          columns={[
            { label: "Meter" },
            { label: "Name", width: 200 },
            { label: "Total", width: 100 }
          ]}
          empty="No meters yet."
          rows={totals.map(({ meter, total }) => ({
            key: meter.id,
            cells: [
              <Mono key="m">{meter.event_name}</Mono>,
              meter.display_name,
              number(total)
            ]
          }))}
        />
      </Section>
      <Section title="Recent webhooks">
        <Table
          columns={[
            { label: "Event" },
            { label: "Status", width: 100 },
            { label: "Time", width: 80 }
          ]}
          empty="No webhooks for this customer yet."
          rows={deliveries.map((d) => ({
            key: d.id,
            cells: [
              <Mono key="e">{events.get(d.event)?.type}</Mono>,
              <DeliveryStatus key="s" d={d} />,
              time(
                d.attempts[d.attempts.length - 1]?.at ??
                  events.get(d.event)?.created
              )
            ]
          }))}
        />
      </Section>
      {state.customers.length > 1 && (
        <Section title="All customers">
          <Table
            columns={[
              { label: "Customer" },
              { label: "Name", width: 220 },
              { label: "Credit balance", width: 160 }
            ]}
            empty=""
            rows={state.customers.map((c) => ({
              key: c.id,
              selected: c.id === id,
              onClick: () => selectCustomer(c.id),
              cells: [
                <Mono key="i">{c.id}</Mono>,
                c.name ?? c.email ?? "—",
                <>{credits(state.balances[c.id]?.available ?? 0)} credits</>
              ]
            }))}
          />
        </Section>
      )}
    </>
  );
}
