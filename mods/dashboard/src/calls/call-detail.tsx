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
import type { CallDetailRecord } from "@fonoster/types";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ComingSoon, Panel } from "~/agents/parts";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useCapabilities } from "~/lib/capabilities";
import { GrpcCode, errorMessage, grpcCode } from "~/lib/errors";
import { toDate } from "~/lib/format";
import { cn } from "~/lib/utils";
import { useCall } from "./calls.service";
import {
  DIRECTION_LABEL,
  answeredBy,
  callDirection,
  callParties,
  download,
  formatDuration,
  formatStarted
} from "./format";
import { DirectionIcon, StatusDot } from "./parts";

/** The summary chips under the title are small squared tags, not pills. */
const CHIP = "rounded-[4px] px-2 text-[11px]";

const FULL = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "medium",
  hourCycle: "h23"
});

function fullDate(value: CallDetailRecord["startedAt"]) {
  const date = toDate(value);
  return date ? FULL.format(date) : "—";
}

function Breadcrumb({ current }: { current: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 px-4 pt-7 font-display text-[13px] sm:px-8"
    >
      <Link
        to=".."
        relative="path"
        className="text-muted-foreground hover:text-foreground"
      >
        Calls
      </Link>
      <span className="text-muted-foreground" aria-hidden>
        /
      </span>
      <span aria-current="page" className="truncate font-mono text-foreground">
        {current}
      </span>
    </nav>
  );
}

/** Label and value rows inside a panel. */
function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[112px_1fr] gap-x-3 gap-y-2.5 font-display text-[13px]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-xs leading-5 text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const Mono = ({ children }: { children: ReactNode }) => (
  <span className="font-mono text-xs">{children}</span>
);

export function CallDetail() {
  const { ref = "" } = useParams();
  const call = useCall(ref);
  const { costs } = useCapabilities();
  const short = ref.slice(0, 8);

  if (call.isPending) {
    return (
      <>
        <Breadcrumb current={short || "…"} />
        <div className="flex flex-col gap-4 px-4 py-6 sm:px-8">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  if (call.error) {
    return (
      <>
        <Breadcrumb current={short} />
        <div className="px-4 py-6 sm:px-8">
          <Alert variant="error">
            {grpcCode(call.error) === GrpcCode.NOT_FOUND
              ? "This call doesn't exist in this workspace."
              : errorMessage(call.error)}{" "}
            <Link to=".." relative="path" className="underline">
              Back to calls
            </Link>
          </Alert>
        </div>
      </>
    );
  }

  const record = call.data;
  const { customer, fonosterNumber } = callParties(record);
  const direction = DIRECTION_LABEL[callDirection(record.direction)];
  const amd = answeredBy(record.amdStatus);

  return (
    <>
      <Breadcrumb current={short} />
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 pb-6 pt-4 sm:px-8">
        <div className="flex min-w-0 flex-col gap-3">
          <h1 className="flex items-center gap-3 font-mono text-[22px] leading-tight">
            <DirectionIcon direction={record.direction} className="size-5" />
            {customer}
          </h1>
          <ul aria-label="Summary" className="flex flex-wrap gap-2">
            <li>
              <Badge className={CHIP}>{direction}</Badge>
            </li>
            <li>
              <Badge className={CHIP}>{formatStarted(record.startedAt)}</Badge>
            </li>
            <li>
              <Badge className={cn(CHIP, "font-mono")}>
                {formatDuration(record.duration)}
              </Badge>
            </li>
            <li>
              <Badge className={CHIP}>
                <StatusDot status={record.status} />
              </Badge>
            </li>
            {amd && (
              <li>
                <Badge className={CHIP}>Answered by {amd.toLowerCase()}</Badge>
              </li>
            )}
            <li>
              <Badge className={CHIP}>via {fonosterNumber}</Badge>
            </li>
          </ul>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            download(
              `call-${record.ref}.json`,
              JSON.stringify(record, null, 2) + "\n",
              "application/json"
            )
          }
        >
          Export JSON
        </Button>
      </div>
      <div className="grid gap-5 px-4 pb-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ComingSoon
          title="Recording and transcript"
          description="Play the call back and read it turn by turn, with tool calls, knowledge searches, interruptions and response times."
          missing="Calls don't store their conversation events yet, so there's nothing to replay. The call record on the right is all the API keeps today."
        />
        <div className="flex flex-col gap-5">
          <Panel title="Call record">
            <Facts
              rows={[
                ["Ref", <Mono key="ref">{record.ref}</Mono>],
                ["Started", fullDate(record.startedAt)],
                ["Ended", fullDate(record.endedAt)],
                ["From", <Mono key="from">{record.from}</Mono>],
                ["To", <Mono key="to">{record.to}</Mono>],
                ["Placed by", record.type === "API_ORIGINATED" ? "API" : "SIP"],
                ["Hangup cause", <Mono key="cause">{record.status}</Mono>]
              ]}
            />
          </Panel>
          {amd && (
            <Panel
              title="Answering machine detection"
              description="Who picked up, as the detector saw it."
            >
              <Facts
                rows={[
                  ["Result", amd],
                  ...(record.amdConfidence
                    ? [
                        [
                          "Confidence",
                          `${Math.round(record.amdConfidence * 100)}%`
                        ] as [string, ReactNode]
                      ]
                    : []),
                  ...(record.amdLatencyMs
                    ? [
                        [
                          "Decided in",
                          <Mono key="ms">{record.amdLatencyMs} ms</Mono>
                        ] as [string, ReactNode]
                      ]
                    : []),
                  ...(record.amdDetector
                    ? [["Detector", record.amdDetector] as [string, ReactNode]]
                    : []),
                  ...(record.amdCause
                    ? [["Reason", record.amdCause] as [string, ReactNode]]
                    : [])
                ]}
              />
            </Panel>
          )}
          {costs.display !== "none" && (
            <Panel title="Cost">
              <p className="font-display text-xs text-muted-foreground">
                The split by telephony, speech and model usage is coming soon.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
