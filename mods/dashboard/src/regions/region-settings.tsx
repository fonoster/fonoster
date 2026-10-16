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
import { Alert } from "~/components/ui/alert";
import { errorMessage } from "~/lib/errors";
import { useRegion } from "./api";
import { regionLink } from "./links";
import { StatusDot } from "./status";

/** Settings > Region: one read-only line; a workspace never changes region. */
export function RegionSettings() {
  const { data: region, isPrivate, isLoading, error } = useRegion();
  if (isLoading) return <p>Loading…</p>;
  if (error || !region)
    return (
      <Alert variant="error">
        {errorMessage(error ?? "Couldn't load the region")}
      </Alert>
    );
  return (
    <section
      aria-label="Region"
      className="flex max-w-xl items-center gap-3 font-display text-sm"
    >
      <span className="font-medium">{region.displayName}</span>
      <StatusDot status={region.status} />
      {isPrivate && (
        <Link to={regionLink(region.ref)} className="ml-auto underline">
          View region →
        </Link>
      )}
    </section>
  );
}
