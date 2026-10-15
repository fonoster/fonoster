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
import { Link } from "react-router-dom";
import { PageHeader } from "~/app/shell/page";
import { DataTable, NameCell, type Column } from "~/components/data/data-table";
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
      header: "Status",
      className: "w-32",
      cell: (s) =>
        s.set ? (
          <Badge variant="success">Set</Badge>
        ) : (
          <Badge variant="warning">Missing</Badge>
        )
    }
  ];
  return (
    <>
      <PageHeader title="Secrets" />
      <div className="flex flex-col gap-5 px-4 pb-8 sm:px-8">
        <p className="font-display text-sm text-muted-foreground">
          Keys are set in{" "}
          {region ? (
            <Link
              to={`/regions/${region.ref}`}
              className="text-foreground underline"
            >
              {region.displayName}
            </Link>
          ) : (
            "your region"
          )}
          , not here.
          {missing > 0 && ` ${missing} missing.`}
        </p>
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
