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
import { PageHeader } from "~/app/shell/page";
import { DataTable, NameCell, type Column } from "~/components/data/data-table";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { useRegion } from "./api";
import type { RegionSecret } from "./types";

/** Secrets of a private workspace: names only; values live in the customer's region (PR-4). */
export function PrivateSecrets() {
  const { data: region, isLoading, error, refetch } = useRegion();
  const secrets = region?.secrets ?? [];
  const missing = secrets.filter((s) => !s.set).length;
  const columns: Column<RegionSecret>[] = [
    { header: "Name", cell: (s) => <NameCell name={s.name} /> },
    {
      header: "Used by",
      cell: (s) => (
        <span className="text-muted-foreground">
          {s.usedBy.join(", ") || "-"}
        </span>
      )
    },
    {
      header: "Status",
      className: "w-48",
      cell: (s) =>
        s.set ? (
          <Badge variant="success">Set in your region</Badge>
        ) : (
          <Badge variant="warning">Missing</Badge>
        )
    }
  ];
  return (
    <>
      <PageHeader
        title="Secrets"
        description="Provider keys for this workspace live in your region, never in Fonoster's cloud."
      />
      <div className="flex flex-col gap-5 px-4 pb-8 sm:px-8">
        <Alert variant="note">
          Set a key on your server with{" "}
          <code>fonoster-region secrets set &lt;name&gt;</code>, or through your
          Helm values or an existing Kubernetes Secret. Values never cross the
          link.
        </Alert>
        {missing > 0 && (
          <Alert variant="warning">
            {missing} {missing === 1 ? "key is" : "keys are"} missing in your
            region. Calls that need {missing === 1 ? "it" : "them"} will fail.
          </Alert>
        )}
        <DataTable
          label="Secrets"
          columns={columns}
          rows={secrets}
          rowKey={(s) => s.name}
          loading={isLoading}
          error={error ? String(error) : undefined}
          onRetry={() => void refetch()}
          empty={
            <p className="p-6 text-sm text-muted-foreground">
              No keys are needed yet.
            </p>
          }
        />
      </div>
    </>
  );
}
