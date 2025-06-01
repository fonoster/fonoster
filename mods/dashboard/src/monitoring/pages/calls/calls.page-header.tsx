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
import { useCallback } from "react";
import { Button } from "~/core/components/design-system/ui/button/button";
import { PageHeader } from "~/core/components/general/page/page-header";
import { mkConfig, generateCsv, download } from "export-to-csv";
import type { CallDetailRecord } from "@fonoster/types";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";

/**
 * CSV export configuration for call logs.
 *
 * Defines:
 * - Field separator
 * - Decimal separator
 * - Use of keys as headers
 * - Output filename
 */
const csvConfig = mkConfig({
  fieldSeparator: ",",
  decimalSeparator: ".",
  useKeysAsHeaders: true,
  filename: "fonoster-call-logs"
});

/**
 * CallsPageHeader component.
 *
 * Renders the page header for the Voice Calls page, including:
 * - Title and description
 * - A button to export call logs as a CSV file
 *
 * @param {CallDetailRecord[]} data - The call logs data to display and export.
 * @param {boolean} isLoading - Indicates whether the data is still loading.
 * @returns {JSX.Element} The rendered page header component.
 */
export function CallsPageHeader({
  data,
  isLoading
}: {
  data: CallDetailRecord[];
  isLoading: boolean;
}) {
  /**
   * Handles exporting the call logs as a CSV file.
   *
   * - Normalizes date fields to ISO strings.
   * - Generates a CSV using the configured options.
   * - Initiates download of the generated CSV file.
   * - Displays a toast if there are no call logs to export.
   */
  const handleExportData = useCallback(() => {
    if (!data || data.length === 0) {
      toast(
        "Oops! No call logs to export. Start making calls to generate logs."
      );
      return;
    }

    // Normalize date fields to ISO strings to ensure consistency in the exported CSV.
    const normalizedData = data.map((record) => ({
      ...record,
      startedAt:
        record.startedAt instanceof Date
          ? record.startedAt.toISOString()
          : record.startedAt,
      endedAt:
        record.endedAt instanceof Date
          ? record.endedAt.toISOString()
          : record.endedAt
    }));

    // Generate and download the CSV file.
    const csv = generateCsv(csvConfig)(normalizedData);
    download(csvConfig)(csv);
  }, [data]);

  /**
   * Renders the page header component.
   */
  return (
    <PageHeader
      title="Monitoring / Call Logs"
      description="View and inspect call logs generated within your workspace."
      actions={
        <Button
          variant="outlined"
          size="small"
          onClick={handleExportData}
          disabled={isLoading}
        >
          {isLoading ? "Loading calls..." : "Export to CSV"}
        </Button>
      }
    />
  );
}
