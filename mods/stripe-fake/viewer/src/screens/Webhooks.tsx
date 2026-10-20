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
import { ChevronDown, ChevronRight, RotateCw } from "lucide-react";
import { useState } from "react";
import { control } from "../api";
import { time } from "../format";
import { Button, Mono, PageHeader, Table } from "../ui";
import { DeliveryStatus, eventsById, type ScreenProps } from "./common";

export function Webhooks({ state, run }: ScreenProps) {
  const [open, setOpen] = useState<string>();
  const events = eventsById(state);
  const deliveries = [...state.deliveries].reverse();
  const urls = [...new Set(state.deliveries.map((d) => d.url))];

  return (
    <>
      <PageHeader
        title="Webhooks"
        sub={
          urls.length ? (
            <>Deliveries to {urls.join(", ")}</>
          ) : (
            "No webhook endpoint yet."
          )
        }
      />
      <Table
        columns={[
          { label: "", width: 24 },
          { label: "Event type" },
          { label: "Object ID", width: 200 },
          { label: "Status", width: 120 },
          { label: "Attempts", width: 80 },
          { label: "Time", width: 90 },
          { label: "", width: 90 }
        ]}
        empty="No deliveries yet."
        rows={deliveries.map((d) => {
          const event = events.get(d.event);
          const expanded = open === d.id;
          const Chevron = expanded ? ChevronDown : ChevronRight;
          return {
            key: d.id,
            onClick: () => setOpen(expanded ? undefined : d.id),
            cells: [
              <Chevron key="c" size={14} className="text-text-muted" />,
              <Mono key="t">{event?.type}</Mono>,
              <Mono key="o">{event?.data?.object?.id}</Mono>,
              <DeliveryStatus key="s" d={d} />,
              d.attempts.length,
              <span key="w" className="text-text-muted">
                {time(d.attempts[d.attempts.length - 1]?.at ?? event?.created)}
              </span>,
              <Button
                key="r"
                onClick={() => run(() => control(`webhooks/replay/${d.event}`))}
              >
                <RotateCw size={12} />
                Replay
              </Button>
            ],
            after: expanded && (
              <div className="flex flex-col gap-2.5 bg-muted py-3 pr-4 pb-4 pl-14">
                <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                  {d.attempts.map((a, i) => (
                    <span key={i}>
                      attempt {i + 1} · {a.status || a.error || "no answer"} ·{" "}
                      {time(a.at)}
                    </span>
                  ))}
                  {!d.done && d.nextAt && (
                    <span>next retry {time(d.nextAt)}</span>
                  )}
                </div>
                <pre className="m-0 max-h-80 overflow-auto rounded-md border border-border bg-bg p-3.5 font-mono text-xs">
                  {JSON.stringify(event, null, 2)}
                </pre>
              </div>
            )
          };
        })}
      />
    </>
  );
}
