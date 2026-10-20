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
import { ChartPie } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "~/app/shell/page";
import {
  DataTable,
  MutedCell,
  NameCell,
  type Column
} from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { Badge } from "~/components/ui/badge";
import { Select } from "~/components/ui/select";
import {
  formatBytes,
  recentMonths,
  summarize,
  type AiUsageLine
} from "./summary";
import { useUsage } from "./usage.service";

/**
 * What the workspace used (add-usage-metering, dashboard "Usage page"): quantities only, in
 * every edition, whatever billing says. Calls and browser tests apart; AI usage by vendor,
 * model and whose key.
 */
export default function UsageScreen() {
  const months = useMemo(() => recentMonths(), []);
  const [month, setMonth] = useState(months[0].value);
  const period = months.find((m) => m.value === month) ?? months[0];
  const usage = useUsage(period.fromDay, period.toDay);
  const summary = summarize(usage.data ?? []);

  const picker = (
    <Select
      aria-label="Period"
      className="w-44"
      value={month}
      onValueChange={setMonth}
      options={months.map((m) => ({ value: m.value, label: m.label }))}
    />
  );

  const columns: Column<AiUsageLine>[] = [
    {
      header: "Vendor and model",
      cell: (l) => <NameCell name={vendorName(l.provider)} sub={l.model} />
    },
    { header: "Used for", className: "w-48", cell: (l) => l.usedFor },
    {
      header: "Quantity",
      className: "w-64",
      cell: (l) => <span className="font-mono text-[13px]">{l.quantity}</span>
    },
    {
      header: "Key",
      className: "w-36",
      cell: (l) => (
        <Badge>
          {l.keySource === "workspace" ? "Your key" : "Fonoster key"}
        </Badge>
      )
    }
  ];

  const empty = (
    <EmptyState
      icon={ChartPie}
      title={`No usage in ${period.label}.`}
      description="Calls, tests and AI usage show up here after they end."
    />
  );

  return (
    <>
      <PageHeader
        title="Usage"
        description="What this workspace used. Quantities only."
        actions={picker}
      />
      <div className="flex flex-col gap-5 px-4 pb-8 sm:px-8">
        {usage.isSuccess && summary.empty ? (
          empty
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <Total label="Calls" value={summary.callMinutes} unit="min" />
              <Total
                label="Browser tests"
                value={summary.testMinutes}
                unit="min"
              />
              <Total
                label="Noise cancelling"
                value={summary.noiseCancellingMinutes}
                unit="min"
              />
              <Total
                label="Recordings"
                value={summary.recordingMinutes}
                unit="min"
              />
              <Total
                label="Machine detection"
                value={summary.amdDetections}
                unit="detections"
              />
            </div>
            <h2 className="font-display text-[15px] font-semibold">AI usage</h2>
            <DataTable
              label="AI usage"
              columns={columns}
              rows={summary.ai}
              rowKey={(l) =>
                [l.usedFor, l.provider, l.model, l.keySource].join("|")
              }
              loading={usage.isPending}
              error={usage.error}
              onRetry={() => void usage.refetch()}
              empty={<MutedCell>No AI usage in {period.label}.</MutedCell>}
            />
            {summary.storageBytes !== undefined && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3.5 text-[13px]">
                <span>Call records and recordings stored</span>
                <span className="text-muted-foreground">
                  {formatBytes(summary.storageBytes)} at most this month
                </span>
              </div>
            )}
            {summary.ownKeys && (
              <p className="text-xs text-muted-foreground">
                Usage on your own keys is billed by that vendor.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}

function Total({
  label,
  value,
  unit
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card px-[18px] py-4">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold">
          {value.toLocaleString("en-US")}
        </span>
        <span className="text-[13px] text-muted-foreground">{unit}</span>
      </span>
    </div>
  );
}

const VENDORS: Record<string, string> = {
  deepgram: "Deepgram",
  elevenlabs: "ElevenLabs",
  openai: "OpenAI",
  groq: "Groq",
  ollama: "Ollama",
  aicoustics: "ai-coustics",
  fake: "Fake"
};

const vendorName = (provider: string) => VENDORS[provider] ?? provider;
