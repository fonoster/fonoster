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
import { TriangleAlert } from "lucide-react";
import { dateTime, number } from "../format";
import { Mono, Muted, PageHeader, Section, Table } from "../ui";
import type { ScreenProps } from "./common";

export function Meters({ state }: ScreenProps) {
  const accepted = state.meterEvents.filter((e) => e.status === "accepted");
  const rejected = state.meterEvents.filter((e) => e.status === "rejected");
  const recent = state.meterEvents.slice(-20).reverse();

  return (
    <>
      <PageHeader
        title="Meters"
        sub="Billing Meters and the meter events sent to them."
      />
      <Section title="Meters">
        <Table
          columns={[
            { label: "Event name" },
            { label: "Aggregation", width: 120 },
            { label: "Name", width: 200 },
            { label: "Value", width: 120 },
            { label: "Last event", width: 170 },
            { label: "Rejected", width: 90 }
          ]}
          empty="No meters yet."
          rows={state.meters.map((m) => {
            const mine = accepted.filter((e) => e.eventName === m.event_name);
            return {
              key: m.id,
              cells: [
                <Mono key="n">{m.event_name}</Mono>,
                m.default_aggregation?.formula,
                m.display_name,
                number(mine.reduce((n, e) => n + e.value, 0)),
                dateTime(mine[mine.length - 1]?.timestamp),
                <Muted key="r">
                  {rejected.filter((e) => e.eventName === m.event_name).length}
                </Muted>
              ]
            };
          })}
        />
      </Section>
      <Section title="Recent meter events">
        <Table
          columns={[
            { label: "Identifier" },
            { label: "Event name", width: 240 },
            { label: "Customer", width: 200 },
            { label: "Value", width: 90 },
            { label: "Timestamp", width: 170 },
            { label: "Status", width: 100 }
          ]}
          empty="No meter events yet."
          rows={recent.map((e, i) => ({
            key: `${e.identifier}-${i}`,
            cells: [
              <Mono key="i">{e.identifier}</Mono>,
              <Mono key="n">{e.eventName}</Mono>,
              <Mono key="c">{e.customer ?? "—"}</Mono>,
              number(e.value),
              dateTime(e.timestamp),
              <Muted key="s" danger={e.status === "rejected"}>
                {e.status}
              </Muted>
            ]
          }))}
        />
      </Section>
      {rejected.slice(-3).map((e, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg border border-border p-3 text-xs text-text-muted"
        >
          <TriangleAlert size={14} className="flex-none text-danger" />
          <span>
            <Mono>{e.identifier}</Mono> rejected: {e.error ?? "no reason given"}
            . Stripe reports it with a v1.billing.meter.error_report_triggered
            event.
          </span>
        </div>
      ))}
    </>
  );
}
