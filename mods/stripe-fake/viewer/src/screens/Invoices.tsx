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
import { useState } from "react";
import { stripeCall, type Obj } from "../api";
import { date, dollars, minusDollars, number, shortDate } from "../format";
import { Button, Mono, Muted, PageHeader, Section, Table } from "../ui";
import type { ScreenProps } from "./common";

const creditsApplied = (inv: Obj) =>
  ((inv.total_pretax_credit_amounts as Obj[]) ?? []).reduce(
    (n, c) => n + c.amount,
    0
  );
const tax = (inv: Obj) =>
  (inv.total as number) - ((inv.total_excluding_tax as number) ?? inv.total);

/** `payment_failed` for an open invoice whose last charge failed, as billing sees it. */
function Status({ inv }: { inv: Obj }) {
  const failed = inv.status === "open" && inv.attempt_count > 0;
  return (
    <Muted danger={failed}>{failed ? "payment_failed" : inv.status}</Muted>
  );
}

export function Invoices({ state, run }: ScreenProps) {
  const [selectedId, setSelectedId] = useState<string>();
  const invoices = [...state.invoices].reverse();
  const selected = invoices.find((i) => i.id === selectedId) ?? invoices[0];
  const prices = new Map(state.prices.map((p) => [p.id as string, p]));
  const priceOf = (line: Obj) => prices.get(line.pricing?.price_details?.price);
  const metered = (line: Obj) =>
    priceOf(line)?.recurring?.usage_type === "metered";
  const lines = (inv: Obj) => inv.lines.data as Obj[];

  return (
    <>
      <PageHeader
        title="Invoices"
        sub="One invoice per customer per period. Advance the clock to close the current one."
      />
      <Table
        columns={[
          { label: "Number", width: 110 },
          { label: "Customer", width: 200 },
          { label: "Period" },
          { label: "Status", width: 130 },
          { label: "Plan", width: 90 },
          { label: "Usage lines", width: 120 },
          { label: "Credits applied", width: 130 },
          { label: "Total", width: 90 }
        ]}
        empty="No invoices yet."
        rows={invoices.map((inv) => {
          const usage = lines(inv).filter(metered);
          const plan = lines(inv).filter((l) => !metered(l));
          return {
            key: inv.id,
            selected: inv.id === selected?.id,
            onClick: () => setSelectedId(inv.id),
            cells: [
              inv.number ?? "draft",
              <Mono key="c">{inv.customer}</Mono>,
              inv.period_start === inv.period_end
                ? shortDate(inv.period_start)
                : `${shortDate(inv.period_start)} – ${shortDate(inv.period_end)}`,
              <Status key="s" inv={inv} />,
              dollars(plan.reduce((n, l) => n + l.amount, 0)),
              <>
                {usage.length} ·{" "}
                {dollars(usage.reduce((n, l) => n + l.amount, 0))}
              </>,
              minusDollars(creditsApplied(inv)),
              dollars(inv.total)
            ]
          };
        })}
      />
      {selected && (
        <Section>
          <div className="flex flex-col gap-3.5 rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="text-base font-semibold">
                  {selected.number ?? "Draft"} · <Mono>{selected.id}</Mono>
                </div>
                <div className="font-mono text-xs text-text-muted">
                  {selected.customer} · period {date(selected.period_start)} →{" "}
                  {date(selected.period_end)} · status {selected.status}
                </div>
              </div>
              {selected.status === "draft" && (
                <Button
                  onClick={() =>
                    run(() =>
                      stripeCall(`/v1/invoices/${selected.id}/finalize`)
                    )
                  }
                >
                  Finalize
                </Button>
              )}
            </div>
            <Table
              columns={[
                { label: "Line" },
                { label: "Quantity", width: 120 },
                { label: "Unit", width: 160 },
                { label: "Amount", width: 110 }
              ]}
              empty="No lines."
              rows={lines(selected).map((l) => {
                const price = priceOf(l);
                const meter = state.meters.find(
                  (m) => m.id === price?.recurring?.meter
                );
                return {
                  key: l.id,
                  cells: [
                    meter ? (
                      <Mono key="m">{meter.event_name}</Mono>
                    ) : (
                      l.description
                    ),
                    number(l.quantity ?? 1),
                    meter
                      ? meter.display_name
                      : (price?.recurring?.interval ?? "item"),
                    dollars(l.amount)
                  ]
                };
              })}
            />
            <div className="flex flex-col items-end gap-1.5 px-4 text-[13px]">
              <Total label="Subtotal" value={dollars(selected.subtotal)} />
              <Total
                label="Credits"
                value={minusDollars(creditsApplied(selected))}
              />
              {tax(selected) > 0 && (
                <Total label="Tax" value={dollars(tax(selected))} />
              )}
              <Total label="Total due" value={dollars(selected.total)} strong />
            </div>
          </div>
        </Section>
      )}
    </>
  );
}

const Total = ({
  label,
  value,
  strong
}: {
  label: string;
  value: string;
  strong?: boolean;
}) => (
  <div className={`flex w-[260px] ${strong ? "font-semibold" : ""}`}>
    <span className={`flex-1 ${strong ? "" : "text-text-muted"}`}>{label}</span>
    {value}
  </div>
);
